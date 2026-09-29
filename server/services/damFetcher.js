const { readDB, writeDB } = require('../db');

const OPEN_METEO_BASE = 'https://api.open-meteo.com/v1/forecast';

const CATCHMENT_MULTIPLIERS = {
  mettur: 800,
  bhavanisagar: 350,
  amaravathi: 200,
  vaigai: 250,
  pechiparai: 80,
  perunchani: 60,
  sathanur: 180,
  chembarambakkam: 40,
  poondi: 30,
  redhills: 25,
  krishnaraja: 600,
  kabini: 400,
  hemavathy: 450,
};

async function fetchWeatherForDam(dam) {
  const url =
    `${OPEN_METEO_BASE}?latitude=${dam.lat}&longitude=${dam.lng}` +
    `&current=temperature_2m,relative_humidity_2m,precipitation,rain,weather_code,wind_speed_10m` +
    `&hourly=precipitation&timezone=Asia/Kolkata&forecast_days=1`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function getLast6hRainfall(hourlyData) {
  if (!hourlyData || !hourlyData.time || !hourlyData.precipitation) return 0;

  const now = new Date();
  const sixHoursAgo = new Date(now.getTime() - 6 * 3600 * 1000);

  let sum = 0;
  for (let i = 0; i < hourlyData.time.length; i++) {
    const t = new Date(hourlyData.time[i]);
    if (t >= sixHoursAgo && t <= now) {
      sum += hourlyData.precipitation[i] || 0;
    }
  }
  return Math.round(sum * 100) / 100;
}

function computeStatus(fillPercent) {
  if (fillPercent >= 90) return 'critical';
  if (fillPercent >= 75) return 'warning';
  if (fillPercent >= 50) return 'normal';
  if (fillPercent >= 25) return 'low';
  return 'critical_low';
}

function updateDamWithWeather(dam, weatherJson) {
  const current = weatherJson.current;
  const hourly = weatherJson.hourly;

  const catchmentRainfall6h = getLast6hRainfall(hourly);
  const currentRainfall = (current.precipitation || 0) + (current.rain || 0);
  const multiplier = CATCHMENT_MULTIPLIERS[dam.id] || 100;

  const baseInflow = dam.inflow;
  const newInflow = Math.round(baseInflow + catchmentRainfall6h * multiplier);

  const fillPercent = (dam.storage / dam.capacity) * 100;
  let newOutflow;
  if (fillPercent >= 90) {
    newOutflow = Math.round(newInflow * 1.2);
  } else if (fillPercent >= 85) {
    newOutflow = Math.round(dam.outflow * 1.15 + catchmentRainfall6h * multiplier * 0.3);
  } else if (fillPercent < 30) {
    newOutflow = Math.round(dam.outflow * 0.6);
  } else {
    const variation = (Math.random() - 0.5) * dam.outflow * 0.05;
    newOutflow = Math.round(dam.outflow + variation);
  }
  newOutflow = Math.max(0, newOutflow);

  const netFlowCusecs = newInflow - newOutflow;
  const storageChangeMcft = (netFlowCusecs * 3600) / 1000000;
  let newStorage = dam.storage + storageChangeMcft;
  newStorage = Math.max(0, Math.min(dam.capacity, newStorage));
  newStorage = Math.round(newStorage * 100) / 100;

  const newLevel = Math.round(
    (dam.fullReservoirLevel * (newStorage / dam.capacity)) * 100
  ) / 100;

  const newFillPercent = (newStorage / dam.capacity) * 100;
  const newStatus = computeStatus(newFillPercent);

  return {
    ...dam,
    inflow: newInflow,
    outflow: newOutflow,
    storage: newStorage,
    currentLevel: newLevel,
    status: newStatus,
    lastUpdated: new Date().toISOString(),
    weather: {
      temperature: current.temperature_2m,
      humidity: current.relative_humidity_2m,
      rainfall: Math.round(currentRainfall * 100) / 100,
      windSpeed: current.wind_speed_10m,
      weatherCode: current.weather_code,
      catchmentRainfall6h,
    },
  };
}

async function fetchAndUpdateDams() {
  const dams = readDB('dams.json');
  console.log(`[DamFetcher] Starting refresh for ${dams.length} dams...`);

  let successCount = 0;

  for (let i = 0; i < dams.length; i++) {
    try {
      const weatherJson = await fetchWeatherForDam(dams[i]);
      const updated = updateDamWithWeather(dams[i], weatherJson);
      dams[i] = updated;
      successCount++;

      const fill = ((updated.storage / updated.capacity) * 100).toFixed(1);
      const rain = updated.weather ? updated.weather.rainfall : 0;
      console.log(
        `[DamFetcher] ${updated.name}: rainfall=${rain}mm, inflow=${updated.inflow} cusecs, level=${updated.currentLevel}ft (${fill}%)`
      );
    } catch (err) {
      console.warn(`[DamFetcher] ${dams[i].name}: FAILED — ${err.message} (keeping cached data)`);
    }
  }

  writeDB('dams.json', dams);
  console.log(`[DamFetcher] Refresh complete. ${successCount}/${dams.length} dams updated.`);
  return dams;
}

function startDamAutoRefresh(intervalMs = 3600000) {
  console.log(`[DamFetcher] Auto-refresh scheduled every ${intervalMs / 60000} minutes.`);
  setInterval(async () => {
    try {
      await fetchAndUpdateDams();
    } catch (err) {
      console.error(`[DamFetcher] Auto-refresh failed:`, err.message);
    }
  }, intervalMs);
}

module.exports = { fetchAndUpdateDams, startDamAutoRefresh };
