/**
 * RESQAI Insurance Risk API
 * POST/GET /api/risk-score
 *
 * B2B API for insurers (HDFC ERGO, Bajaj Allianz, ICICI Lombard).
 * Pricing: ₹20–₹50 per call depending on tier.
 * Returns instant flood/disaster risk score for any lat/lng in Tamil Nadu.
 */

const express = require('express');
const router = express.Router();
const { computeRiskScore } = require('../services/riskEngine');
const { readDB, writeDB } = require('../db');

// ── Demo API Keys ─────────────────────────────────────────────────────────────
// In production, these would be stored encrypted in a database.
const DEMO_API_KEYS = {
  'HDFC-DEMO-KEY-2024':      { client: 'HDFC ERGO',          tier: 'premium', pricePerCall: 50, rateLimit: 1000 },
  'BAJAJ-DEMO-KEY-2024':     { client: 'Bajaj Allianz',      tier: 'standard', pricePerCall: 35, rateLimit: 500 },
  'ICICI-DEMO-KEY-2024':     { client: 'ICICI Lombard',      tier: 'standard', pricePerCall: 35, rateLimit: 500 },
  'RESQ-PUBLIC-DEMO':        { client: 'Demo / Public',       tier: 'free', pricePerCall: 0,  rateLimit: 20  },
};

// ── In-memory usage log (persisted to usage.json) ────────────────────────────
function getUsageDB() {
  try { return readDB('apiUsage.json') || []; } catch { return []; }
}

function logUsage(apiKey, keyInfo, lat, lng, responseMs, riskScore) {
  const log = getUsageDB();
  log.unshift({
    id: `call_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
    client: keyInfo.client,
    tier: keyInfo.tier,
    priceINR: keyInfo.pricePerCall,
    lat, lng,
    responseMs,
    riskScore,
    apiKey: apiKey.slice(0, 8) + '****',
  });
  // Keep last 500 entries
  writeDB('apiUsage.json', log.slice(0, 500));
}

// ── API Key Middleware ────────────────────────────────────────────────────────
function requireApiKey(req, res, next) {
  // Accept key from header OR query param (for easy demo testing)
  const key = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '') || req.query.api_key;

  if (!key) {
    return res.status(401).json({
      success: false,
      error: 'Missing API key. Pass X-Api-Key header or ?api_key= query param.',
      hint: 'Demo key: RESQ-PUBLIC-DEMO',
    });
  }

  const keyInfo = DEMO_API_KEYS[key];
  if (!keyInfo) {
    return res.status(403).json({
      success: false,
      error: 'Invalid API key.',
      hint: 'Contact team@resqai.in for access.',
    });
  }

  req.apiKey = key;
  req.apiClient = keyInfo;
  next();
}

// ── GET /api/risk-score ───────────────────────────────────────────────────────
// Quick endpoint: ?lat=13.08&lng=80.27&api_key=RESQ-PUBLIC-DEMO
router.get('/', requireApiKey, async (req, res) => {
  const lat = parseFloat(req.query.lat);
  const lng = parseFloat(req.query.lng);

  if (isNaN(lat) || isNaN(lng)) {
    return res.status(400).json({ success: false, error: 'lat and lng query params are required and must be numeric.' });
  }

  if (lat < 8.0 || lat > 14.0 || lng < 76.0 || lng > 81.0) {
    return res.status(400).json({ success: false, error: 'Coordinates out of Tamil Nadu bounds (lat 8–14, lng 76–81).' });
  }

  const t0 = Date.now();
  try {
    const result = await computeRiskScore(lat, lng);
    const ms = Date.now() - t0;
    logUsage(req.apiKey, req.apiClient, lat, lng, ms, result.riskScore);

    res.json({
      success: true,
      client: req.apiClient.client,
      tier: req.apiClient.tier,
      billed: `₹${req.apiClient.pricePerCall}`,
      data: formatInsuranceResponse(result, ms),
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST /api/risk-score ──────────────────────────────────────────────────────
// Body: { lat, lng, propertyType?, buildingValue? }
router.post('/', requireApiKey, async (req, res) => {
  const { lat, lng, propertyType = 'commercial', buildingValue } = req.body;

  if (!lat || !lng) {
    return res.status(400).json({ success: false, error: 'Request body must include lat and lng.' });
  }

  const latN = parseFloat(lat);
  const lngN = parseFloat(lng);

  if (isNaN(latN) || isNaN(lngN)) {
    return res.status(400).json({ success: false, error: 'lat and lng must be numeric.' });
  }
  if (latN < 8.0 || latN > 14.0 || lngN < 76.0 || lngN > 81.0) {
    return res.status(400).json({ success: false, error: 'Coordinates out of Tamil Nadu bounds.' });
  }

  const t0 = Date.now();
  try {
    const result = await computeRiskScore(latN, lngN);
    const ms = Date.now() - t0;
    logUsage(req.apiKey, req.apiClient, latN, lngN, ms, result.riskScore);

    // Optional premium loading calculation
    let premiumSuggestion = null;
    if (buildingValue) {
      const val = parseFloat(buildingValue);
      if (!isNaN(val)) {
        const baseRate = 0.001; // 0.1% base
        const riskMultiplier = 1 + (result.riskScore / 100) * 4; // up to 5x for extreme risk
        premiumSuggestion = {
          annualPremium: Math.round(val * baseRate * riskMultiplier),
          loadingFactor: Math.round(riskMultiplier * 100) / 100,
          currency: 'INR',
          note: `Computed at ${riskMultiplier.toFixed(2)}x loading for Risk Grade ${result.riskGrade}`,
        };
      }
    }

    res.json({
      success: true,
      client: req.apiClient.client,
      tier: req.apiClient.tier,
      billed: `₹${req.apiClient.pricePerCall}`,
      data: {
        ...formatInsuranceResponse(result, ms),
        propertyType,
        premiumSuggestion,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST /api/risk-score/batch ────────────────────────────────────────────────
// Body: { locations: [{ lat, lng, id? }, ...] }  (max 10 per call)
router.post('/batch', requireApiKey, async (req, res) => {
  const { locations } = req.body;
  if (!Array.isArray(locations) || locations.length === 0) {
    return res.status(400).json({ success: false, error: 'Body must include a locations array.' });
  }
  if (locations.length > 10) {
    return res.status(400).json({ success: false, error: 'Batch limit is 10 locations per request.' });
  }

  const t0 = Date.now();
  const results = await Promise.all(
    locations.map(async (loc) => {
      try {
        const r = await computeRiskScore(parseFloat(loc.lat), parseFloat(loc.lng));
        return { id: loc.id || null, lat: loc.lat, lng: loc.lng, ...formatInsuranceResponse(r, 0) };
      } catch (err) {
        return { id: loc.id || null, lat: loc.lat, lng: loc.lng, error: err.message };
      }
    })
  );

  const ms = Date.now() - t0;
  const totalBill = req.apiClient.pricePerCall * locations.length;

  res.json({
    success: true,
    client: req.apiClient.client,
    tier: req.apiClient.tier,
    billed: `₹${totalBill} (${locations.length} × ₹${req.apiClient.pricePerCall})`,
    computeTimeMs: ms,
    results,
  });
});

// ── GET /api/risk-score/usage ─────────────────────────────────────────────────
router.get('/usage', requireApiKey, (req, res) => {
  const log = getUsageDB();
  // Filter to this client only
  const myUsage = log.filter(u => u.client === req.apiClient.client);
  const totalCalls = myUsage.length;
  const totalBilled = myUsage.reduce((s, u) => s + u.priceINR, 0);
  const avgResponseMs = myUsage.length
    ? Math.round(myUsage.reduce((s, u) => s + u.responseMs, 0) / myUsage.length)
    : 0;

  res.json({
    success: true,
    client: req.apiClient.client,
    tier: req.apiClient.tier,
    usage: {
      totalCalls,
      totalBilledINR: totalBilled,
      avgResponseMs,
      recentCalls: myUsage.slice(0, 20),
    },
  });
});

// ── GET /api/risk-score/admin-usage ──────────────────────────────────────────
// Internal admin endpoint (no API key check, restrict in prod)
router.get('/admin-usage', (req, res) => {
  const log = getUsageDB();
  const byClient = {};
  for (const u of log) {
    if (!byClient[u.client]) byClient[u.client] = { calls: 0, revenue: 0, avgMs: 0, msSum: 0 };
    byClient[u.client].calls++;
    byClient[u.client].revenue += u.priceINR;
    byClient[u.client].msSum += u.responseMs;
  }
  for (const c of Object.values(byClient)) {
    c.avgMs = c.calls > 0 ? Math.round(c.msSum / c.calls) : 0;
    delete c.msSum;
  }

  res.json({
    success: true,
    totalCalls: log.length,
    totalRevenue: log.reduce((s, u) => s + u.priceINR, 0),
    byClient,
    recentCalls: log.slice(0, 50),
  });
});

// ── Helper ────────────────────────────────────────────────────────────────────
function formatInsuranceResponse(result, ms) {
  return {
    location: result.location,
    riskScore: result.riskScore,
    riskGrade: result.riskGrade,
    riskLabel: result.riskLabel,
    floodZoneClass: result.floodZoneClass,
    insurabilityNote: result.insurabilityNote,
    breakdown: {
      damProximity:    { score: result.breakdown.damProximity.score,    max: 25 },
      floodZone:       { score: result.breakdown.floodZone.score,       max: 20 },
      lakebed:         { score: result.breakdown.lakebed.score,         max: 15 },
      earthquake:      { score: result.breakdown.earthquake.score,      max: 15 },
      weather:         { score: result.breakdown.weather.score,         max: 15 },
      soil:            { score: result.breakdown.soil.score,            max: 12 },
      coastal:         { score: result.breakdown.coastal.score,         max: 10 },
      infrastructure:  { score: result.breakdown.infrastructure.score,  max: 10 },
    },
    topRisks: buildTopRisks(result),
    computedAt: result.metadata.computedAt,
    computeTimeMs: ms,
    dataSources: result.metadata.dataSources,
  };
}

function buildTopRisks(result) {
  const risks = [];
  const b = result.breakdown;
  if (b.damProximity.score > 10) risks.push(`Dam proximity risk (${b.damProximity.score}/25)`);
  if (b.floodZone.score > 10)    risks.push(`Active flood zone (${b.floodZone.score}/20)`);
  if (b.lakebed.isOnLakebed)     risks.push('Built on encroached lakebed');
  if (b.earthquake.score > 7)    risks.push(`Seismic zone risk (${b.earthquake.score}/15)`);
  if (b.weather.score > 8)       risks.push(`Severe weather forecast (${b.weather.score}/15)`);
  if (b.coastal.score > 5)       risks.push(`Coastal exposure: ${b.coastal.coastalExposure}`);
  if (b.soil.score > 8)          risks.push(`Poor soil conditions: ${b.soil.soilType}`);
  return risks.slice(0, 5);
}

module.exports = router;
