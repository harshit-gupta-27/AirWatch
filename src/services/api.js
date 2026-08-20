const API_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

export { API_URL };

export async function fetchDashboard({ force = false } = {}) {
  const url = force ? `${API_URL}/dashboard?refresh=1` : `${API_URL}/dashboard`;
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Could not load live data (${response.status})`);
  }
  const data = await response.json();
  if (!Array.isArray(data.wards) || data.wards.length === 0) {
    throw new Error('No ward readings came back from the API.');
  }
  return data;
}

export async function submitComplaint({ wardName, type, location, description, reportedBy, phone, latitude, longitude }) {
  const response = await fetch(`${API_URL}/wards/${encodeURIComponent(wardName)}/complaints`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type,
      location,
      description,
      reportedBy,
      phone,
      latitude,
      longitude,
    }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Could not save the report');
  }
  return data;
}

export function formatFetchedAgo(date) {
  if (!date) return null;
  const mins = Math.max(0, Math.round((Date.now() - new Date(date).getTime()) / 60000));
  if (mins < 1) return 'just now';
  if (mins === 1) return '1 min ago';
  return `${mins} mins ago`;
}
