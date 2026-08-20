import mongoose from 'mongoose';

const complaintSchema = new mongoose.Schema({
  type: { type: String, required: true },
  location: { type: String, required: true },
  description: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'in-progress', 'resolved'],
    default: 'pending'
  },
  date: { type: Date, default: Date.now },
  reportedBy: String,
  phone: String,
  latitude: Number,
  longitude: Number,
});

const wardSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  aqi: { type: Number, required: true },
  level: {
    type: String,
    enum: ['good', 'moderate', 'unhealthy-sensitive', 'unhealthy', 'very-unhealthy', 'hazardous'],
    required: true
  },
  population: { type: Number, required: true },
  mainPollutant: { type: String, required: true },
  trend: {
    type: String,
    enum: ['improving', 'stable', 'worsening'],
    default: 'stable'
  },
  sources: [String],
  sourceBreakdown: [{
    name: String,
    percentage: Number,
    color: String,
  }],
  components: {
    pm25: Number,
    pm10: Number,
    no2: Number,
    so2: Number,
    co: Number,
    o3: Number,
    dust: Number,
  },
  complaints: [complaintSchema],
  lastAQIUpdate: { type: Date, default: Date.now },
  fetchedAt: { type: Date, default: Date.now },
  stationTime: Date,
  previousAQI: Number,
}, {
  timestamps: true
});

export default mongoose.model('Ward', wardSchema);

