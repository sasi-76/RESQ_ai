const express = require('express');
const router = express.Router();
const { readDB, writeDB } = require('../db');

router.get('/', (req, res) => {
  let alerts = readDB('alerts.json');
  const { priority } = req.query;
  if (priority) {
    alerts = alerts.filter(a => a.priority === priority);
  }
  res.json({ success: true, data: alerts });
});

router.post('/', (req, res) => {
  const alerts = readDB('alerts.json');
  const newAlert = {
    id: `ALERT-${Date.now()}`,
    ...req.body,
    timestamp: new Date().toISOString(),
  };
  alerts.push(newAlert);
  writeDB('alerts.json', alerts);
  req.app.get('io').emit('alert:created', { data: newAlert });
  res.status(201).json({ success: true, data: newAlert });
});

router.delete('/:id', (req, res) => {
  let alerts = readDB('alerts.json');
  const index = alerts.findIndex(a => String(a.id) === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Alert not found' });
  }
  const removed = alerts.splice(index, 1)[0];
  writeDB('alerts.json', alerts);
  req.app.get('io').emit('alert:dismissed', { id: req.params.id });
  res.json({ success: true, data: removed });
});

module.exports = router;
