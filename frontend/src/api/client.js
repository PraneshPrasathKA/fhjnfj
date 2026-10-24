/**
 * API client for UK Wind Generation Intelligence
 */

const API_BASE = import.meta.env.VITE_API_URL || '';

export async function fetchForecasts(date = '2026-01-15', mode = 'day_ahead') {
  const res = await fetch(`${API_BASE}/api/forecast?date=${date}&mode=${mode}`);
  if (!res.ok) throw new Error(`Failed to fetch forecast: ${res.statusText}`);
  return res.json();
}

export async function fetchForecastEvolution(startTime) {
  const res = await fetch(`${API_BASE}/api/forecast/evolution?startTime=${encodeURIComponent(startTime)}`);
  if (!res.ok) throw new Error(`Failed to fetch evolution: ${res.statusText}`);
  return res.json();
}

export async function fetchAvailableDates() {
  const res = await fetch(`${API_BASE}/api/forecast/dates`);
  if (!res.ok) throw new Error(`Failed to fetch dates: ${res.statusText}`);
  return res.json();
}

export async function fetchActuals(fromTime, toTime, resolution = 'hourly') {
  const res = await fetch(
    `${API_BASE}/api/actuals?from_time=${encodeURIComponent(fromTime)}&to_time=${encodeURIComponent(toTime)}&resolution=${resolution}`
  );
  if (!res.ok) throw new Error(`Failed to fetch actuals: ${res.statusText}`);
  return res.json();
}

export async function fetchAccuracy(fromDate = '2026-01-01', toDate = '2026-01-31', horizonMode = 'day_ahead') {
  const res = await fetch(
    `${API_BASE}/api/accuracy?from_date=${fromDate}&to_date=${toDate}&horizon_mode=${horizonMode}`
  );
  if (!res.ok) throw new Error(`Failed to fetch accuracy metrics: ${res.statusText}`);
  return res.json();
}

export async function fetchHedgingRecommendation(confidence = 90.0, fromDate = '2026-01-01', toDate = '2026-01-31', horizonMode = 'day_ahead') {
  const res = await fetch(
    `${API_BASE}/api/accuracy/hedging-recommendation?confidence=${confidence}&from_date=${fromDate}&to_date=${toDate}&horizon_mode=${horizonMode}`
  );
  if (!res.ok) throw new Error(`Failed to fetch hedging recommendation: ${res.statusText}`);
  return res.json();
}

export async function fetchSystemStatus() {
  const res = await fetch(`${API_BASE}/api/status`);
  if (!res.ok) throw new Error(`Failed to fetch system status: ${res.statusText}`);
  return res.json();
}
