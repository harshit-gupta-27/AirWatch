import express from 'express';
import { livePayload } from './wards.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const force = req.query.refresh === '1' || req.query.refresh === 'true';
    const payload = await livePayload(force);
    res.json({
      fetchedAt: payload.fetchedAt,
      weather: payload.weather,
      sourceNote: payload.sourceNote,
      sourceDistribution: payload.sourceDistribution,
      recommendations: payload.recommendations,
      wards: payload.wards,
    });
  } catch (error) {
    console.error('Error building dashboard:', error);
    res.status(500).json({ error: error.message || 'Could not load live insights' });
  }
});

export default router;
