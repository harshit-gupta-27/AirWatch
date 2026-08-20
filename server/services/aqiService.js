import axios from 'axios';
import dotenv from 'dotenv';
import { DELHI_WARDS, DELHI_WARD_COORDINATES } from '../data/delhiWards.js';
import { getAQILevel } from '../utils/aqi.js';
import {
  inferMainPollutant,
  inferSourceBreakdown,
  citySourceDistribution,
  buildRecommendations,
} from '../utils/insights.js';

dotenv.config();

const AQICN_TOKEN = process.env.AQICN_TOKEN?.replace(/^["']|["']$/g, '');
const AQICN_BASE_URL = 'https://api.waqi.info';
const DELHI_BOUNDS = '28.40,76.82,28.90,77.50';
const CACHE_MS = 2 * 60 * 1000;

let dashboardCache = null;

if (AQICN_TOKEN) {
  console.log('AQICN token loaded');
} else {
  console.warn('AQICN_TOKEN is missing. Add it to .env to load live AQI.');
}

function parseAqi(value) {
  const aqi = Number.parseInt(value, 10);
  if (Number.isNaN(aqi) || aqi < 0) return null;
  return aqi;
}

function aqiFromPm25(pm25) {
  const c = Number(pm25);
  if (!Number.isFinite(c) || c < 0) return null;
  let aqi;
  if (c <= 12) aqi = (c / 12) * 50;
  else if (c <= 35.4) aqi = ((c - 12) / (35.4 - 12)) * 50 + 50;
  else if (c <= 55.4) aqi = ((c - 35.4) / (55.4 - 35.4)) * 50 + 100;
  else if (c <= 150.4) aqi = ((c - 55.4) / (150.4 - 55.4)) * 50 + 150;
  else if (c <= 250.4) aqi = ((c - 150.4) / (250.4 - 150.4)) * 100 + 200;
  else aqi = ((c - 250.4) / (350.4 - 250.4)) * 100 + 300;
  return Math.round(aqi);
}

function distanceSq(a, b) {
  const dLat = a.lat - b.lat;
  const dLon = a.lon - b.lon;
  return dLat * dLat + dLon * dLon;
}

function nearestStation(lat, lon, stations) {
  let best = null;
  let bestDist = Infinity;
  for (const station of stations) {
    const dist = distanceSq({ lat, lon }, station);
    if (dist < bestDist) {
      bestDist = dist;
      best = station;
    }
  }
  return best;
}

async function fetchStationsInDelhi() {
  if (!AQICN_TOKEN) {
    throw new Error('AQICN_TOKEN not configured');
  }

  const response = await axios.get(`${AQICN_BASE_URL}/map/bounds/`, {
    params: { latlng: DELHI_BOUNDS, token: AQICN_TOKEN },
    timeout: 15000,
  });

  const payload = response.data;
  if (payload.status !== 'ok' || !Array.isArray(payload.data)) {
    throw new Error(payload.data || 'Unexpected response from AQICN map API');
  }

  const stations = payload.data
    .map((item) => {
      const aqi = parseAqi(item.aqi);
      if (aqi === null) return null;
      return {
        lat: item.lat,
        lon: item.lon,
        aqi,
        name: item.station?.name,
        stationTime: item.station?.time ? new Date(item.station.time) : null,
      };
    })
    .filter(Boolean);

  if (stations.length === 0) {
    throw new Error('No stations with a valid AQI in the Delhi area');
  }

  return stations;
}

async function fetchOpenMeteo(lat, lon) {
  const { data } = await axios.get('https://air-quality-api.open-meteo.com/v1/air-quality', {
    params: {
      latitude: lat,
      longitude: lon,
      current: 'pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,dust',
      timezone: 'Asia/Kolkata',
    },
    timeout: 12000,
  });

  const current = data.current || {};
  return {
    pm25: current.pm2_5,
    pm10: current.pm10,
    co: current.carbon_monoxide,
    no2: current.nitrogen_dioxide,
    so2: current.sulphur_dioxide,
    o3: current.ozone,
    dust: current.dust,
    time: current.time,
  };
}

async function fetchDelhiWeather() {
  try {
    const { data } = await axios.get('https://api.open-meteo.com/v1/forecast', {
      params: {
        latitude: 28.6139,
        longitude: 77.209,
        current: 'wind_speed_10m,relative_humidity_2m,temperature_2m',
        timezone: 'Asia/Kolkata',
      },
      timeout: 10000,
    });
    const current = data.current || {};
    return {
      windSpeed: current.wind_speed_10m,
      humidity: current.relative_humidity_2m,
      temperature: current.temperature_2m,
    };
  } catch (error) {
    console.warn('Weather fetch failed:', error.message);
    return {};
  }
}

export async function fetchAllWardsAQI() {
  const fetchedAt = new Date();
  const [stationsResult, weather] = await Promise.allSettled([
    fetchStationsInDelhi(),
    fetchDelhiWeather(),
  ]);

  const stations = stationsResult.status === 'fulfilled' ? stationsResult.value : [];
  if (stationsResult.status === 'rejected') {
    console.warn('WAQI map failed:', stationsResult.reason.message);
  }

  const weatherData = weather.status === 'fulfilled' ? weather.value : {};

  const meteoResults = await Promise.allSettled(
    DELHI_WARDS.map((ward) => fetchOpenMeteo(ward.lat, ward.lon))
  );

  const results = [];

  DELHI_WARDS.forEach((ward, index) => {
    const meteo = meteoResults[index].status === 'fulfilled' ? meteoResults[index].value : null;
    if (meteoResults[index].status === 'rejected') {
      console.error(`Open-Meteo failed for ${ward.name}:`, meteoResults[index].reason.message);
    }

    const station = stations.length ? nearestStation(ward.lat, ward.lon, stations) : null;
    const components = meteo || {};
    const aqi = station?.aqi || aqiFromPm25(components.pm25);
    if (!aqi) return;

    const sourceBreakdown = inferSourceBreakdown(components);
    const mainPollutant = inferMainPollutant(components);

    results.push({
      name: ward.name,
      population: ward.population,
      aqi,
      level: getAQILevel(aqi),
      mainPollutant,
      components,
      sourceBreakdown,
      sources: sourceBreakdown.slice(0, 3).map((row) => row.name),
      fetchedAt,
      stationTime: station?.stationTime || (components.time ? new Date(components.time) : fetchedAt),
      stationName: station?.name,
      timestamp: fetchedAt,
    });
  });

  if (results.length === 0) {
    throw new Error('Could not load live AQI. Check network access to WAQI and Open-Meteo.');
  }

  return { wards: results, weather: weatherData, fetchedAt };
}

export async function fetchWardAQI(wardName) {
  const dashboard = await getLiveDashboard();
  const ward = dashboard.wards.find((item) => item.name === wardName);
  if (!ward) {
    throw new Error(`Unknown ward: ${wardName}`);
  }
  return ward;
}

export async function getLiveDashboard(force = false) {
  if (!force && dashboardCache && Date.now() - dashboardCache.at < CACHE_MS) {
    return dashboardCache.data;
  }

  const { wards, weather, fetchedAt } = await fetchAllWardsAQI();
  const sourceDistribution = citySourceDistribution(wards);
  const recommendations = buildRecommendations(wards, sourceDistribution, weather);

  const data = {
    wards,
    weather,
    fetchedAt,
    sourceDistribution,
    recommendations,
    sourceNote:
      'Share of each source is estimated from today’s live pollutant mix (Open-Meteo + nearest WAQI station), not a lab source-apportionment study.',
  };

  dashboardCache = { at: Date.now(), data };
  return data;
}

export { DELHI_WARD_COORDINATES, getAQILevel };
