import { buildWhatsAppUrl, openWhatsApp } from './whatsappService';

const EMERGENCY_PHONE = import.meta.env.VITE_EMERGENCY_PHONE || '919843279397';

/**
 * Calculate aggregate statewide dam telemetry
 */
export function calculateDamAggregateStats(dams = []) {
  if (!dams.length) {
    return {
      totalCapacityTmc: 0,
      totalStorageTmc: 0,
      stateFillPercentage: 0,
      totalOutflowCusecs: 0,
      totalInflowCusecs: 0,
      activeSpillwayCount: 0,
      criticalDamsCount: 0,
      highAlertCount: 0,
      safeCount: 0,
    };
  }

  const totalCapacityTmc = dams.reduce((sum, d) => sum + (d.capacityTmc || 0), 0);
  const totalStorageTmc = dams.reduce((sum, d) => sum + (d.storageTmc || 0), 0);
  const stateFillPercentage = Math.round((totalStorageTmc / totalCapacityTmc) * 100);
  const totalOutflowCusecs = dams.reduce((sum, d) => sum + (d.outflowCusecs || 0), 0);
  const totalInflowCusecs = dams.reduce((sum, d) => sum + (d.inflowCusecs || 0), 0);

  const activeSpillwayCount = dams.filter((d) => d.outflowCusecs > 1000).length;
  const criticalDamsCount = dams.filter((d) => d.status === 'CRITICAL_SURGE').length;
  const highAlertCount = dams.filter((d) => d.status === 'HIGH_ALERT').length;
  const safeCount = dams.filter((d) => d.status === 'NORMAL' || d.status === 'CAUTION').length;

  return {
    totalCapacityTmc: Number(totalCapacityTmc.toFixed(1)),
    totalStorageTmc: Number(totalStorageTmc.toFixed(1)),
    stateFillPercentage,
    totalOutflowCusecs,
    totalInflowCusecs,
    activeSpillwayCount,
    criticalDamsCount,
    highAlertCount,
    safeCount,
  };
}

/**
 * Evaluates current level & outflow to determine safety tier
 */
export function evaluateDamStatus(dam) {
  const fillPct = (dam.currentLevelFt / dam.frlFt) * 100;

  if (fillPct >= 97 || dam.outflowCusecs >= 50000) {
    return {
      status: 'CRITICAL_SURGE',
      statusLabel: `CRITICAL FLOOD SURGE (${fillPct.toFixed(1)}% FRL)`,
      color: '#ef4444',
      badgeBg: 'bg-red-500/20 text-red-300 border-red-500/40',
      riskLevel: 95,
    };
  }

  if (fillPct >= 93 || dam.outflowCusecs >= 10000) {
    return {
      status: 'HIGH_ALERT',
      statusLabel: `High Surge Alert (${fillPct.toFixed(1)}% FRL)`,
      color: '#f97316',
      badgeBg: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
      riskLevel: 85,
    };
  }

  if (fillPct >= 85 || dam.outflowCusecs >= 2500) {
    return {
      status: 'CAUTION',
      statusLabel: `Cautious Discharge (${fillPct.toFixed(1)}% FRL)`,
      color: '#eab308',
      badgeBg: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
      riskLevel: 65,
    };
  }

  return {
    status: 'NORMAL',
    statusLabel: `Normal Operations (${fillPct.toFixed(1)}% FRL)`,
    color: '#22c55e',
    badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    riskLevel: 40,
  };
}

/**
 * Filter dams by river basin
 */
export function getDamsByBasin(dams = [], basin = 'ALL') {
  if (!basin || basin === 'ALL') return dams;
  return dams.filter((d) => d.basin === basin);
}

/**
 * Generate tactical WhatsApp flood surge warning message for District Collectors & Emergency Officers
 */
export function sendDamSurgeWhatsAppAlert(dam, recipientPhone = EMERGENCY_PHONE) {
  const time = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const fillPct = ((dam.currentLevelFt / dam.frlFt) * 100).toFixed(1);

  const msg =
    `🌊 *CRITICAL DAM SURGE & FLOOD EARLY WARNING* — ResQ EOC TN\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `*Reservoir:* ${dam.name}\n` +
    `*River Basin:* ${dam.river} (${dam.district} District)\n` +
    `*Water Level:* ${dam.currentLevelFt} ft / ${dam.frlFt} ft FRL (${fillPct}% Full)\n` +
    `*Storage:* ${dam.storageTmc} TMC (Max: ${dam.capacityTmc} TMC)\n` +
    `*Spillway Discharge:* ⚠️ *${dam.outflowCusecs.toLocaleString()} cusecs* (Inflow: ${dam.inflowCusecs.toLocaleString()} cusecs)\n` +
    `*Open Sluice Gates:* ${dam.openGates} of ${dam.spillwayGates} gates\n` +
    `*Issued at:* ${time} IST\n\n` +
    `🚨 *IMMEDIATE PROTOCOL FOR DOWNSTREAM COLLECTORS:*\n` +
    `1️⃣ Alert all villages along riverbanks in taluks: ${dam.vulnerableTaluks.slice(0, 4).join(', ')}.\n` +
    `2️⃣ Sound sirens and close all causeways/low-level bridges.\n` +
    `3️⃣ Enforce strict ban on swimming, fishing, and coracle boating.\n` +
    `4️⃣ Deploy SDRF/NDRF rescue boats to designated vulnerable bends.\n\n` +
    `⏱️ *DOWNSTREAM FLOOD WAVE TRANSIT ETA:*\n` +
    dam.transitSchedule
      .slice(0, 3)
      .map((t) => `• *${t.location}:* ${t.distanceKm} km — ETA ~${t.peakEta}`)
      .join('\n') +
    `\n\n` +
    `📞 EOC State Disaster Control Room: 1070 | Toll Free: 112\n` +
    `— Tamil Nadu Water Resources Dept & ResQ-EOC`;

  openWhatsApp(recipientPhone, msg);
}

/**
 * Generate public safety WhatsApp broadcast for Causeways & Accident Prevention
 */
export function sendCausewaySafetyWhatsApp(dam, causewayName, recipientPhone = EMERGENCY_PHONE) {
  const time = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  const msg =
    `⛔ *PUBLIC SAFETY WARNING: CAUSEWAY SUBMERGED* — TN POLICE & RESQ\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `📍 *Submerged Crossing:* ${causewayName}\n` +
    `*Originating Surge:* ${dam.name} (Discharging ${dam.outflowCusecs.toLocaleString()} cusecs)\n` +
    `*Time of Closure:* ${time} IST\n\n` +
    `⚠️ *WARNING: DO NOT ATTEMPT TO CROSS IN ANY VEHICLE OR ON FOOT.*\n` +
    `• Flood currents are extremely fast and lethal.\n` +
    `• Police barricades have been erected on both approach roads.\n` +
    `• Use the designated inland bypass highway.\n\n` +
    `🚫 *Bathing & Waterfall Ban Active at:* ${dam.accidentPrevention.bathingBanLocations.join(', ')}.\n\n` +
    `📞 Highway Patrol / Emergency: 112 | Disaster Helpline: 1077\n` +
    `— ResQ Early Warning System`;

  openWhatsApp(recipientPhone, msg);
}
