const express = require('express');
const router = express.Router();
const { readDB, writeDB } = require('../db');

router.get('/', (req, res) => {
  const hospitals = readDB('hospitals.json');
  res.json({ success: true, data: hospitals });
});

router.put('/:id', (req, res) => {
  const hospitals = readDB('hospitals.json');
  const index = hospitals.findIndex(h => h.id === Number(req.params.id));
  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Hospital not found' });
  }
  hospitals[index] = { ...hospitals[index], ...req.body };
  writeDB('hospitals.json', hospitals);
  res.json({ success: true, data: hospitals[index] });
});

router.post('/:id/dispatch-ambulance', (req, res) => {
  const hospitals = readDB('hospitals.json');
  const index = hospitals.findIndex(h => h.id === Number(req.params.id));
  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Hospital not found' });
  }
  if (hospitals[index].ambulances <= 0) {
    return res.status(400).json({ success: false, error: 'No ambulances available' });
  }
  hospitals[index].ambulances -= 1;
  writeDB('hospitals.json', hospitals);
  req.app.get('io').emit('hospital:ambulance_dispatched', { data: hospitals[index] });
  res.json({ success: true, data: hospitals[index] });
});

module.exports = router;
