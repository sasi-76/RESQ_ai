const { readDB, writeDB } = require('../db');

const OPEN_METEO_FORECAST = 'https://api.open-meteo.com/v1/forecast';
const USGS_URL = 'https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&minlatitude=8&maxlatitude=14&minlongitude=76&maxlongitude=81&minmagnitude=2.5&orderby=time&limit=20&starttime=';

// ── Helpers ──────────────────────────────────────────────────────────────────

function generateId() {
  return `pred-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

function severityFromProbability(prob) {
  if (prob >= 80) return 'critical';
  if (prob >= 60) return 'high';
  if (prob >= 40) return 'moderate';
  if (prob >= 20) return 'low';
  return 'minimal';
}

function hoursFromNow(hours) {
  return new Date(Date.now() + hours * 3600 * 1000).toISOString();
}

/**
 * Haversine distance in km — proper geodesic calculation.
 * Replaces the old Euclidean degree-based approximation.
 */
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Known storage-only reservoirs that normally have zero outflow.
// These should NOT trigger rapid-filling alerts on low inflow.
const STORAGE_RESERVOIRS = new Set([
  'poondi', 'redhills', 'chembarambakkam',
]);

// ── Flood Prediction (Dam trend + rainfall forecast) ─────────────────────────

async function fetchRainfallForecast(lat, lng) {
  try {
    const url =
      `${OPEN_METEO_FORECAST}?latitude=${lat}&longitude=${lng}` +
      `&hourly=precipitation,precipitation_probability,wind_speed_10m,wind_gusts_10m` +
      `&daily=precipitation_sum,precipitation_probability_max,wind_speed_10m_max,wind_gusts_10m_max` +
      `&timezone=Asia/Kolkata&forecast_days=7`;

    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } catch (err) {
    console.warn(`[Predictor] Forecast fetch failed for ${lat},${lng}: ${err.message}`);
    return null;
  }
}

function predictFloodForDam(dam, forecastData) {
  const predictions = [];
  const fillPercent = (dam.storage / dam.capacity) * 100;
  const netFlow = dam.inflow - dam.outflow;
  const isStorageReservoir = STORAGE_RESERVOIRS.has(dam.id);

  // ── Trend-based: estimate when dam reaches critical levels ────────────
  if (netFlow > 0 && fillPercent < 100) {
    const remainingCapacityMcft = dam.capacity - dam.storage;
    // Convert cusecs to mcft/hour: cusecs * 3600 / 1e6
    const fillRateMcftPerHour = (netFlow * 3600) / 1e6;

    if (fillRateMcftPerHour > 0) {
      const hoursTo90 = fillPercent < 90
        ? ((dam.capacity * 0.9 - dam.storage) / fillRateMcftPerHour)
        : 0;
      const hoursToFull = remainingCapacityMcft / fillRateMcftPerHour;

      // Predict critical level
      if (hoursTo90 > 0 && hoursTo90 <= 72) {
        const urgency = hoursTo90 <= 12 ? 90 : hoursTo90 <= 24 ? 75 : hoursTo90 <= 48 ? 55 : 35;
        predictions.push({
          id: generateId(),
          type: 'flood',
          subtype: 'dam_overflow',
          severity: severityFromProbability(urgency),
          probability: Math.round(urgency),
          title: `${dam.name} approaching critical capacity`,
          description: `At current net inflow of ${netFlow.toLocaleString()} cusecs, ${dam.name} is projected to reach 90% capacity in approximately ${Math.round(hoursTo90)} hours. Currently at ${fillPercent.toFixed(1)}%. Downstream areas in ${dam.district} may face flooding.`,
          areaName: `${dam.name} - ${dam.district}`,
          lat: dam.lat,
          lng: dam.lng,
          predictedAt: new Date().toISOString(),
          predictedFor: hoursFromNow(hoursTo90),
          timeframeHours: Math.round(hoursTo90),
          confidence: clamp(85 - (hoursTo90 * 0.5), 40, 95),
          factors: [
            `Current fill: ${fillPercent.toFixed(1)}%`,
            `Net inflow: ${netFlow.toLocaleString()} cusecs`,
            `Inflow: ${dam.inflow.toLocaleString()} / Outflow: ${dam.outflow.toLocaleString()} cusecs`,
            `Estimated ${Math.round(hoursTo90)}h to 90% capacity`,
          ],
          recommendedActions: [
            `Alert downstream communities in ${dam.district}`,
            'Increase dam outflow to slow filling rate',
            'Pre-position rescue teams along river corridor',
            'Notify district administration for potential evacuation',
          ],
          source: 'trend-analysis',
        });
      }

      // Predict full capacity
      if (hoursToFull > 0 && hoursToFull <= 96) {
        const urgency = hoursToFull <= 24 ? 85 : hoursToFull <= 48 ? 65 : 45;
        predictions.push({
          id: generateId(),
          type: 'flood',
          subtype: 'dam_full',
          severity: severityFromProbability(urgency),
          probability: Math.round(urgency),
          title: `${dam.name} projected to reach full capacity`,
          description: `${dam.name} may reach 100% storage in ~${Math.round(hoursToFull)} hours. Emergency spillway operations will be required. Major downstream flooding risk for ${dam.district} and adjacent areas.`,
          areaName: `${dam.name} - ${dam.district}`,
          lat: dam.lat,
          lng: dam.lng,
          predictedAt: new Date().toISOString(),
          predictedFor: hoursFromNow(hoursToFull),
          timeframeHours: Math.round(hoursToFull),
          confidence: clamp(80 - (hoursToFull * 0.4), 35, 90),
          factors: [
            `Current storage: ${dam.storage.toLocaleString()} / ${dam.capacity.toLocaleString()} mcft`,
            `Net inflow rate: ${netFlow.toLocaleString()} cusecs`,
            `Fill rate: ${fillRateMcftPerHour.toFixed(2)} mcft/hour`,
          ],
          recommendedActions: [
            'Prepare emergency spillway discharge plan',
            `Begin evacuating low-lying areas near ${dam.river} river`,
            'Deploy rescue boats and emergency shelters downstream',
            'Coordinate with upstream dams for controlled release',
          ],
          source: 'trend-analysis',
        });
      }
    }
  }

  // ── Rapid filling compound risk ─────────────────────────────────────────
  // For storage reservoirs (Poondi, Red Hills, Chembarambakkam) with zero outflow,
  // only trigger if inflow is genuinely high (>500 cusecs) AND fill is high.
  // These reservoirs normally have outflow=0 — that's not an emergency.
  const inflowOutflowRatio = dam.outflow > 0
    ? dam.inflow / dam.outflow
    : null;

  let triggerRapidFilling = false;
  if (isStorageReservoir) {
    // Storage reservoir: only alert on genuinely dangerous inflow
    triggerRapidFilling = dam.inflow > 500 && fillPercent > 80;
  } else if (inflowOutflowRatio !== null) {
    // Normal dam: original logic — inflow > 2.5x outflow at high fill
    triggerRapidFilling = inflowOutflowRatio > 2.5 && fillPercent > 70;
  }

  if (triggerRapidFilling) {
    const ratioDisplay = inflowOutflowRatio !== null
      ? `${inflowOutflowRatio.toFixed(1)}x outflow`
      : `${dam.inflow.toLocaleString()} cusecs (zero outflow)`;

    const prob = isStorageReservoir
      ? clamp(35 + (fillPercent - 80) * 2 + Math.min(dam.inflow / 100, 20), 35, 90)
      : clamp(
          40 + (fillPercent - 70) * 1.5 + (inflowOutflowRatio - 2) * 10,
          40,
          95
        );

    predictions.push({
      id: generateId(),
      type: 'flood',
      subtype: 'rapid_filling',
      severity: severityFromProbability(prob),
      probability: Math.round(prob),
      title: `Rapid filling at ${dam.name}`,
      description: `Inflow (${dam.inflow.toLocaleString()} cusecs) ${isStorageReservoir ? 'is high for this storage reservoir' : `vastly exceeds outflow (${dam.outflow.toLocaleString()} cusecs)`}. At ${fillPercent.toFixed(1)}% fill, risk of emergency spillway activation is elevated.`,
      areaName: `${dam.name} - ${dam.district}`,
      lat: dam.lat,
      lng: dam.lng,
      predictedAt: new Date().toISOString(),
      predictedFor: hoursFromNow(12),
      timeframeHours: 12,
      confidence: isStorageReservoir ? 60 : 70,
      factors: [
        `Inflow: ${ratioDisplay}`,
        `Fill level: ${fillPercent.toFixed(1)}%`,
        `River: ${dam.river}`,
        isStorageReservoir ? 'Storage reservoir (zero outflow is normal operation)' : null,
      ].filter(Boolean),
      recommendedActions: [
        isStorageReservoir
          ? 'Begin controlled release to downstream channels'
          : 'Increase controlled outflow immediately',
        'Alert all downstream riverside settlements',
        'Deploy water-level monitoring along river path',
      ],
      source: 'compound-analysis',
    });
  }

  // ── Forecast-based rainfall prediction ──────────────────────────────────
  if (forecastData && forecastData.daily) {
    const daily = forecastData.daily;
    for (let day = 0; day < (daily.time || []).length && day < 5; day++) {
      const rainSum = daily.precipitation_sum?.[day] || 0;
      const rainProbMax = daily.precipitation_probability_max?.[day] || 0;
      const windMax = daily.wind_speed_10m_max?.[day] || 0;
      const gustMax = daily.wind_gusts_10m_max?.[day] || 0;

      // Heavy rainfall forecast
      if (rainSum > 40 || (rainProbMax > 70 && rainSum > 20)) {
        const prob = clamp(
          30 + (rainSum / 2) + (fillPercent > 75 ? 20 : 0) + (netFlow > 0 ? 10 : 0),
          30,
          95
        );
        const dayLabel = day === 0 ? 'Today' : day === 1 ? 'Tomorrow' : `In ${day} days`;
        predictions.push({
          id: generateId(),
          type: 'flood',
          subtype: 'rainfall_forecast',
          severity: severityFromProbability(prob),
          probability: Math.round(prob),
          title: `Heavy rainfall forecast near ${dam.name} (${dayLabel})`,
          description: `Forecast: ${rainSum.toFixed(1)}mm of rain (${rainProbMax}% probability) expected on ${daily.time[day]} in the ${dam.name} catchment area. ${fillPercent > 75 ? 'Combined with high dam levels, flood risk is significantly elevated.' : 'Monitor dam levels for rising trend.'}`,
          areaName: `${dam.name} catchment - ${dam.district}`,
          lat: dam.lat,
          lng: dam.lng,
          predictedAt: new Date().toISOString(),
          predictedFor: new Date(daily.time[day] + 'T12:00:00+05:30').toISOString(),
          timeframeHours: (day + 1) * 24,
          confidence: clamp(70 - day * 8, 35, 80),
          factors: [
            `Forecast rainfall: ${rainSum.toFixed(1)}mm`,
            `Rain probability: ${rainProbMax}%`,
            `Current dam fill: ${fillPercent.toFixed(1)}%`,
            `Max wind: ${windMax.toFixed(1)} km/h`,
          ],
          recommendedActions: [
            'Pre-position flood rescue assets',
            `Prepare controlled release from ${dam.name} to create buffer`,
            `Issue advance flood warning for ${dam.district}`,
          ],
          source: 'weather-forecast',
        });
      }

      // Cyclone / severe wind prediction
      if (gustMax > 80 || windMax > 60) {
        const isCyclone = gustMax > 100 || windMax > 80;
        const prob = clamp(
          (isCyclone ? 60 : 35) + (gustMax > 120 ? 20 : 0) + (windMax > 90 ? 15 : 0),
          30,
          90
        );
        const dayLabel = day === 0 ? 'Today' : day === 1 ? 'Tomorrow' : `In ${day} days`;
        predictions.push({
          id: generateId(),
          type: 'cyclone',
          subtype: isCyclone ? 'cyclone_formation' : 'severe_winds',
          severity: severityFromProbability(prob),
          probability: Math.round(prob),
          title: `${isCyclone ? 'Cyclonic storm' : 'Severe winds'} forecast near ${dam.district} (${dayLabel})`,
          description: `Wind speeds up to ${windMax.toFixed(1)} km/h with gusts of ${gustMax.toFixed(1)} km/h expected on ${daily.time[day]}. ${isCyclone ? 'Cyclonic conditions likely — prepare for structural damage and power outages.' : 'High winds may cause localized damage and disruption.'}`,
          areaName: dam.district,
          lat: dam.lat,
          lng: dam.lng,
          predictedAt: new Date().toISOString(),
          predictedFor: new Date(daily.time[day] + 'T12:00:00+05:30').toISOString(),
          timeframeHours: (day + 1) * 24,
          confidence: clamp(65 - day * 10, 30, 75),
          factors: [
            `Max wind: ${windMax.toFixed(1)} km/h`,
            `Max gusts: ${gustMax.toFixed(1)} km/h`,
            `Day: ${daily.time[day]}`,
          ],
          recommendedActions: [
            'Secure loose structures and signage',
            'Pre-position tree-clearing and power-restoration crews',
            isCyclone ? 'Prepare cyclone shelters and evacuation routes' : 'Issue wind advisory to public',
            'Alert hospitals for potential casualty surge',
          ],
          source: 'weather-forecast',
        });
      }
    }
  }

  return predictions;
}

// ── Earthquake Prediction (Frequency / Clustering Analysis) ──────────────────

async function predictEarthquakes(_disasters, details) {
  const predictions = [];

  try {
    // Fetch 30 days of earthquake data for the region
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000)
      .toISOString()
      .split('T')[0];
    const url = USGS_URL + thirtyDaysAgo;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`USGS HTTP ${res.status}`);
    const data = await res.json();

    if (!data.features || data.features.length < 2) {
      details.push('Earthquake prediction: insufficient recent seismic data');
      return predictions;
    }

    const quakes = data.features.map(f => ({
      mag: f.properties.mag,
      time: f.properties.time,
      place: f.properties.place,
      lat: f.geometry.coordinates[1],
      lng: f.geometry.coordinates[0],
      depth: f.geometry.coordinates[2],
    }));

    // Frequency analysis — are quakes clustering in time?
    const recentWeek = quakes.filter(
      q => q.time > Date.now() - 7 * 24 * 3600 * 1000
    );
    const priorWeeks = quakes.filter(
      q => q.time <= Date.now() - 7 * 24 * 3600 * 1000
    );

    const avgPriorWeekly = priorWeeks.length / Math.max(1, 3); // avg per week over ~3 weeks
    const recentRate = recentWeek.length;

    if (recentRate > avgPriorWeekly * 1.5 && recentRate >= 3) {
      // Elevated seismic activity
      const avgMag =
        recentWeek.reduce((s, q) => s + q.mag, 0) / recentWeek.length;
      const maxMag = Math.max(...recentWeek.map(q => q.mag));
      const centroidLat =
        recentWeek.reduce((s, q) => s + q.lat, 0) / recentWeek.length;
      const centroidLng =
        recentWeek.reduce((s, q) => s + q.lng, 0) / recentWeek.length;

      const prob = clamp(
        25 + (recentRate / avgPriorWeekly - 1) * 20 + (maxMag - 3) * 10,
        20,
        70
      );

      predictions.push({
        id: generateId(),
        type: 'earthquake',
        subtype: 'seismic_cluster',
        severity: severityFromProbability(prob),
        probability: Math.round(prob),
        title: 'Elevated seismic activity detected in region',
        description: `${recentWeek.length} earthquakes recorded in the past 7 days, compared to an average of ${avgPriorWeekly.toFixed(1)}/week. Average magnitude: M${avgMag.toFixed(1)}, strongest: M${maxMag.toFixed(1)}. Heightened probability of aftershocks or a larger event.`,
        areaName: 'Tamil Nadu / Karnataka Seismic Zone',
        lat: centroidLat,
        lng: centroidLng,
        predictedAt: new Date().toISOString(),
        predictedFor: hoursFromNow(72),
        timeframeHours: 72,
        confidence: clamp(40 + recentRate * 3, 30, 65),
        factors: [
          `Recent quakes (7d): ${recentWeek.length}`,
          `Average weekly (prior): ${avgPriorWeekly.toFixed(1)}`,
          `Peak magnitude: M${maxMag.toFixed(1)}`,
          `Average magnitude: M${avgMag.toFixed(1)}`,
          `Average depth: ${(recentWeek.reduce((s, q) => s + q.depth, 0) / recentWeek.length).toFixed(1)} km`,
        ],
        recommendedActions: [
          'Review structural integrity of critical infrastructure',
          'Ensure earthquake emergency kits are distributed',
          'Alert hospitals to prepare for potential casualties',
          'Pre-stage search-and-rescue equipment',
        ],
        source: 'seismic-frequency-analysis',
      });

      details.push(
        `Earthquake prediction: ${recentWeek.length} quakes in 7d vs ${avgPriorWeekly.toFixed(1)}/wk avg → elevated risk (${prob}%)`
      );
    } else {
      details.push(
        `Earthquake prediction: seismic activity within normal range (${recentRate} in 7d vs ${avgPriorWeekly.toFixed(1)}/wk avg)`
      );
    }

    // Individual large quake aftershock prediction
    const recentLarge = recentWeek.filter(q => q.mag >= 4.0);
    for (const quake of recentLarge) {
      const hoursSince = (Date.now() - quake.time) / 3600000;
      if (hoursSince < 72) {
        // Bath's law: largest aftershock ~ mainshock - 1.2
        const expectedAftershockMag = quake.mag - 1.2;
        const prob = clamp(60 - hoursSince * 0.5, 25, 80);

        predictions.push({
          id: generateId(),
          type: 'earthquake',
          subtype: 'aftershock',
          severity: severityFromProbability(prob),
          probability: Math.round(prob),
          title: `Aftershock risk from M${quake.mag.toFixed(1)} quake near ${quake.place}`,
          description: `A M${quake.mag.toFixed(1)} earthquake occurred ${Math.round(hoursSince)}h ago near ${quake.place}. Aftershocks up to M${expectedAftershockMag.toFixed(1)} are possible over the next ${Math.round(72 - hoursSince)} hours.`,
          areaName: quake.place || 'Southern India',
          lat: quake.lat,
          lng: quake.lng,
          predictedAt: new Date().toISOString(),
          predictedFor: hoursFromNow(Math.max(6, 72 - hoursSince)),
          timeframeHours: Math.round(Math.max(6, 72 - hoursSince)),
          confidence: clamp(55 - hoursSince * 0.3, 30, 70),
          factors: [
            `Mainshock: M${quake.mag.toFixed(1)}`,
            `Time since: ${Math.round(hoursSince)}h`,
            `Expected max aftershock: ~M${expectedAftershockMag.toFixed(1)}`,
            `Depth: ${quake.depth.toFixed(1)} km`,
          ],
          recommendedActions: [
            'Avoid damaged or weakened structures',
            'Keep emergency supplies accessible',
            'Monitor USGS for aftershock sequence updates',
          ],
          source: 'aftershock-model',
        });
      }
    }
  } catch (err) {
    console.warn(`[Predictor] Earthquake prediction failed: ${err.message}`);
    details.push(`Earthquake prediction: skipped (${err.message})`);
  }

  return predictions;
}

// ── Compound Risk: dam + weather + existing disasters ────────────────────────

function predictCompoundRisks(dams, disasters) {
  const predictions = [];
  const activeDisasters = disasters.filter(d => d.status === 'active');

  for (const dam of dams) {
    const fillPercent = (dam.storage / dam.capacity) * 100;

    // Use proper haversine distance instead of Euclidean degree approximation
    const nearbyDisasters = activeDisasters.filter(d => {
      if (!d.lat || !d.lng) return false;
      const distKm = haversineKm(d.lat, d.lng, dam.lat, dam.lng);
      return distKm < 150; // 150km radius
    });

    if (nearbyDisasters.length > 0 && fillPercent > 65) {
      const hasFlood = nearbyDisasters.some(d => d.type === 'flood');
      const hasCyclone = nearbyDisasters.some(d => d.type === 'cyclone');
      const hasEarthquake = nearbyDisasters.some(d => d.type === 'earthquake');

      // Count unique disaster types, not raw count — prevents saturation
      // when the disaster DB accumulates many entries of the same type.
      const uniqueTypes = [...new Set(nearbyDisasters.map(d => d.type))];
      const uniqueCount = uniqueTypes.length;

      // Base probability from distinct hazard types (not raw count)
      let prob = 25 + uniqueCount * 15 + (fillPercent - 65) * 0.6;

      // Bonuses for specific dangerous combos
      if (hasFlood && fillPercent > 80) prob += 12;
      if (hasCyclone) prob += 15;
      if (hasEarthquake) prob += 10; // dam structural risk

      prob = clamp(prob, 25, 90);

      // Dynamic confidence based on data quality signals
      let confidence = 40;
      // More distinct hazard types → more data supporting compound risk
      confidence += uniqueCount * 8;
      // Higher dam fill → more reliable the prediction
      if (fillPercent > 80) confidence += 10;
      else if (fillPercent > 70) confidence += 5;
      // Recent disasters (created in last 6h) are more reliable signals
      const recentDisasters = nearbyDisasters.filter(
        d => new Date(d.createdAt).getTime() > Date.now() - 6 * 3600 * 1000
      );
      if (recentDisasters.length > 0) confidence += 8;
      confidence = clamp(confidence, 30, 80);

      const types = uniqueTypes.join(', ');
      predictions.push({
        id: generateId(),
        type: 'compound',
        subtype: 'multi_hazard',
        severity: severityFromProbability(prob),
        probability: Math.round(prob),
        title: `Compound disaster risk: ${dam.name} area`,
        description: `${uniqueCount} active hazard type(s) (${types}) within 150km of ${dam.name} while dam is at ${fillPercent.toFixed(1)}% capacity. Multiple simultaneous hazards significantly increase the risk of cascading failures and complicate response operations.`,
        areaName: `${dam.name} region - ${dam.district}`,
        lat: dam.lat,
        lng: dam.lng,
        predictedAt: new Date().toISOString(),
        predictedFor: hoursFromNow(24),
        timeframeHours: 24,
        confidence,
        factors: [
          `Active hazard types nearby: ${uniqueCount} (${types})`,
          `Total active disasters within 150km: ${nearbyDisasters.length}`,
          `Dam fill: ${fillPercent.toFixed(1)}%`,
          hasEarthquake ? 'Earthquake may compromise dam structure' : null,
          hasCyclone ? 'Cyclone may bring additional rainfall' : null,
        ].filter(Boolean),
        recommendedActions: [
          'Escalate to multi-hazard emergency protocol',
          'Coordinate joint response across disaster types',
          `Increase monitoring frequency for ${dam.name}`,
          'Prepare for cascading failure scenarios',
          'Brief all field teams on compound risk factors',
        ],
        source: 'compound-analysis',
      });
    }
  }

  return predictions;
}

// ── Prediction Expiry & Outcome Validation ──────────────────────────────────

/**
 * Check previous predictions against what actually happened.
 * Moves expired predictions to a history file with outcome status.
 */
function validateAndExpirePredictions() {
  let history = [];
  try {
    history = readDB('predictionHistory.json') || [];
  } catch {
    // File doesn't exist yet — that's fine
  }

  const oldPredictions = readDB('predictions.json') || [];
  const now = Date.now();
  const disasters = readDB('disasters.json') || [];

  for (const pred of oldPredictions) {
    const predictedForMs = new Date(pred.predictedFor).getTime();
    const isExpired = predictedForMs < now;

    if (!isExpired) continue;

    // Check if this prediction materialized — did a matching disaster appear
    // between when the prediction was made and when it was supposed to happen?
    const predictedAtMs = new Date(pred.predictedAt).getTime();
    const matchingDisaster = disasters.find(d => {
      const createdMs = new Date(d.createdAt).getTime();
      // Disaster appeared during the prediction window
      if (createdMs < predictedAtMs || createdMs > predictedForMs + 6 * 3600000) return false;
      // Same type
      if (d.type !== pred.type) return false;
      // Same area (fuzzy match)
      if (pred.lat && pred.lng && d.lat && d.lng) {
        return haversineKm(pred.lat, pred.lng, d.lat, d.lng) < 100;
      }
      return d.areaName && pred.areaName &&
        d.areaName.toLowerCase().includes(pred.areaName.split(' - ')[0].toLowerCase());
    });

    history.unshift({
      ...pred,
      outcome: matchingDisaster ? 'materialized' : 'did_not_materialize',
      matchedDisasterId: matchingDisaster?.id || null,
      expiredAt: new Date().toISOString(),
    });
  }

  // Keep last 200 history entries
  history = history.slice(0, 200);

  if (history.length > 0) {
    writeDB('predictionHistory.json', history);

    // Log calibration stats
    const recent = history.slice(0, 50);
    const materialized = recent.filter(h => h.outcome === 'materialized').length;
    const total = recent.length;
    if (total >= 5) {
      console.log(`[Predictor] Calibration: ${materialized}/${total} recent predictions materialized (${((materialized / total) * 100).toFixed(0)}%)`);
    }
  }

  return history;
}

// ── Main Prediction Runner ───────────────────────────────────────────────────

async function runDisasterPrediction() {
  console.log('[Predictor] Running prediction cycle...');
  const startTime = Date.now();

  const dams = readDB('dams.json');
  const disasters = readDB('disasters.json');
  const details = [];
  let allPredictions = [];

  // 0. Validate and expire old predictions before generating new ones
  validateAndExpirePredictions();

  // 1. Flood + cyclone predictions (per dam, with weather forecast)
  const damForecasts = await Promise.allSettled(
    dams.map(async dam => {
      const forecast = await fetchRainfallForecast(dam.lat, dam.lng);
      return { dam, forecast };
    })
  );

  for (const result of damForecasts) {
    if (result.status === 'fulfilled') {
      const { dam, forecast } = result.value;
      const damPreds = predictFloodForDam(dam, forecast);
      allPredictions.push(...damPreds);
      if (damPreds.length > 0) {
        details.push(`${dam.name}: ${damPreds.length} prediction(s) generated`);
      }
    }
  }

  // 2. Earthquake predictions
  const eqPreds = await predictEarthquakes(disasters, details);
  allPredictions.push(...eqPreds);

  // 3. Compound risk predictions
  const compoundPreds = predictCompoundRisks(dams, disasters);
  allPredictions.push(...compoundPreds);
  if (compoundPreds.length > 0) {
    details.push(`Compound risk: ${compoundPreds.length} multi-hazard prediction(s)`);
  }

  // Deduplicate: keep highest probability per areaName+type+subtype
  const seen = new Map();
  for (const pred of allPredictions) {
    const key = `${pred.areaName}|${pred.type}|${pred.subtype}`;
    const existing = seen.get(key);
    if (!existing || pred.probability > existing.probability) {
      seen.set(key, pred);
    }
  }
  allPredictions = Array.from(seen.values());

  // Filter out expired predictions (predictedFor is in the past)
  const now = Date.now();
  allPredictions = allPredictions.filter(p => {
    const predictedForMs = new Date(p.predictedFor).getTime();
    return predictedForMs > now;
  });

  // Sort by probability descending
  allPredictions.sort((a, b) => b.probability - a.probability);

  // Store predictions with cycle metadata
  writeDB('predictions.json', allPredictions);

  // Store cycle metadata for staleness tracking
  const meta = { lastCycleAt: new Date().toISOString(), totalGenerated: allPredictions.length };
  try {
    const existing = readDB('predictionMeta.json') || {};
    writeDB('predictionMeta.json', { ...existing, ...meta });
  } catch {
    writeDB('predictionMeta.json', meta);
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  if (details.length === 0) {
    console.log(`[Predictor] Cycle complete in ${elapsed}s: no elevated risks detected`);
  } else {
    details.forEach(d => console.log(`[Predictor]   ${d}`));
    console.log(
      `[Predictor] Cycle complete in ${elapsed}s: ${allPredictions.length} prediction(s) generated`
    );
  }

  return {
    totalPredictions: allPredictions.length,
    predictions: allPredictions,
    details,
    elapsed: `${elapsed}s`,
  };
}

function startAutoPrediction(intervalMs = 600000) {
  setInterval(() => {
    runDisasterPrediction().catch(err => {
      console.error('[Predictor] Auto-prediction error:', err.message);
    });
  }, intervalMs);
  console.log(
    `[Predictor] Auto-prediction started (every ${intervalMs / 1000}s)`
  );
}

module.exports = { runDisasterPrediction, startAutoPrediction };
