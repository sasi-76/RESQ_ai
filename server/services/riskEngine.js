/**
 * RESQAI Risk Scoring Engine
 * Computes comprehensive disaster risk scores for any lat/lng in Tamil Nadu.
 * Powers both the Insurance Risk API (₹20-50/call) and Land Safety Reports (₹500-1000).
 */

const { readDB } = require('../db');

const OPEN_METEO_BASE = 'https://api.open-meteo.com/v1';
const USGS_BASE = 'https://earthquake.usgs.gov/fdsnws/event/1/query';

// ── Tamil Nadu Geographic Data ──────────────────────────────────────────────

const TN_SEISMIC_ZONES = {
  II: { risk: 'low', factor: 0.10, label: 'Low Damage Risk Zone' },
  III: { risk: 'moderate', factor: 0.25, label: 'Moderate Damage Risk Zone' },
  IV: { risk: 'high', factor: 0.50, label: 'High Damage Risk Zone' },
};

// District → seismic zone mapping (BIS IS 1893)
const DISTRICT_SEISMIC_ZONE = {
  chennai: 'III', kancheepuram: 'III', tiruvallur: 'III', chengalpattu: 'III',
  vellore: 'III', ranipet: 'III', tirupattur: 'III', krishnagiri: 'II',
  dharmapuri: 'II', salem: 'II', namakkal: 'II', erode: 'II',
  tiruppur: 'II', coimbatore: 'III', nilgiris: 'III',
  thanjavur: 'II', nagapattinam: 'III', tiruvarur: 'II',
  cuddalore: 'III', villupuram: 'III', kallakurichi: 'II',
  madurai: 'II', theni: 'II', dindigul: 'II', sivaganga: 'II',
  ramanathapuram: 'II', virudhunagar: 'II', thoothukudi: 'II',
  tirunelveli: 'II', tenkasi: 'II', kanyakumari: 'II',
  trichy: 'II', perambalur: 'II', ariyalur: 'II', karur: 'II',
  pudukkottai: 'II', mayiladuthurai: 'III',
};

// Known soil types by district/region
const SOIL_DATABASE = {
  chennai: { type: 'Alluvial/Marine Clay', bearing: 'Low-Medium', waterTable: 'High (1-3m)', permeability: 'Low', risk: 'high', description: 'Coastal alluvial and marine clay deposits. High water table. Prone to waterlogging.' },
  tiruvallur: { type: 'Alluvial Clay', bearing: 'Medium', waterTable: 'Medium (3-5m)', permeability: 'Low-Medium', risk: 'medium', description: 'River alluvial deposits from Kosasthalaiyar basin. Moderate drainage.' },
  kancheepuram: { type: 'Alluvial/Laterite', bearing: 'Medium', waterTable: 'Medium (2-4m)', permeability: 'Medium', risk: 'medium', description: 'Mixed alluvial and laterite. Palar river basin influence.' },
  chengalpattu: { type: 'Alluvial/Red Soil', bearing: 'Medium', waterTable: 'Medium (3-5m)', permeability: 'Medium', risk: 'medium', description: 'Transitional zone between coastal alluvium and inland red soil.' },
  coimbatore: { type: 'Black Cotton Soil', bearing: 'Medium-High', waterTable: 'Deep (8-15m)', permeability: 'Low', risk: 'low', description: 'Black cotton soil with good agricultural properties. Expansive when wet.' },
  madurai: { type: 'Red Soil/Sandy Loam', bearing: 'Medium-High', waterTable: 'Medium (5-8m)', permeability: 'Medium-High', risk: 'low', description: 'Red soil with sandy loam. Good drainage. Vaigai river influence.' },
  salem: { type: 'Red Laterite/Rocky', bearing: 'High', waterTable: 'Deep (10-20m)', permeability: 'High', risk: 'low', description: 'Red laterite over metamorphic rock. Excellent bearing capacity.' },
  thanjavur: { type: 'Deep Alluvial Clay', bearing: 'Low-Medium', waterTable: 'High (1-3m)', permeability: 'Low', risk: 'high', description: 'Kaveri delta alluvium. Very fertile but flood-prone. High water table.' },
  nagapattinam: { type: 'Coastal Alluvial/Sand', bearing: 'Low', waterTable: 'Very High (0.5-2m)', permeability: 'High', risk: 'critical', description: 'Coastal sandy alluvium. Tsunami and cyclone exposure. Very high water table.' },
  cuddalore: { type: 'Alluvial/Coastal Sand', bearing: 'Low-Medium', waterTable: 'High (1-3m)', permeability: 'Medium-High', risk: 'high', description: 'Coastal alluvial sediments. Cyclone and flood exposure.' },
  trichy: { type: 'Red Soil/Alluvial', bearing: 'Medium-High', waterTable: 'Medium (5-10m)', permeability: 'Medium', risk: 'low', description: 'Mixed red soil and river alluvium. Kaveri influence. Good foundation soil.' },
  tirunelveli: { type: 'Red Sandy Soil', bearing: 'Medium', waterTable: 'Medium (5-8m)', permeability: 'High', risk: 'low', description: 'Red sandy soil over gneissic rock. Good drainage.' },
  erode: { type: 'Red Loam/Black Soil', bearing: 'Medium-High', waterTable: 'Deep (8-12m)', permeability: 'Medium', risk: 'low', description: 'Mixed red loam and black cotton soil. Bhavani river basin.' },
  vellore: { type: 'Red Soil/Laterite', bearing: 'Medium-High', waterTable: 'Medium (5-10m)', permeability: 'Medium-High', risk: 'low', description: 'Red lateritic soil over granite. Good bearing capacity.' },
  kanyakumari: { type: 'Laterite/Red Soil', bearing: 'Medium', waterTable: 'Medium (3-6m)', permeability: 'Medium', risk: 'medium', description: 'Laterite with red soil. Hilly terrain with moderate drainage.' },
  nilgiris: { type: 'Laterite/Forest Soil', bearing: 'Medium-High', waterTable: 'Variable', permeability: 'High', risk: 'medium', description: 'Hill laterite and forest soil. Landslide risk on steep slopes.' },
  ramanathapuram: { type: 'Coastal Sand/Saline', bearing: 'Low', waterTable: 'Very High (0.5-2m)', permeability: 'Very High', risk: 'high', description: 'Sandy coastal soil with saline intrusion. Cyclone-prone coast.' },
  thoothukudi: { type: 'Coastal Alluvial/Saline', bearing: 'Low-Medium', waterTable: 'High (1-3m)', permeability: 'Medium-High', risk: 'high', description: 'Coastal alluvium with salt-affected areas. Industrial zone.' },
  dindigul: { type: 'Red Soil/Rocky', bearing: 'High', waterTable: 'Deep (8-15m)', permeability: 'Medium-High', risk: 'low', description: 'Red soil over granite hills. Excellent foundation conditions.' },
  theni: { type: 'Red Loam/Alluvial', bearing: 'Medium-High', waterTable: 'Medium (5-8m)', permeability: 'Medium', risk: 'low', description: 'Red loam in hills, alluvial in valleys. Vaigai catchment.' },
  default: { type: 'Red Soil/Mixed', bearing: 'Medium', waterTable: 'Medium (5-8m)', permeability: 'Medium', risk: 'low', description: 'General Tamil Nadu red soil terrain. Standard foundation suitability.' },
};

// Known old lakebeds and waterbody encroachment zones in Chennai
const CHENNAI_LAKEBEDS = [
  { name: 'Pallikaranai Marshland', center: { lat: 12.9320, lng: 80.2108 }, radiusKm: 2.5, severity: 'critical' },
  { name: 'Velachery Lake (Old Bed)', center: { lat: 12.9783, lng: 80.2210 }, radiusKm: 1.0, severity: 'high' },
  { name: 'Madipakkam Lake', center: { lat: 12.9621, lng: 80.2023 }, radiusKm: 0.8, severity: 'high' },
  { name: 'Porur Lake Encroachment Zone', center: { lat: 13.0378, lng: 80.1570 }, radiusKm: 1.2, severity: 'high' },
  { name: 'Ambattur Lake Overflow Zone', center: { lat: 13.1143, lng: 80.1548 }, radiusKm: 1.0, severity: 'medium' },
  { name: 'Retteri Lake Zone', center: { lat: 13.1228, lng: 80.2135 }, radiusKm: 0.6, severity: 'medium' },
  { name: 'Adyar Creek Floodplain', center: { lat: 13.0067, lng: 80.2573 }, radiusKm: 1.5, severity: 'high' },
  { name: 'Cooum River Floodplain', center: { lat: 13.0633, lng: 80.2480 }, radiusKm: 1.0, severity: 'high' },
  { name: 'Buckingham Canal Zone', center: { lat: 13.0400, lng: 80.2800 }, radiusKm: 0.5, severity: 'medium' },
  { name: 'Sholinganallur Marshland', center: { lat: 12.9010, lng: 80.2270 }, radiusKm: 1.5, severity: 'high' },
  { name: 'Narayanapuram Lake Bed', center: { lat: 12.9550, lng: 80.1850 }, radiusKm: 0.5, severity: 'medium' },
  { name: 'Chitlapakkam Lake', center: { lat: 12.9450, lng: 80.1700 }, radiusKm: 0.6, severity: 'medium' },
  { name: 'Sembakkam Lake', center: { lat: 12.9330, lng: 80.1340 }, radiusKm: 0.7, severity: 'medium' },
  { name: 'Perungudi Dump/Marsh Zone', center: { lat: 12.9577, lng: 80.2340 }, radiusKm: 1.0, severity: 'critical' },
  { name: 'Korattur Lake Encroachment', center: { lat: 13.1100, lng: 80.1990 }, radiusKm: 0.8, severity: 'medium' },
  { name: 'Mogappair Wetland', center: { lat: 13.0880, lng: 80.1730 }, radiusKm: 0.5, severity: 'medium' },
];

// Known flood-prone areas across TN
const FLOOD_ZONES = [
  { name: 'Kaveri Delta', center: { lat: 10.79, lng: 79.84 }, radiusKm: 40, severity: 'high', river: 'Kaveri' },
  { name: 'Adyar River Basin Chennai', center: { lat: 13.01, lng: 80.22 }, radiusKm: 5, severity: 'high', river: 'Adyar' },
  { name: 'Cooum River Basin', center: { lat: 13.07, lng: 80.22 }, radiusKm: 4, severity: 'high', river: 'Cooum' },
  { name: 'Vaigai Floodplain Madurai', center: { lat: 9.92, lng: 78.12 }, radiusKm: 8, severity: 'medium', river: 'Vaigai' },
  { name: 'Thamiraparani Basin', center: { lat: 8.73, lng: 77.70 }, radiusKm: 15, severity: 'medium', river: 'Thamiraparani' },
  { name: 'Bhavani River Basin', center: { lat: 11.45, lng: 77.68 }, radiusKm: 12, severity: 'medium', river: 'Bhavani' },
  { name: 'Vellar-Manimuthar Basin', center: { lat: 11.40, lng: 79.30 }, radiusKm: 10, severity: 'medium', river: 'Vellar' },
  { name: 'Nagapattinam Coast (Tsunami Zone)', center: { lat: 10.77, lng: 79.84 }, radiusKm: 5, severity: 'critical', river: 'Coastal' },
  { name: 'Cuddalore Coast', center: { lat: 11.75, lng: 79.77 }, radiusKm: 5, severity: 'high', river: 'Coastal' },
  { name: 'Thenpennai Floodplain', center: { lat: 12.02, lng: 79.41 }, radiusKm: 8, severity: 'medium', river: 'Thenpennai' },
];

// ── Distance Calculation ────────────────────────────────────────────────────

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

// ── Identify District from Coordinates ──────────────────────────────────────

const DISTRICT_CENTERS = {
  chennai: { lat: 13.0827, lng: 80.2707 },
  tiruvallur: { lat: 13.1500, lng: 79.9100 },
  kancheepuram: { lat: 12.8342, lng: 79.7036 },
  chengalpattu: { lat: 12.6819, lng: 79.9888 },
  vellore: { lat: 12.9165, lng: 79.1325 },
  ranipet: { lat: 12.9410, lng: 79.3330 },
  tirupattur: { lat: 12.4967, lng: 78.5730 },
  krishnagiri: { lat: 12.5186, lng: 78.2137 },
  dharmapuri: { lat: 12.1211, lng: 78.1582 },
  salem: { lat: 11.6643, lng: 78.1460 },
  namakkal: { lat: 11.2189, lng: 78.1674 },
  erode: { lat: 11.3410, lng: 77.7172 },
  tiruppur: { lat: 11.1085, lng: 77.3411 },
  coimbatore: { lat: 11.0168, lng: 76.9558 },
  nilgiris: { lat: 11.4916, lng: 76.7337 },
  thanjavur: { lat: 10.7870, lng: 79.1378 },
  nagapattinam: { lat: 10.7672, lng: 79.8449 },
  tiruvarur: { lat: 10.7660, lng: 79.6345 },
  cuddalore: { lat: 11.7480, lng: 79.7714 },
  villupuram: { lat: 11.9401, lng: 79.4861 },
  kallakurichi: { lat: 11.7392, lng: 78.9607 },
  madurai: { lat: 9.9252, lng: 78.1198 },
  theni: { lat: 10.0104, lng: 77.4770 },
  dindigul: { lat: 10.3624, lng: 77.9695 },
  sivaganga: { lat: 10.0000, lng: 78.4836 },
  ramanathapuram: { lat: 9.3639, lng: 78.8395 },
  virudhunagar: { lat: 9.5851, lng: 77.9527 },
  thoothukudi: { lat: 8.7642, lng: 78.1348 },
  tirunelveli: { lat: 8.7139, lng: 77.7567 },
  tenkasi: { lat: 8.9592, lng: 77.3152 },
  kanyakumari: { lat: 8.0883, lng: 77.5385 },
  trichy: { lat: 10.7905, lng: 78.7047 },
  perambalur: { lat: 11.2350, lng: 78.8811 },
  ariyalur: { lat: 11.1383, lng: 79.0753 },
  karur: { lat: 10.9601, lng: 78.0766 },
  pudukkottai: { lat: 10.3833, lng: 78.8001 },
  mayiladuthurai: { lat: 11.1014, lng: 79.6551 },
};

function identifyDistrict(lat, lng) {
  let nearest = 'chennai';
  let minDist = Infinity;

  for (const [district, center] of Object.entries(DISTRICT_CENTERS)) {
    const d = haversineKm(lat, lng, center.lat, center.lng);
    if (d < minDist) {
      minDist = d;
      nearest = district;
    }
  }

  return nearest;
}

// ── Elevation & Weather from Open-Meteo ─────────────────────────────────────

async function fetchLocationMeteo(lat, lng) {
  try {
    const url = `${OPEN_METEO_BASE}/forecast?latitude=${lat}&longitude=${lng}` +
      `&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,pressure_msl,weather_code` +
      `&hourly=precipitation_probability,precipitation` +
      `&daily=precipitation_sum,precipitation_probability_max,wind_speed_10m_max,wind_gusts_10m_max` +
      `&timezone=Asia/Kolkata&forecast_days=7`;

    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`[RiskEngine] Meteo fetch failed for ${lat},${lng}: ${err.message}`);
    return null;
  }
}

async function fetchElevation(lat, lng) {
  try {
    const res = await fetch(`${OPEN_METEO_BASE}/elevation?latitude=${lat}&longitude=${lng}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.elevation?.[0] ?? null;
  } catch {
    return null;
  }
}

async function fetchRecentEarthquakes(lat, lng, radiusKm = 300) {
  try {
    const startDate = new Date(Date.now() - 365 * 86400000).toISOString().split('T')[0];
    const url = `${USGS_BASE}?format=geojson&latitude=${lat}&longitude=${lng}` +
      `&maxradiuskm=${radiusKm}&minmagnitude=2.0&orderby=time&limit=50&starttime=${startDate}`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return data.features || [];
  } catch {
    return [];
  }
}

// ── Core Risk Scoring Functions ─────────────────────────────────────────────

function scoreDamProximity(lat, lng, dams) {
  const damRisks = [];
  let totalScore = 0;

  for (const dam of dams) {
    const distKm = haversineKm(lat, lng, dam.lat, dam.lng);
    if (distKm > 100) continue;

    const fillPercent = dam.capacity > 0 ? (dam.storage / dam.capacity) * 100 : 0;
    const netInflow = dam.inflow - dam.outflow;

    // Proximity factor: closer = more risk (exponential decay)
    const proximityFactor = Math.max(0, 1 - distKm / 100);

    // Dam stress factor
    let stressFactor = 0;
    if (fillPercent >= 95) stressFactor = 1.0;
    else if (fillPercent >= 85) stressFactor = 0.7;
    else if (fillPercent >= 75) stressFactor = 0.4;
    else if (fillPercent >= 60) stressFactor = 0.2;

    // Inflow pressure
    const inflowPressure = netInflow > 10000 ? 0.3 : netInflow > 5000 ? 0.2 : netInflow > 1000 ? 0.1 : 0;

    const damScore = (proximityFactor * 0.4 + stressFactor * 0.4 + inflowPressure * 0.2) * 25;

    if (damScore > 0.5) {
      damRisks.push({
        damName: dam.name,
        distanceKm: Math.round(distKm * 10) / 10,
        fillPercent: Math.round(fillPercent * 10) / 10,
        netInflow: netInflow,
        riskContribution: Math.round(damScore * 10) / 10,
      });
    }

    totalScore = Math.max(totalScore, damScore);
  }

  return { score: clamp(Math.round(totalScore), 0, 25), details: damRisks };
}

function scoreFloodZone(lat, lng) {
  const zones = [];
  let maxScore = 0;

  for (const zone of FLOOD_ZONES) {
    const dist = haversineKm(lat, lng, zone.center.lat, zone.center.lng);
    if (dist <= zone.radiusKm) {
      const factor = 1 - dist / zone.radiusKm;
      const severityMultiplier = zone.severity === 'critical' ? 1.0 : zone.severity === 'high' ? 0.75 : 0.5;
      const score = factor * severityMultiplier * 20;
      maxScore = Math.max(maxScore, score);
      zones.push({ name: zone.name, distanceKm: Math.round(dist * 10) / 10, severity: zone.severity });
    }
  }

  return { score: clamp(Math.round(maxScore), 0, 20), zones };
}

function scoreLakebed(lat, lng) {
  const matches = [];
  let maxScore = 0;

  for (const lake of CHENNAI_LAKEBEDS) {
    const dist = haversineKm(lat, lng, lake.center.lat, lake.center.lng);
    if (dist <= lake.radiusKm) {
      const factor = 1 - dist / lake.radiusKm;
      const severityMultiplier = lake.severity === 'critical' ? 1.0 : lake.severity === 'high' ? 0.75 : 0.5;
      const score = factor * severityMultiplier * 15;
      maxScore = Math.max(maxScore, score);
      matches.push({ name: lake.name, distanceKm: Math.round(dist * 100) / 100, severity: lake.severity });
    }
  }

  return { score: clamp(Math.round(maxScore), 0, 15), lakebeds: matches, isOnLakebed: matches.length > 0 };
}

function scoreEarthquakeRisk(lat, lng, earthquakes, district) {
  const zone = DISTRICT_SEISMIC_ZONE[district] || 'II';
  const zoneInfo = TN_SEISMIC_ZONES[zone];

  let recentActivityScore = 0;
  if (earthquakes.length > 0) {
    const maxMag = Math.max(...earthquakes.map(eq => eq.properties.mag));
    const count = earthquakes.length;
    recentActivityScore = Math.min((maxMag / 8) * 8 + (count / 50) * 4, 12);
  }

  const zoneScore = zoneInfo.factor * 15;
  const totalScore = Math.max(zoneScore, recentActivityScore);

  return {
    score: clamp(Math.round(totalScore), 0, 15),
    seismicZone: zone,
    zoneLabel: zoneInfo.label,
    recentEarthquakes: earthquakes.length,
    maxMagnitude: earthquakes.length > 0 ? Math.max(...earthquakes.map(eq => eq.properties.mag)) : 0,
  };
}

function scoreWeatherRisk(meteoData) {
  if (!meteoData) return { score: 0, details: {} };

  let score = 0;
  const details = {};

  // Current precipitation
  const currentPrecip = meteoData.current?.precipitation ?? 0;
  if (currentPrecip > 0) {
    score += Math.min((currentPrecip / 50) * 5, 5);
    details.currentPrecipitation = currentPrecip;
  }

  // 7-day forecast rainfall
  const dailyPrecip = meteoData.daily?.precipitation_sum || [];
  const totalForecast = dailyPrecip.reduce((s, v) => s + (v || 0), 0);
  if (totalForecast > 50) {
    score += Math.min((totalForecast / 500) * 5, 5);
    details.forecastRainfall7d = Math.round(totalForecast);
  }

  // Wind risk
  const maxWind = Math.max(...(meteoData.daily?.wind_speed_10m_max || [0]));
  if (maxWind > 30) {
    score += Math.min((maxWind / 100) * 3, 3);
    details.maxForecastWind = Math.round(maxWind);
  }

  // Wind gusts
  const maxGusts = Math.max(...(meteoData.daily?.wind_gusts_10m_max || [0]));
  if (maxGusts > 50) {
    score += Math.min((maxGusts / 150) * 2, 2);
    details.maxForecastGusts = Math.round(maxGusts);
  }

  details.temperature = meteoData.current?.temperature_2m;
  details.humidity = meteoData.current?.relative_humidity_2m;

  return { score: clamp(Math.round(score), 0, 15), details };
}

function scoreSoilRisk(district) {
  const soil = SOIL_DATABASE[district] || SOIL_DATABASE.default;
  const riskMap = { critical: 12, high: 9, medium: 5, low: 2 };
  return {
    score: riskMap[soil.risk] || 2,
    soilType: soil.type,
    bearingCapacity: soil.bearing,
    waterTable: soil.waterTable,
    permeability: soil.permeability,
    description: soil.description,
  };
}

function scoreCoastalRisk(lat, lng, elevation) {
  // Tamil Nadu east coast approximate line
  const coastLng = 80.28;
  const distToCoast = Math.abs(lng - coastLng) * 111;

  if (lng < 77) return { score: 0, coastalExposure: 'Inland', distanceToCoastKm: null };

  let score = 0;
  let exposure = 'Inland';

  if (distToCoast < 2) {
    exposure = 'Seafront';
    score = 10;
  } else if (distToCoast < 5) {
    exposure = 'Coastal';
    score = 7;
  } else if (distToCoast < 15) {
    exposure = 'Near-Coastal';
    score = 4;
  } else if (distToCoast < 30) {
    exposure = 'Semi-Coastal';
    score = 2;
  }

  if (elevation !== null && elevation < 5 && distToCoast < 15) {
    score += 3;
    exposure += ' (Low Elevation)';
  }

  return {
    score: clamp(score, 0, 10),
    coastalExposure: exposure,
    distanceToCoastKm: Math.round(distToCoast),
    elevation: elevation !== null ? Math.round(elevation) : null,
  };
}

function scoreInfrastructure(lat, lng) {
  const hospitals = readDB('hospitals.json');
  let nearestHospitalKm = Infinity;
  let nearestHospital = null;
  let hospitalsWithin10km = 0;

  for (const h of hospitals) {
    if (!h.lat || !h.lng) continue;
    const d = haversineKm(lat, lng, h.lat, h.lng);
    if (d < nearestHospitalKm) {
      nearestHospitalKm = d;
      nearestHospital = h.name;
    }
    if (d <= 10) hospitalsWithin10km++;
  }

  let score = 0;
  if (nearestHospitalKm > 20) score = 8;
  else if (nearestHospitalKm > 10) score = 5;
  else if (nearestHospitalKm > 5) score = 3;
  else score = 1;

  if (hospitalsWithin10km === 0) score += 2;

  return {
    score: clamp(score, 0, 10),
    nearestHospital,
    nearestHospitalKm: Math.round(nearestHospitalKm * 10) / 10,
    hospitalsWithin10km,
  };
}

// ── Main Risk Score Calculator ──────────────────────────────────────────────

async function computeRiskScore(lat, lng) {
  const startTime = Date.now();
  const district = identifyDistrict(lat, lng);

  // Parallel data fetching
  const [meteoData, elevation, earthquakes] = await Promise.all([
    fetchLocationMeteo(lat, lng),
    fetchElevation(lat, lng),
    fetchRecentEarthquakes(lat, lng, 300),
  ]);

  const dams = readDB('dams.json');

  // Compute all risk dimensions
  const damRisk = scoreDamProximity(lat, lng, dams);
  const floodZone = scoreFloodZone(lat, lng);
  const lakebedRisk = scoreLakebed(lat, lng);
  const earthquakeRisk = scoreEarthquakeRisk(lat, lng, earthquakes, district);
  const weatherRisk = scoreWeatherRisk(meteoData);
  const soilRisk = scoreSoilRisk(district);
  const coastalRisk = scoreCoastalRisk(lat, lng, elevation);
  const infraRisk = scoreInfrastructure(lat, lng);

  // Composite score (weighted sum, max 100)
  const composite = Math.min(100,
    damRisk.score +
    floodZone.score +
    lakebedRisk.score +
    earthquakeRisk.score +
    weatherRisk.score +
    soilRisk.score +
    coastalRisk.score +
    infraRisk.score
  );

  // Risk classification
  let riskGrade, riskLabel, insurabilityNote;
  if (composite >= 75) {
    riskGrade = 'E'; riskLabel = 'Extreme Risk';
    insurabilityNote = 'Very high premium recommended. Detailed inspection required.';
  } else if (composite >= 60) {
    riskGrade = 'D'; riskLabel = 'High Risk';
    insurabilityNote = 'Elevated premium. Flood/cyclone riders recommended.';
  } else if (composite >= 40) {
    riskGrade = 'C'; riskLabel = 'Moderate Risk';
    insurabilityNote = 'Standard premium with seasonal risk riders.';
  } else if (composite >= 20) {
    riskGrade = 'B'; riskLabel = 'Low Risk';
    insurabilityNote = 'Below-average premium. Standard coverage sufficient.';
  } else {
    riskGrade = 'A'; riskLabel = 'Minimal Risk';
    insurabilityNote = 'Lowest premium tier. Location is well-protected.';
  }

  // Flood zone classification (insurance standard)
  let floodZoneClass;
  if (floodZone.score >= 15 || lakebedRisk.isOnLakebed) floodZoneClass = 'Zone A (High Flood Risk)';
  else if (floodZone.score >= 10) floodZoneClass = 'Zone B (Moderate Flood Risk)';
  else if (floodZone.score >= 5) floodZoneClass = 'Zone C (Low-Moderate Flood Risk)';
  else floodZoneClass = 'Zone X (Minimal Flood Risk)';

  const elapsed = Date.now() - startTime;

  return {
    location: { lat, lng, district, elevation },
    riskScore: composite,
    riskGrade,
    riskLabel,
    floodZoneClass,
    insurabilityNote,
    breakdown: {
      damProximity: { score: damRisk.score, max: 25, ...damRisk },
      floodZone: { score: floodZone.score, max: 20, ...floodZone },
      lakebed: { score: lakebedRisk.score, max: 15, ...lakebedRisk },
      earthquake: { score: earthquakeRisk.score, max: 15, ...earthquakeRisk },
      weather: { score: weatherRisk.score, max: 15, ...weatherRisk },
      soil: { score: soilRisk.score, max: 12, ...soilRisk },
      coastal: { score: coastalRisk.score, max: 10, ...coastalRisk },
      infrastructure: { score: infraRisk.score, max: 10, ...infraRisk },
    },
    metadata: {
      computedAt: new Date().toISOString(),
      computeTimeMs: elapsed,
      dataSources: ['Open-Meteo', 'USGS', 'RESQAI-DamDB', 'TN-WRD', 'BIS-Seismic', 'NDMA'],
      version: '1.0.0',
    },
  };
}

// ── Batch Risk Assessment ───────────────────────────────────────────────────

async function computeBatchRiskScores(locations) {
  const results = await Promise.all(
    locations.map(loc => computeRiskScore(loc.lat, loc.lng).catch(err => ({
      location: loc,
      error: err.message,
    })))
  );
  return results;
}

module.exports = {
  computeRiskScore,
  computeBatchRiskScores,
  identifyDistrict,
  haversineKm,
  SOIL_DATABASE,
  CHENNAI_LAKEBEDS,
  FLOOD_ZONES,
  DISTRICT_SEISMIC_ZONE,
  TN_SEISMIC_ZONES,
};
