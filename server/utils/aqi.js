export function getAQILevel(aqi) {
  if (aqi <= 50) return 'good';
  if (aqi <= 100) return 'moderate';
  if (aqi <= 150) return 'unhealthy-sensitive';
  if (aqi <= 200) return 'unhealthy';
  if (aqi <= 300) return 'very-unhealthy';
  return 'hazardous';
}

export function calculateAQITrend(oldAQI, newAQI) {
  if (oldAQI === undefined || oldAQI === null) return 'stable';
  if (newAQI < oldAQI - 5) return 'improving';
  if (newAQI > oldAQI + 5) return 'worsening';
  return 'stable';
}
