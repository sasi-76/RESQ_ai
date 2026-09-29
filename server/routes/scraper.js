const express = require('express');
const router = express.Router();
const {
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
} = require('../services/scraperBridge');

router.get('/status', async (req, res) => {
  const available = await isScraperAvailable();
  res.json({
    success: true,
    data: {
      scraperAvailable: available,
      scraperUrl: process.env.SCRAPER_URL || 'http://localhost:5001',
    },
  });
});

router.post('/sync-all', async (req, res) => {
  try {
    const result = await runFullScrapeSync();
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/sync-dams', async (req, res) => {
  try {
    const dams = await enrichDamsWithScrapedData();
    res.json({ success: true, data: dams, message: dams ? 'Dams enriched with scraped data' : 'No scraped data available' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/sync-weather', async (req, res) => {
  try {
    const warnings = await ingestWeatherWarnings();
    res.json({ success: true, data: warnings });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/cyclone-bulletins', async (req, res) => {
  try {
    const bulletins = await fetchCycloneBulletins();
    res.json({ success: true, data: bulletins });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/river-levels', async (req, res) => {
  try {
    const levels = await fetchRealRiverLevels();
    res.json({ success: true, data: levels });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/sync-ndma', async (req, res) => {
  try {
    const alerts = await ingestNDMAAlerts();
    res.json({ success: true, data: alerts });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/sync-hospitals', async (req, res) => {
  try {
    const hospitals = await enrichHospitals();
    res.json({ success: true, data: hospitals, message: hospitals ? 'Hospitals enriched' : 'No scraped data available' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/news', async (req, res) => {
  try {
    const news = await fetchDisasterNews();
    res.json({ success: true, data: news });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/blood-banks', async (req, res) => {
  try {
    const banks = await fetchBloodBanks();
    res.json({ success: true, data: banks });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
