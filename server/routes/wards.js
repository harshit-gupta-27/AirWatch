import express from 'express';
import mongoose from 'mongoose';
import Ward from '../models/Ward.js';
import { getAQILevel } from '../utils/aqi.js';
import { fetchWardAQI, getLiveDashboard } from '../services/aqiService.js';
import { initializeWards, isMongoConnected, persistWards, updateAllWardsAQI } from '../jobs/aqiUpdater.js';
import { DELHI_WARDS } from '../data/delhiWards.js';

const router = express.Router();

function shapeLiveWard(data, complaints = []) {
  const meta = DELHI_WARDS.find((w) => w.name === data.name);
  return {
    _id: data._id || data.name,
    name: data.name,
    aqi: data.aqi,
    level: data.level || getAQILevel(data.aqi),
    population: data.population || meta?.population || 0,
    mainPollutant: data.mainPollutant || 'PM2.5',
    trend: data.trend || 'stable',
    sources: data.sources || [],
    sourceBreakdown: data.sourceBreakdown || [],
    components: data.components || {},
    complaints,
    fetchedAt: data.fetchedAt || data.lastAQIUpdate || new Date(),
    lastAQIUpdate: data.fetchedAt || data.lastAQIUpdate || new Date(),
    stationTime: data.stationTime || null,
    stationName: data.stationName || null,
    previousAQI: data.previousAQI ?? data.aqi,
  };
}

async function livePayload(force = false) {
  const dashboard = await getLiveDashboard(force);
  const complaintsByName = {};

  if (isMongoConnected()) {
    await initializeWards();
    const dbWards = await Ward.find();
    for (const ward of dbWards) {
      complaintsByName[ward.name] = ward.complaints;
    }
    persistWards(dashboard.wards).catch((error) => {
      console.warn('Could not persist live AQI:', error.message);
    });
  }

  return {
    ...dashboard,
    wards: dashboard.wards.map((ward) => shapeLiveWard(ward, complaintsByName[ward.name] || [])),
  };
}

router.get('/', async (req, res) => {
  try {
    const payload = await livePayload();
    if (!payload.wards.length) {
      return res.status(502).json({
        error: 'No live ward data yet. Check AQICN_TOKEN and internet access.',
      });
    }
    res.json(payload.wards);
  } catch (error) {
    console.error('Error fetching wards:', error);
    res.status(500).json({
      error: error.message || 'Could not load ward data',
    });
  }
});

router.post('/update-aqi', async (req, res) => {
  try {
    const result = await updateAllWardsAQI();
    res.json({
      success: true,
      updated: result.updated,
      errors: result.errors,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error updating AQI:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const payload = await livePayload();
    const live = payload.wards.find((ward) => ward.name === id || String(ward._id) === id);
    if (live) return res.json(live);

    if (isMongoConnected()) {
      let ward = null;
      if (mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === id) {
        ward = await Ward.findById(id);
      }
      if (!ward) ward = await Ward.findOne({ name: id });
      if (ward) return res.json(ward);
    }

    const aqiData = await fetchWardAQI(id);
    return res.json(shapeLiveWard({ name: id, ...aqiData }));
  } catch (error) {
    res.status(404).json({ error: error.message || 'Ward not found' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { aqi, ...wardData } = req.body;
    const level = getAQILevel(aqi);
    const ward = new Ward({ ...wardData, aqi, level });
    await ward.save();
    res.status(201).json(ward);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { aqi, ...wardData } = req.body;
    const updateData = { ...wardData };
    if (aqi !== undefined) {
      updateData.aqi = aqi;
      updateData.level = getAQILevel(aqi);
    }
    const ward = await Ward.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!ward) {
      return res.status(404).json({ error: 'Ward not found' });
    }
    res.json(ward);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/:id/complaints', async (req, res) => {
  try {
    if (!isMongoConnected()) {
      return res.status(503).json({
        error: 'MongoDB is not running, so reports cannot be saved yet.',
      });
    }

    await initializeWards();

    const { id } = req.params;
    let ward = null;
    if (mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === id) {
      ward = await Ward.findById(id);
    }
    if (!ward) {
      ward = await Ward.findOne({ name: id });
    }
    if (!ward) {
      return res.status(404).json({ error: 'Ward not found' });
    }

    const type = req.body.type || req.body.issueType;
    const location = (req.body.location || '').trim()
      || (req.body.latitude && req.body.longitude
        ? `${req.body.latitude}, ${req.body.longitude}`
        : 'Not specified');
    const description = (req.body.description || '').trim();

    if (!type || !description) {
      return res.status(400).json({ error: 'Type and description are required' });
    }

    ward.complaints.push({
      type,
      location,
      description,
      reportedBy: req.body.reportedBy || req.body.name || '',
      phone: req.body.phone || '',
      latitude: req.body.latitude,
      longitude: req.body.longitude,
      status: 'pending',
    });
    await ward.save();
    res.status(201).json(ward);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/:id/update-aqi', async (req, res) => {
  try {
    const payload = await livePayload();
    const live = payload.wards.find((item) => String(item._id) === req.params.id || item.name === req.params.id);
    if (!live) {
      return res.status(404).json({ error: 'Ward not found' });
    }
    res.json(live);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export { livePayload };
export default router;
