export const DELHI_WARDS = [
  { name: 'Connaught Place', lat: 28.6315, lon: 77.2167, population: 52000 },
  { name: 'Anand Vihar', lat: 28.6469, lon: 77.3164, population: 38000 },
  { name: 'Dwarka', lat: 28.5921, lon: 77.046, population: 65000 },
  { name: 'Karol Bagh', lat: 28.6517, lon: 77.1903, population: 41000 },
  { name: 'Vasant Kunj', lat: 28.5245, lon: 77.1558, population: 28000 },
  { name: 'Chandni Chowk', lat: 28.6507, lon: 77.2334, population: 47000 },
  { name: 'ITO', lat: 28.6255, lon: 77.2433, population: 55000 },
  { name: 'Rohini', lat: 28.7041, lon: 77.1025, population: 72000 },
  { name: 'Yamuna Vihar', lat: 28.68, lon: 77.28, population: 33000 },
  { name: 'Noida Border', lat: 28.5355, lon: 77.391, population: 45000 },
  { name: 'North Campus', lat: 28.69, lon: 77.21, population: 35000 },
  { name: 'Sarojini Nagar', lat: 28.57, lon: 77.2, population: 49000 },
];

export const DELHI_WARD_COORDINATES = Object.fromEntries(
  DELHI_WARDS.map((ward) => [ward.name, { lat: ward.lat, lon: ward.lon }])
);
