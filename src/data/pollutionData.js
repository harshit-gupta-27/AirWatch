export const getAQILevel = (aqi) => {
  if (aqi <= 50) return 'good';
  if (aqi <= 100) return 'moderate';
  if (aqi <= 150) return 'unhealthy-sensitive';
  if (aqi <= 200) return 'unhealthy';
  if (aqi <= 300) return 'very-unhealthy';
  return 'hazardous';
};

export const getAQILabel = (level) => {
  const labels = {
    good: 'Good',
    moderate: 'Moderate',
    'unhealthy-sensitive': 'Unhealthy for Sensitive Groups',
    unhealthy: 'Unhealthy',
    'very-unhealthy': 'Very Unhealthy',
    hazardous: 'Hazardous',
  };
  return labels[level];
};

export const getAQIColor = (level) => {
  const colors = {
    good: 'bg-aqi-good',
    moderate: 'bg-aqi-moderate',
    'unhealthy-sensitive': 'bg-aqi-unhealthy-sensitive',
    unhealthy: 'bg-aqi-unhealthy',
    'very-unhealthy': 'bg-aqi-very-unhealthy',
    hazardous: 'bg-aqi-hazardous',
  };
  return colors[level];
};

export const getTextAQIColor = (level) => {
  const colors = {
    good: 'text-aqi-good',
    moderate: 'text-aqi-moderate',
    'unhealthy-sensitive': 'text-aqi-unhealthy-sensitive',
    unhealthy: 'text-aqi-unhealthy',
    'very-unhealthy': 'text-aqi-very-unhealthy',
    hazardous: 'text-aqi-hazardous',
  };
  return colors[level];
};

/** Ward names used in forms; live AQI comes from the API. */
export const wardOptions = [
  'Connaught Place',
  'Anand Vihar',
  'Dwarka',
  'Karol Bagh',
  'Vasant Kunj',
  'Chandni Chowk',
  'ITO',
  'Rohini',
  'Yamuna Vihar',
  'Noida Border',
  'North Campus',
  'Sarojini Nagar',
];
