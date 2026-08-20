import { getLiveDashboard } from '../services/aqiService.js';
import Ward from '../models/Ward.js';
import { getAQILevel, calculateAQITrend } from '../utils/aqi.js';
import { DELHI_WARDS } from '../data/delhiWards.js';
import mongoose from 'mongoose';

function isMongoConnected() {
  return mongoose.connection.readyState === 1;
}

export async function persistWards(aqiData) {
  if (!isMongoConnected()) {
    return { updated: 0, errors: 0 };
  }

  let updatedCount = 0;
  let errorCount = 0;

  for (const data of aqiData) {
    try {
      const ward = await Ward.findOne({ name: data.name });
      if (!ward) {
        console.warn(`Ward not in database: ${data.name}`);
        continue;
      }

      const trend = calculateAQITrend(ward.previousAQI ?? ward.aqi, data.aqi);

      ward.previousAQI = ward.aqi;
      ward.aqi = data.aqi;
      ward.level = data.level || getAQILevel(data.aqi);
      ward.mainPollutant = data.mainPollutant || 'PM2.5';
      ward.sources = data.sources || [];
      ward.sourceBreakdown = data.sourceBreakdown || [];
      ward.components = data.components || {};
      ward.trend = trend;
      ward.lastAQIUpdate = data.fetchedAt || new Date();
      ward.fetchedAt = data.fetchedAt || new Date();
      ward.stationTime = data.stationTime || null;
      await ward.save();
      updatedCount += 1;
    } catch (error) {
      console.error(`Failed to update ${data.name}:`, error.message);
      errorCount += 1;
    }
  }

  return { updated: updatedCount, errors: errorCount };
}

export async function updateAllWardsAQI() {
  const dashboard = await getLiveDashboard(true);
  const persist = await persistWards(dashboard.wards);
  return { ...persist, wards: dashboard.wards };
}

export async function initializeWards() {
  if (!isMongoConnected()) return;

  let initializedCount = 0;
  for (const wardData of DELHI_WARDS) {
    const existingWard = await Ward.findOne({ name: wardData.name });
    if (existingWard) continue;

    await Ward.create({
      name: wardData.name,
      aqi: 0,
      level: 'good',
      population: wardData.population,
      mainPollutant: 'PM2.5',
      trend: 'stable',
      sources: [],
      complaints: [],
      previousAQI: 0,
      lastAQIUpdate: new Date(0),
    });
    initializedCount += 1;
  }

  if (initializedCount > 0) {
    console.log(`Added ${initializedCount} missing wards`);
  }
}

export { isMongoConnected };
