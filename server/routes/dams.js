const express = require('express');
const router = express.Router();
const { readDB, writeDB } = require('../db');

router.get('/', (req, res) => {
  const dams = readDB('dams.json');
  res.json({ success: true, data: dams });
});

router.get('/:id', (req, res) => {
  const dams = readDB('dams.json');
  const dam = dams.find(d => d.id === req.params.id);
  if (!dam) {
    return res.status(404).json({ success: false, error: 'Dam not found' });
  }
  res.json({ success: true, data: dam });
});

router.put('/:id', (req, res) => {
  const dams = readDB('dams.json');
  const index = dams.findIndex(d => d.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Dam not found' });
  }
  dams[index] = { ...dams[index], ...req.body, lastUpdated: new Date().toISOString() };
  writeDB('dams.json', dams);
  req.app.get('io').emit('dam:updated', { data: dams[index] });
  res.json({ success: true, data: dams[index] });
});

module.exports = router;
