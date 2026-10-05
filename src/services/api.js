const BASE_URL = 'http://localhost:5000/api';

async function apiCall(endpoint, options = {}) {
  try {
    const headers = {};
    if (options.method === 'POST' || options.method === 'PUT') {
      headers['Content-Type'] = 'application/json';
    }
    const res = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers: { ...headers, ...options.headers } });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Request failed');
    return json.data;
  } catch (err) {
    console.warn(`[API] ${options.method || 'GET'} ${endpoint} failed:`, err.message);
    return null;
  }
}

// ── Disasters ────────────────────────────────────────────────────────────────

export async function fetchDisasters() {
  return apiCall('/disasters');
}

export async function createDisaster(disaster) {
  return apiCall('/disasters', { method: 'POST', body: JSON.stringify(disaster) });
}

export async function updateDisaster(id, updates) {
  return apiCall(`/disasters/${id}`, { method: 'PUT', body: JSON.stringify(updates) });
}

export async function deleteDisaster(id) {
  return apiCall(`/disasters/${id}`, { method: 'DELETE' });
}

// ── Teams ────────────────────────────────────────────────────────────────────

export async function fetchTeams() {
  return apiCall('/teams');
}

export async function fetchTeam(id) {
  return apiCall(`/teams/${id}`);
}

export async function deployTeam(id, location, mission) {
  return apiCall(`/teams/${id}/deploy`, { method: 'POST', body: JSON.stringify({ location, mission }) });
}

export async function recallTeam(id) {
  return apiCall(`/teams/${id}/recall`, { method: 'POST' });
}

export async function updateTeam(id, updates) {
  return apiCall(`/teams/${id}`, { method: 'PUT', body: JSON.stringify(updates) });
}

// ── Hospitals ────────────────────────────────────────────────────────────────

export async function fetchHospitals() {
  return apiCall('/hospitals');
}

export async function updateHospital(id, updates) {
  return apiCall(`/hospitals/${id}`, { method: 'PUT', body: JSON.stringify(updates) });
}

export async function dispatchAmbulance(id) {
  return apiCall(`/hospitals/${id}/dispatch-ambulance`, { method: 'POST' });
}

// ── Alerts ───────────────────────────────────────────────────────────────────

export async function fetchAlerts(priority) {
  const query = priority ? `?priority=${encodeURIComponent(priority)}` : '';
  return apiCall(`/alerts${query}`);
}

export async function createAlert(alert) {
  return apiCall('/alerts', { method: 'POST', body: JSON.stringify(alert) });
}

export async function deleteAlert(id) {
  return apiCall(`/alerts/${id}`, { method: 'DELETE' });
}

// ── SOS Beacons ──────────────────────────────────────────────────────────────

export async function fetchSOSBeacons() {
  return apiCall('/sos');
}

export async function createSOS(sos) {
  return apiCall('/sos', { method: 'POST', body: JSON.stringify(sos) });
}

export async function assignSOSTeam(sosId, teamId) {
  return apiCall(`/sos/${sosId}/assign`, { method: 'PUT', body: JSON.stringify({ teamId }) });
}

export async function resolveSOS(sosId) {
  return apiCall(`/sos/${sosId}/resolve`, { method: 'PUT' });
}

// ── Dams ─────────────────────────────────────────────────────────────────────

export async function fetchDams() {
  return apiCall('/dams');
}

export async function fetchDam(id) {
  return apiCall(`/dams/${id}`);
}

export async function updateDam(id, updates) {
  return apiCall(`/dams/${id}`, { method: 'PUT', body: JSON.stringify(updates) });
}

// ── Missions ─────────────────────────────────────────────────────────────────

export async function fetchMissions() {
  return apiCall('/missions');
}

export async function createMission(mission) {
  return apiCall('/missions', { method: 'POST', body: JSON.stringify(mission) });
}

// ── Tasks ────────────────────────────────────────────────────────────────────

export async function fetchTasks() {
  return apiCall('/tasks');
}

export async function createTask(task) {
  return apiCall('/tasks', { method: 'POST', body: JSON.stringify(task) });
}

export async function updateTask(id, updates) {
  return apiCall(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(updates) });
}

export async function deleteTask(id) {
  return apiCall(`/tasks/${id}`, { method: 'DELETE' });
}

// ── Predictions ──────────────────────────────────────────────────────────────

export async function fetchPredictions(filters = {}) {
  const params = new URLSearchParams();
  if (filters.type) params.set('type', filters.type);
  if (filters.severity) params.set('severity', filters.severity);
  if (filters.minProbability) params.set('minProbability', filters.minProbability);
  const query = params.toString() ? `?${params.toString()}` : '';
  // Return full response (data + meta) for staleness tracking
  try {
    const res = await fetch(`${BASE_URL}/predictions${query}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Request failed');
    return { predictions: json.data, meta: json.meta };
  } catch (err) {
    console.warn('[API] GET /predictions failed:', err.message);
    return { predictions: [], meta: null };
  }
}

export async function fetchPredictionHistory(limit = 50) {
  return apiCall(`/predictions/history?limit=${limit}`);
}

export async function fetchPredictionSummary() {
  return apiCall('/predictions/summary');
}

export async function refreshPredictions() {
  return apiCall('/predictions/refresh', { method: 'POST' });
}

export async function fetchPrediction(id) {
  return apiCall(`/predictions/${id}`);
}

// ── Scraper (Real Data from Scrapling) ──────────────────────────────────────

export async function fetchScraperStatus() {
  return apiCall('/scraper/status');
}

export async function triggerFullScrape() {
  return apiCall('/scraper/sync-all', { method: 'POST' });
}

export async function syncScrapedDams() {
  return apiCall('/scraper/sync-dams', { method: 'POST' });
}

export async function syncWeatherWarnings() {
  return apiCall('/scraper/sync-weather', { method: 'POST' });
}

export async function fetchCycloneBulletins() {
  return apiCall('/scraper/cyclone-bulletins');
}

export async function fetchRiverLevels() {
  return apiCall('/scraper/river-levels');
}

export async function syncNDMAAlerts() {
  return apiCall('/scraper/sync-ndma', { method: 'POST' });
}

export async function syncScrapedHospitals() {
  return apiCall('/scraper/sync-hospitals', { method: 'POST' });
}

export async function fetchDisasterNews() {
  return apiCall('/scraper/news');
}

export async function fetchBloodBanks() {
  return apiCall('/scraper/blood-banks');
}

// ── Health Check ─────────────────────────────────────────────────────────────

export async function checkHealth() {
  try {
    const res = await fetch(`${BASE_URL}/health`);
    const json = await res.json();
    return json.success === true;
  } catch {
    return false;
  }
}
