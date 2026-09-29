const express = require('express');
const router = express.Router();
const { readDB } = require('../db');
const { runDisasterPrediction } = require('../services/disasterPredictor');

// GET /api/predictions — return all current predictions
router.get('/', (req, res) => {
  try {
    const predictions = readDB('predictions.json');

    // Optional filters
    let filtered = predictions;

    if (req.query.type) {
      filtered = filtered.filter(p => p.type === req.query.type);
    }
    if (req.query.severity) {
      filtered = filtered.filter(p => p.severity === req.query.severity);
    }
    if (req.query.minProbability) {
      const min = parseInt(req.query.minProbability, 10);
      filtered = filtered.filter(p => p.probability >= min);
    }

    res.json({ success: true, data: filtered });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/predictions/summary — aggregated stats
router.get('/summary', (req, res) => {
  try {
    const predictions = readDB('predictions.json');

    const summary = {
      total: predictions.length,
      byType: {},
      bySeverity: {},
      highestRisk: predictions[0] || null,
      averageProbability: predictions.length
        ? Math.round(predictions.reduce((s, p) => s + p.probability, 0) / predictions.length)
        : 0,
      lastUpdated: predictions.length
        ? predictions[0].predictedAt
        : null,
    };

    for (const pred of predictions) {
      summary.byType[pred.type] = (summary.byType[pred.type] || 0) + 1;
      summary.bySeverity[pred.severity] = (summary.bySeverity[pred.severity] || 0) + 1;
    }

    res.json({ success: true, data: summary });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/predictions/refresh — trigger a new prediction cycle
router.post('/refresh', async (req, res) => {
  try {
    const result = await runDisasterPrediction();
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/predictions/:id — single prediction detail
router.get('/:id', (req, res) => {
  try {
    const predictions = readDB('predictions.json');
    const prediction = predictions.find(p => p.id === req.params.id);

    if (!prediction) {
      return res.status(404).json({ success: false, error: 'Prediction not found' });
    }

    res.json({ success: true, data: prediction });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
