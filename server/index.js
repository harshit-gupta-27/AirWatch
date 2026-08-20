import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import wardRoutes from './routes/wards.js';
import chatRoutes from './routes/chat.js';
import dashboardRoutes from './routes/dashboard.js';
import { updateAllWardsAQI, initializeWards } from './jobs/aqiUpdater.js';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3001;

app.use(cors({
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/airwatch';

mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('MongoDB connected');
    try {
      await initializeWards();
      const result = await updateAllWardsAQI();
      console.log(`Loaded AQI for ${result.updated} wards`);
    } catch (error) {
      console.warn('Startup AQI fetch failed:', error.message);
      console.warn('Wards will still load; live values retry every 5 minutes.');
    }
  })
  .catch((err) => {
    console.warn('MongoDB not available:', err.message);
    console.warn('API will serve live AQICN data without a database.');
  });

app.use('/api/wards', wardRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/insights', dashboardRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    mongo: mongoose.connection.readyState === 1,
  });
});

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);

  const UPDATE_INTERVAL = 5 * 60 * 1000;
  setInterval(async () => {
    try {
      const result = await updateAllWardsAQI();
      console.log(`Scheduled AQI update: ${result.updated} wards`);
    } catch (error) {
      console.error('Scheduled AQI update failed:', error.message);
    }
  }, UPDATE_INTERVAL);
});
