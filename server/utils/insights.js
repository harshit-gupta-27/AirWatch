const SOURCE_COLORS = {
  'Vehicular Emissions': 'hsl(168, 60%, 28%)',
  Industrial: 'hsl(38, 92%, 50%)',
  'Construction Dust': 'hsl(16, 90%, 50%)',
  'Waste Burning': 'hsl(350, 80%, 50%)',
  'Domestic Cooking': 'hsl(200, 50%, 40%)',
  Other: 'hsl(150, 15%, 45%)',
};

function n(value) {
  const num = Number(value);
  return Number.isFinite(num) && num > 0 ? num : 0;
}

/** Rough sub-index so gases and particles are comparable (WHO / common breakpoints). */
function pollutantScores(components = {}) {
  return {
    'PM2.5': n(components.pm25) / 15,
    PM10: n(components.pm10) / 45,
    NO2: n(components.no2) / 25,
    SO2: n(components.so2) / 40,
    O3: n(components.o3) / 100,
    CO: n(components.co) / 4000,
  };
}

export function inferMainPollutant(components = {}) {
  const scores = pollutantScores(components);
  return Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];
}

export function inferSourceBreakdown(components = {}) {
  const pm25 = n(components.pm25);
  const pm10 = n(components.pm10);
  const no2 = n(components.no2);
  const so2 = n(components.so2);
  const co = n(components.co);
  const o3 = n(components.o3);
  const dust = n(components.dust);
  const coarse = Math.max(0, pm10 - pm25);

  // Relative weights from the live mix — not a lab apportionment study.
  const weights = {
    'Vehicular Emissions': (no2 / 25) * 0.65 + (co / 4000) * 0.35,
    Industrial: so2 / 40,
    'Construction Dust': (dust / 50) * 0.6 + (coarse / 50) * 0.4,
    'Waste Burning': (pm25 / 35) * (no2 < 40 ? 0.85 : 0.35),
    'Domestic Cooking': (pm25 / 35) * 0.1,
    Other: (o3 / 100) * 0.2 + 0.05,
  };

  const total = Object.values(weights).reduce((sum, value) => sum + value, 0) || 1;

  return Object.entries(weights)
    .map(([name, value]) => ({
      name,
      percentage: Math.max(1, Math.round((value / total) * 100)),
      color: SOURCE_COLORS[name],
    }))
    .sort((a, b) => b.percentage - a.percentage)
    .map((item, index, list) => {
      if (index !== list.length - 1) return item;
      const used = list.slice(0, -1).reduce((sum, row) => sum + row.percentage, 0);
      return { ...item, percentage: Math.max(1, 100 - used) };
    });
}

export function citySourceDistribution(wards) {
  const totals = {};

  for (const ward of wards) {
    for (const row of ward.sourceBreakdown || []) {
      totals[row.name] = (totals[row.name] || 0) + row.percentage;
    }
  }

  const names = Object.keys(totals);
  if (names.length === 0) return [];

  const sum = names.reduce((acc, name) => acc + totals[name], 0) || 1;
  return names
    .map((name) => ({
      name,
      percentage: Math.max(1, Math.round((totals[name] / sum) * 100)),
      color: SOURCE_COLORS[name],
    }))
    .sort((a, b) => b.percentage - a.percentage)
    .map((item, index, list) => {
      if (index !== list.length - 1) return item;
      const used = list.slice(0, -1).reduce((sum, row) => sum + row.percentage, 0);
      return { ...item, percentage: Math.max(1, 100 - used) };
    });
}

export function buildRecommendations(wards, sources, weather = {}) {
  const sorted = [...wards].sort((a, b) => b.aqi - a.aqi);
  const worst = sorted.slice(0, 3);
  const unhealthy = sorted.filter((ward) => ward.aqi > 150);
  const sensitive = sorted.filter((ward) => ward.aqi > 100);
  const topSources = sources.slice(0, 3).map((s) => s.name);
  const hasSource = (name) => topSources.includes(name);
  const byPollutant = (name) =>
    sorted.filter((ward) => String(ward.mainPollutant).toUpperCase().includes(name.toUpperCase())).slice(0, 4);
  const wind = n(weather.windSpeed);
  const recs = [];

  if (unhealthy.length > 0) {
    recs.push({
      id: 'health-advisory',
      title: 'Issue a health advisory in the worst-hit wards',
      description: `${unhealthy.map((w) => w.name).join(', ')} are currently in the unhealthy range (peak AQI ${worst[0]?.aqi}). Ask schools and outdoor workers there to cut strenuous activity until the next drop in readings.`,
      priority: 'high',
      category: 'policy',
      targetWards: unhealthy.map((w) => w.name),
    });
  } else if (sensitive.length > 0) {
    recs.push({
      id: 'sensitive-advisory',
      title: 'Warn sensitive groups in elevated-AQI wards',
      description: `${sensitive.map((w) => w.name).join(', ')} are above 100 AQI right now. People with asthma or heart conditions should keep outdoor time short.`,
      priority: 'high',
      category: 'policy',
      targetWards: sensitive.map((w) => w.name),
    });
  }

  if (hasSource('Vehicular Emissions') || byPollutant('NO2').length > 0) {
    const targets = byPollutant('NO2');
    const names = (targets.length ? targets : worst).map((w) => w.name);
    recs.push({
      id: 'traffic',
      title: 'Ease peak-hour traffic where vehicle gases are high',
      description: `Live mix points to road traffic around ${names.slice(0, 3).join(', ')}. Cutting idling and diesel buses in those pockets will move the needle faster than a city-wide notice.`,
      priority: 'high',
      category: 'policy',
      targetWards: names,
    });
  }

  if (hasSource('Construction Dust') || byPollutant('PM10').length > 0) {
    const targets = byPollutant('PM10');
    const names = (targets.length ? targets : worst).map((w) => w.name);
    recs.push({
      id: 'dust',
      title: 'Cover construction and suppress dust',
      description: `Dust / coarse particles are elevated in ${names.slice(0, 3).join(', ')}. Enforce site covers, wheel washing, and water spraying on open plots for the next 24 hours.`,
      priority: 'high',
      category: 'infrastructure',
      targetWards: names,
    });
  }

  if (hasSource('Waste Burning') || byPollutant('PM2.5').length > 0) {
    const names = worst.map((w) => w.name);
    recs.push({
      id: 'burning',
      title: 'Stop open burning while fine particles are high',
      description: `PM2.5 is driving much of today's load. Night patrols against garbage and biomass burning in ${names.slice(0, 3).join(', ')} are the most direct local action.`,
      priority: 'high',
      category: 'enforcement',
      targetWards: names,
    });
  }

  if (hasSource('Industrial') || byPollutant('SO2').length > 0) {
    const names = (byPollutant('SO2').length ? byPollutant('SO2') : worst).map((w) => w.name);
    recs.push({
      id: 'industry',
      title: 'Check industrial stacks near high SO2 pockets',
      description: `Sulphur dioxide is showing up in the live mix near ${names.slice(0, 3).join(', ')}. Ask nearby units to share CEMS readings for this window.`,
      priority: 'medium',
      category: 'enforcement',
      targetWards: names,
    });
  }

  if (wind > 0 && wind < 8 && (worst[0]?.aqi || 0) > 100) {
    recs.push({
      id: 'stagnation',
      title: 'Account for weak wind while planning outdoor work',
      description: `Wind is around ${Math.round(wind)} km/h, so pollutants are not dispersing well. Delay road cutting and demolition in ${worst.slice(0, 3).map((w) => w.name).join(', ')} until wind picks up.`,
      priority: 'medium',
      category: 'infrastructure',
      targetWards: worst.map((w) => w.name),
    });
  }

  recs.push({
    id: 'public',
    title: "Share today's ward list with residents",
    description: `City average AQI is ${Math.round(wards.reduce((s, w) => s + w.aqi, 0) / Math.max(wards.length, 1))}. Ask people in ${worst.map((w) => w.name).join(', ')} to use N95s outdoors and keep windows closed during peak hours.`,
    priority: 'medium',
    category: 'awareness',
    targetWards: worst.map((w) => w.name),
  });

  const seen = new Set();
  return recs.filter((rec) => {
    if (seen.has(rec.id) || rec.targetWards.length === 0) return false;
    seen.add(rec.id);
    return true;
  });
}
