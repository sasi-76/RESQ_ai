const { readDB, writeDB } = require('../db');

const SIX_HOURS_MS = 6 * 60 * 60 * 1000;
const USGS_URL = 'https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&minlatitude=8&maxlatitude=14&minlongitude=76&maxlongitude=81&minmagnitude=3.0&orderby=time&limit=5';

function isDuplicate(existing, type, areaName) {
  const cutoff = Date.now() - SIX_HOURS_MS;
  return existing.some(
    d => d.type === type &&
         d.areaName === areaName &&
         new Date(d.createdAt).getTime() > cutoff
  );
}

function addDisaster(disasters, record) {
  disasters.push(record);
  return record;
}

function addAlert(alerts, record) {
  alerts.push(record);
  return record;
}

function checkDams(dams, disasters, alerts, details) {
  let newD = 0, newA = 0;

  for (const dam of dams) {
    const fill = (dam.currentLevel / dam.fullReservoirLevel) * 100;
    const area = `${dam.name} - ${dam.district}`;
    const now = new Date().toISOString();

    // Dam fill critical (>90%)
    if (fill > 90 && !isDuplicate(disasters, 'flood', area)) {
      const trigger = `Dam fill at ${fill.toFixed(1)}%`;
      addDisaster(disasters, {
        id: `auto-${Date.now()}-${dam.id}-fill`,
        type: 'flood', severity: 'critical', areaName: area,
        lat: dam.lat, lng: dam.lng, source: 'auto-detected',
        trigger, status: 'active', createdAt: now, autoDetected: true,
      });
      addAlert(alerts, {
        id: `alert-${Date.now()}-${dam.id}-fill`,
        type: 'flood', priority: 'critical',
        title: `FLOOD WARNING: ${dam.name} at ${fill.toFixed(1)}% capacity`,
        message: `Dam water level has exceeded 90% threshold. Current inflow: ${dam.inflow} cusecs, outflow: ${dam.outflow} cusecs. Downstream areas in ${dam.district} should prepare for possible flooding.`,
        area: dam.district, source: 'auto-detected', createdAt: now, read: false,
      });
      details.push(`Dam check: ${dam.name} at ${fill.toFixed(1)}% → CRITICAL flood warning created`);
      newD++; newA++;
    }
    // Dam fill warning (>80%)
    else if (fill > 80 && !isDuplicate(disasters, 'flood', area)) {
      const trigger = `Dam fill at ${fill.toFixed(1)}%`;
      addDisaster(disasters, {
        id: `auto-${Date.now()}-${dam.id}-warn`,
        type: 'flood', severity: 'warning', areaName: area,
        lat: dam.lat, lng: dam.lng, source: 'auto-detected',
        trigger, status: 'active', createdAt: now, autoDetected: true,
      });
      addAlert(alerts, {
        id: `alert-${Date.now()}-${dam.id}-warn`,
        type: 'flood', priority: 'warning',
        title: `FLOOD ALERT: ${dam.name} at ${fill.toFixed(1)}% capacity`,
        message: `Dam water level is approaching danger threshold. Current inflow: ${dam.inflow} cusecs. Monitor closely for further rises in ${dam.district}.`,
        area: dam.district, source: 'auto-detected', createdAt: now, read: false,
      });
      details.push(`Dam check: ${dam.name} at ${fill.toFixed(1)}% → WARNING flood alert created`);
      newD++; newA++;
    }

    // Rapid filling (inflow > 2x outflow)
    if (dam.inflow > dam.outflow * 2 && dam.outflow > 0 && !isDuplicate(disasters, 'flood', `${area} (rapid filling)`)) {
      const rapidArea = `${area} (rapid filling)`;
      addDisaster(disasters, {
        id: `auto-${Date.now()}-${dam.id}-rapid`,
        type: 'flood', severity: 'warning', areaName: rapidArea,
        lat: dam.lat, lng: dam.lng, source: 'auto-detected',
        trigger: `Inflow ${dam.inflow} > 2x outflow ${dam.outflow}`,
        status: 'active', createdAt: now, autoDetected: true,
      });
      addAlert(alerts, {
        id: `alert-${Date.now()}-${dam.id}-rapid`,
        type: 'flood', priority: 'warning',
        title: `RAPID FILLING: ${dam.name}`,
        message: `Inflow (${dam.inflow} cusecs) exceeds double the outflow (${dam.outflow} cusecs). Reservoir rising rapidly. ${dam.district} authorities notified.`,
        area: dam.district, source: 'auto-detected', createdAt: now, read: false,
      });
      details.push(`Rapid fill: ${dam.name} inflow=${dam.inflow} > 2x outflow=${dam.outflow} → WARNING created`);
      newD++; newA++;
    }

    // Weather-based checks (if weather data exists)
    if (dam.weather) {
      const rain6h = dam.weather.catchmentRainfall6h || 0;
      const wind = dam.weather.windSpeed || 0;

      // Critical rainfall >100mm
      if (rain6h > 100 && !isDuplicate(disasters, 'flood', `${area} (extreme rainfall)`)) {
        const rainArea = `${area} (extreme rainfall)`;
        addDisaster(disasters, {
          id: `auto-${Date.now()}-${dam.id}-rain-crit`,
          type: 'flood', severity: 'critical', areaName: rainArea,
          lat: dam.lat, lng: dam.lng, source: 'auto-detected',
          trigger: `Rainfall ${rain6h.toFixed(1)}mm/6h`,
          status: 'active', createdAt: now, autoDetected: true,
        });
        addAlert(alerts, {
          id: `alert-${Date.now()}-${dam.id}-rain-crit`,
          type: 'flood', priority: 'critical',
          title: `EXTREME RAINFALL: ${dam.name} catchment ${rain6h.toFixed(1)}mm/6h`,
          message: `Extreme rainfall of ${rain6h.toFixed(1)}mm in the last 6 hours in the ${dam.name} catchment area. Flash flooding likely in ${dam.district}. Evacuate low-lying areas.`,
          area: dam.district, source: 'auto-detected', createdAt: now, read: false,
        });
        details.push(`Rainfall check: ${dam.name} 6h=${rain6h.toFixed(1)}mm → CRITICAL flood warning created`);
        newD++; newA++;
      }
      // Warning rainfall >50mm
      else if (rain6h > 50 && !isDuplicate(disasters, 'flood', `${area} (heavy rainfall)`)) {
        const rainArea = `${area} (heavy rainfall)`;
        addDisaster(disasters, {
          id: `auto-${Date.now()}-${dam.id}-rain-warn`,
          type: 'flood', severity: 'warning', areaName: rainArea,
          lat: dam.lat, lng: dam.lng, source: 'auto-detected',
          trigger: `Rainfall ${rain6h.toFixed(1)}mm/6h`,
          status: 'active', createdAt: now, autoDetected: true,
        });
        addAlert(alerts, {
          id: `alert-${Date.now()}-${dam.id}-rain-warn`,
          type: 'flood', priority: 'warning',
          title: `HEAVY RAINFALL: ${dam.name} catchment ${rain6h.toFixed(1)}mm/6h`,
          message: `Heavy rainfall of ${rain6h.toFixed(1)}mm recorded in last 6 hours near ${dam.name}. Monitor water levels in ${dam.district}.`,
          area: dam.district, source: 'auto-detected', createdAt: now, read: false,
        });
        details.push(`Rainfall check: ${dam.name} 6h=${rain6h.toFixed(1)}mm → WARNING created`);
        newD++; newA++;
      }

      // Critical cyclone wind >90 km/h
      if (wind > 90 && !isDuplicate(disasters, 'cyclone', `${area} (cyclone)`)) {
        const cycloneArea = `${area} (cyclone)`;
        addDisaster(disasters, {
          id: `auto-${Date.now()}-${dam.id}-cyc-crit`,
          type: 'cyclone', severity: 'critical', areaName: cycloneArea,
          lat: dam.lat, lng: dam.lng, source: 'auto-detected',
          trigger: `Wind speed ${wind.toFixed(1)} km/h`,
          status: 'active', createdAt: now, autoDetected: true,
        });
        addAlert(alerts, {
          id: `alert-${Date.now()}-${dam.id}-cyc-crit`,
          type: 'cyclone', priority: 'critical',
          title: `CYCLONE ALERT: ${wind.toFixed(1)} km/h winds near ${dam.name}`,
          message: `Severe cyclonic winds of ${wind.toFixed(1)} km/h detected near ${dam.name}, ${dam.district}. Seek shelter immediately.`,
          area: dam.district, source: 'auto-detected', createdAt: now, read: false,
        });
        details.push(`Wind check: ${dam.name} wind=${wind.toFixed(1)}km/h → CRITICAL cyclone alert created`);
        newD++; newA++;
      }
      // Warning wind >60 km/h
      else if (wind > 60 && !isDuplicate(disasters, 'cyclone', `${area} (strong winds)`)) {
        const windArea = `${area} (strong winds)`;
        addDisaster(disasters, {
          id: `auto-${Date.now()}-${dam.id}-wind-warn`,
          type: 'cyclone', severity: 'warning', areaName: windArea,
          lat: dam.lat, lng: dam.lng, source: 'auto-detected',
          trigger: `Wind speed ${wind.toFixed(1)} km/h`,
          status: 'active', createdAt: now, autoDetected: true,
        });
        addAlert(alerts, {
          id: `alert-${Date.now()}-${dam.id}-wind-warn`,
          type: 'cyclone', priority: 'warning',
          title: `STRONG WINDS: ${wind.toFixed(1)} km/h near ${dam.name}`,
          message: `Strong winds of ${wind.toFixed(1)} km/h detected near ${dam.name}, ${dam.district}. Avoid open areas and secure loose objects.`,
          area: dam.district, source: 'auto-detected', createdAt: now, read: false,
        });
        details.push(`Wind check: ${dam.name} wind=${wind.toFixed(1)}km/h → WARNING created`);
        newD++; newA++;
      }
    }
  }

  return { newD, newA };
}

async function checkEarthquakes(disasters, alerts, details) {
  let newD = 0, newA = 0;

  try {
    const res = await fetch(USGS_URL);
    if (!res.ok) throw new Error(`USGS HTTP ${res.status}`);
    const data = await res.json();

    if (!data.features || !data.features.length) return { newD, newA };

    for (const feature of data.features) {
      const props = feature.properties;
      const coords = feature.geometry.coordinates;
      const mag = props.mag;
      const place = props.place || 'Unknown location';
      const lng = coords[0];
      const lat = coords[1];
      const now = new Date().toISOString();
      const areaName = `Earthquake M${mag.toFixed(1)} - ${place}`;

      if (mag >= 5.5 && !isDuplicate(disasters, 'earthquake', areaName)) {
        addDisaster(disasters, {
          id: `auto-${Date.now()}-eq-${Math.round(mag * 10)}`,
          type: 'earthquake', severity: 'critical', areaName,
          lat, lng, source: 'auto-detected',
          trigger: `Earthquake M${mag.toFixed(1)}`,
          status: 'active', createdAt: now, autoDetected: true,
        });
        addAlert(alerts, {
          id: `alert-${Date.now()}-eq-${Math.round(mag * 10)}`,
          type: 'earthquake', priority: 'critical',
          title: `MAJOR EARTHQUAKE: M${mag.toFixed(1)} - ${place}`,
          message: `A magnitude ${mag.toFixed(1)} earthquake was detected at ${place}. Move to open areas away from buildings. Check for structural damage. Aftershocks possible.`,
          area: place, source: 'auto-detected (USGS)', createdAt: now, read: false,
        });
        details.push(`Earthquake check: M${mag.toFixed(1)} at ${place} → CRITICAL alert created`);
        newD++; newA++;
      } else if (mag >= 4.0 && !isDuplicate(disasters, 'earthquake', areaName)) {
        addDisaster(disasters, {
          id: `auto-${Date.now()}-eq-${Math.round(mag * 10)}`,
          type: 'earthquake', severity: 'warning', areaName,
          lat, lng, source: 'auto-detected',
          trigger: `Earthquake M${mag.toFixed(1)}`,
          status: 'active', createdAt: now, autoDetected: true,
        });
        addAlert(alerts, {
          id: `alert-${Date.now()}-eq-${Math.round(mag * 10)}`,
          type: 'earthquake', priority: 'warning',
          title: `EARTHQUAKE DETECTED: M${mag.toFixed(1)} - ${place}`,
          message: `A magnitude ${mag.toFixed(1)} earthquake was detected at ${place}. No major damage expected but stay alert for aftershocks.`,
          area: place, source: 'auto-detected (USGS)', createdAt: now, read: false,
        });
        details.push(`Earthquake check: M${mag.toFixed(1)} at ${place} → WARNING created`);
        newD++; newA++;
      }
    }
  } catch (err) {
    console.warn(`[DisasterDetector] USGS fetch failed: ${err.message}`);
    details.push(`Earthquake check: skipped (${err.message})`);
  }

  return { newD, newA };
}

async function runDisasterDetection() {
  console.log('[DisasterDetector] Running detection cycle...');

  const dams = readDB('dams.json');
  const disasters = readDB('disasters.json');
  const alerts = readDB('alerts.json');
  const details = [];

  const damResult = checkDams(dams, disasters, alerts, details);
  const eqResult = await checkEarthquakes(disasters, alerts, details);

  const newDisasters = damResult.newD + eqResult.newD;
  const newAlerts = damResult.newA + eqResult.newA;

  if (newDisasters > 0 || newAlerts > 0) {
    writeDB('disasters.json', disasters);
    writeDB('alerts.json', alerts);
  }

  if (details.length === 0) {
    console.log('[DisasterDetector] Cycle complete: all clear, no new threats detected');
  } else {
    details.forEach(d => console.log(`[DisasterDetector] ${d}`));
    console.log(`[DisasterDetector] Cycle complete: ${newDisasters} new disasters, ${newAlerts} new alerts`);
  }

  return { newDisasters, newAlerts, details };
}

function startAutoDetection(intervalMs = 300000) {
  setInterval(() => {
    runDisasterDetection().catch(err => {
      console.error('[DisasterDetector] Auto-detection error:', err.message);
    });
  }, intervalMs);
  console.log(`[DisasterDetector] Auto-detection started (every ${intervalMs / 1000}s)`);
}

module.exports = { runDisasterDetection, startAutoDetection };
