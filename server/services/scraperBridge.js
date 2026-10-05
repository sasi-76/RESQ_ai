const { readDB, writeDB } = require('../db');

const SCRAPER_BASE = process.env.SCRAPER_URL || 'http://localhost:5001';
const FETCH_TIMEOUT = 15000;

async function fetchScraper(endpoint) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

  try {
    const res = await fetch(`${SCRAPER_BASE}${endpoint}`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      // Handle rate limiting from scraper service
      if (res.status === 429) {
        console.warn(`[ScraperBridge] Rate limited on ${endpoint}, backing off`);
        return null;
      }
      throw new Error(`HTTP ${res.status}`);
    }
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Scraper returned failure');
    return json.data;
  } catch (err) {
    clearTimeout(timeout);
    if (err.name === 'AbortError') {
      console.warn(`[ScraperBridge] Timeout fetching ${endpoint}`);
    } else {
      console.warn(`[ScraperBridge] ${endpoint}: ${err.message}`);
    }
    return null;
  }
}

// Enrich dam database with scraped metadata (bulletin refs, registry info, verified dams)
// Only writes to DB when real data is received — never overwrites with empty/null
async function enrichDamsWithScrapedData() {
  const scraped = await fetchScraper('/api/scrape/dams');
  if (!scraped || typeof scraped !== 'object') {
    console.log('[ScraperBridge] No scraped dam data available, keeping existing');
    return null;
  }

  const dams = readDB('dams.json');
  let enriched = 0;

  // Enrich dams with registry metadata (river, district) and verification status
  const registry = scraped.registry || {};
  const verifiedIds = new Set((scraped.verifiedDams || []).map(v => v.id));

  for (const dam of dams) {
    const regEntry = registry[dam.id];
    if (regEntry) {
      if (regEntry.river) dam.river = regEntry.river;
      if (regEntry.district) dam.district = regEntry.district;
      dam.verifiedOnGovSite = verifiedIds.has(dam.id);
      enriched++;
    }
  }

  // Store bulletin reference for display
  if (scraped.bulletin) {
    const meta = readDB('scraperMeta.json') || {};
    meta.cwcBulletin = scraped.bulletin;
    meta.lastDamScrape = scraped.scrapedAt;
    writeDB('scraperMeta.json', meta);
  }

  if (enriched > 0) {
    writeDB('dams.json', dams);
    console.log(`[ScraperBridge] Enriched ${enriched}/${dams.length} dams with registry data`);
  }

  if (scraped.bulletin) {
    console.log(`[ScraperBridge] CWC bulletin: ${scraped.bulletin.url}`);
  }

  return dams;
}

// Fetch weather warnings from IMD and inject as alerts
// Only creates alerts from real scraped warnings — skips if scraper returns empty
async function ingestWeatherWarnings() {
  const warnings = await fetchScraper('/api/scrape/weather-warnings');
  if (!warnings || !Array.isArray(warnings) || warnings.length === 0) return [];

  const alerts = readDB('alerts.json');
  const now = new Date().toISOString();
  let newAlerts = 0;

  for (const warning of warnings) {
    // Validate required fields — only ingest real data
    if (!warning.district || !warning.type || !warning.message) continue;

    const alertId = `imd-${warning.type}-${warning.district}-${Date.now()}`;
    const isDuplicate = alerts.some(a =>
      a.source === 'IMD-scraper' &&
      a.area === warning.district &&
      a.type === warning.type &&
      new Date(a.createdAt).getTime() > Date.now() - 6 * 3600 * 1000
    );

    if (!isDuplicate) {
      alerts.push({
        id: alertId,
        type: warning.type || 'weather',
        priority: warning.severity === 'critical' ? 'critical' :
                  warning.severity === 'high' ? 'warning' : 'info',
        title: `IMD ${(warning.severity || 'advisory').toUpperCase()}: ${warning.district}`,
        message: warning.message || `${warning.type} warning for ${warning.district}`,
        area: warning.district,
        source: 'IMD-scraper',
        createdAt: now,
        validFrom: warning.validFrom,
        validUntil: warning.validUntil,
        read: false,
      });
      newAlerts++;
    }
  }

  if (newAlerts > 0) {
    writeDB('alerts.json', alerts);
    console.log(`[ScraperBridge] Ingested ${newAlerts} IMD weather warnings as alerts`);
  }

  return warnings;
}

// Fetch cyclone bulletins
async function fetchCycloneBulletins() {
  return await fetchScraper('/api/scrape/cyclone-bulletins') || [];
}

// Fetch real river levels (replaces mock data)
async function fetchRealRiverLevels() {
  return await fetchScraper('/api/scrape/river-levels') || [];
}

// Fetch NDMA disaster alerts and inject as system disasters
// Only creates disasters from real scraped alerts — validates all required fields
async function ingestNDMAAlerts() {
  const ndmaAlerts = await fetchScraper('/api/scrape/ndma-alerts');
  if (!ndmaAlerts || !Array.isArray(ndmaAlerts) || ndmaAlerts.length === 0) return [];

  const disasters = readDB('disasters.json');
  const alerts = readDB('alerts.json');
  const now = new Date().toISOString();
  let newDisasters = 0;

  for (const ndma of ndmaAlerts) {
    // Validate required fields — only real data gets ingested
    if (!ndma.title || !ndma.area || !ndma.severity) continue;
    if (ndma.severity === 'low' || ndma.severity === 'info') continue;

    const isDuplicate = disasters.some(d =>
      d.source === 'NDMA-scraper' &&
      d.areaName === ndma.area &&
      d.type === ndma.type &&
      new Date(d.createdAt).getTime() > Date.now() - 12 * 3600 * 1000
    );

    if (!isDuplicate) {
      // Only accept entries with real coordinates (not default fallback)
      const hasRealCoords = ndma.lat && ndma.lng && ndma.lat !== 11.13 && ndma.lng !== 78.66;

      const disasterId = `ndma-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      disasters.push({
        id: disasterId,
        type: ndma.type || 'flood',
        severity: ndma.severity === 'critical' ? 'critical' : 'warning',
        areaName: ndma.area || ndma.title,
        lat: hasRealCoords ? ndma.lat : undefined,
        lng: hasRealCoords ? ndma.lng : undefined,
        source: 'NDMA-scraper',
        trigger: ndma.title,
        description: ndma.description,
        status: 'active',
        createdAt: now,
        autoDetected: true,
      });

      alerts.push({
        id: `alert-${disasterId}`,
        type: ndma.type || 'weather',
        priority: ndma.severity === 'critical' ? 'critical' : 'warning',
        title: `NDMA: ${ndma.title}`,
        message: ndma.description,
        area: ndma.area,
        source: 'NDMA-scraper',
        createdAt: now,
        read: false,
      });

      newDisasters++;
    }
  }

  if (newDisasters > 0) {
    writeDB('disasters.json', disasters);
    writeDB('alerts.json', alerts);
    console.log(`[ScraperBridge] Ingested ${newDisasters} NDMA alerts as disasters`);
  }

  return ndmaAlerts;
}

// Enrich hospital database with real scraped data only
// Only updates fields that have real values — never overwrites with null/0
async function enrichHospitals() {
  const scraped = await fetchScraper('/api/scrape/hospitals');
  if (!scraped || !Array.isArray(scraped) || scraped.length === 0) return null;

  const hospitals = readDB('hospitals.json');
  let updated = 0;
  let added = 0;

  for (const scrapedHosp of scraped) {
    const match = hospitals.find(h =>
      h.name.toLowerCase().includes(scrapedHosp.name?.toLowerCase()?.slice(0, 15)) ||
      scrapedHosp.name?.toLowerCase().includes(h.name?.toLowerCase()?.slice(0, 15))
    );

    if (match) {
      // Only update with real non-null values
      if (scrapedHosp.beds != null && scrapedHosp.beds > 0) match.beds = scrapedHosp.beds;
      if (scrapedHosp.availableBeds != null) match.availableBeds = scrapedHosp.availableBeds;
      if (scrapedHosp.phone && scrapedHosp.phone.length > 5) match.phone = scrapedHosp.phone;
      match.scrapedSource = scrapedHosp.source || 'web-scraper';
      match.lastScrapedAt = new Date().toISOString();
      updated++;
    } else if (scrapedHosp.lat && scrapedHosp.lng && scrapedHosp.name) {
      // Only add hospitals with real coordinates
      hospitals.push({
        id: 2000 + hospitals.length,
        name: scrapedHosp.name,
        city: scrapedHosp.city || '',
        district: scrapedHosp.district || '',
        locality: scrapedHosp.locality || '',
        lat: scrapedHosp.lat,
        lng: scrapedHosp.lng,
        type: scrapedHosp.type || 'General Hospital',
        emergency: scrapedHosp.emergency !== false,
        ambulances: scrapedHosp.ambulances || 2,
        status: 'operational',
        phone: scrapedHosp.phone || '',
        beds: scrapedHosp.beds || 0,
        availableBeds: scrapedHosp.availableBeds,
        scrapedSource: scrapedHosp.source || 'web-scraper',
        lastScrapedAt: new Date().toISOString(),
      });
      added++;
    }
  }

  if (updated > 0 || added > 0) {
    writeDB('hospitals.json', hospitals);
    console.log(`[ScraperBridge] Hospitals: ${updated} updated, ${added} new added`);
  }

  return hospitals;
}

// Fetch disaster news for situational awareness
async function fetchDisasterNews() {
  return await fetchScraper('/api/scrape/disaster-news') || [];
}

// Fetch blood bank availability
async function fetchBloodBanks() {
  return await fetchScraper('/api/scrape/blood-banks') || [];
}

// Run all scrapers and return combined results
async function runFullScrapeSync() {
  console.log('[ScraperBridge] Running full scrape cycle (real data only)...');
  const startTime = Date.now();

  const results = await Promise.allSettled([
    enrichDamsWithScrapedData(),
    ingestWeatherWarnings(),
    fetchCycloneBulletins(),
    fetchRealRiverLevels(),
    ingestNDMAAlerts(),
    enrichHospitals(),
    fetchDisasterNews(),
  ]);

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const successes = results.filter(r => r.status === 'fulfilled' && r.value).length;
  const failures = results.filter(r => r.status === 'rejected').length;

  console.log(`[ScraperBridge] Full scrape complete in ${elapsed}s (${successes}/${results.length} sources, ${failures} failures)`);

  return {
    dams: results[0].status === 'fulfilled' ? results[0].value : null,
    weatherWarnings: results[1].status === 'fulfilled' ? results[1].value : [],
    cycloneBulletins: results[2].status === 'fulfilled' ? results[2].value : [],
    riverLevels: results[3].status === 'fulfilled' ? results[3].value : [],
    ndmaAlerts: results[4].status === 'fulfilled' ? results[4].value : [],
    hospitals: results[5].status === 'fulfilled' ? results[5].value : null,
    news: results[6].status === 'fulfilled' ? results[6].value : [],
    elapsed: `${elapsed}s`,
    sources: successes,
  };
}

// Check if scraper service is reachable
async function isScraperAvailable() {
  try {
    const data = await fetchScraper('/api/scrape/health');
    return data !== null;
  } catch {
    return false;
  }
}

function startAutoScraping(intervalMs = 1800000) {
  console.log(`[ScraperBridge] Auto-scraping scheduled every ${intervalMs / 60000} minutes`);
  setInterval(async () => {
    const available = await isScraperAvailable();
    if (available) {
      await runFullScrapeSync();
    } else {
      console.log('[ScraperBridge] Scraper service unavailable, skipping cycle');
    }
  }, intervalMs);
}

module.exports = {
  enrichDamsWithScrapedData,
  ingestWeatherWarnings,
  fetchCycloneBulletins,
  fetchRealRiverLevels,
  ingestNDMAAlerts,
  enrichHospitals,
  fetchDisasterNews,
  fetchBloodBanks,
  runFullScrapeSync,
  isScraperAvailable,
  startAutoScraping,
};
