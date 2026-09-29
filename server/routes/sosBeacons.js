const express = require('express');
const router = express.Router();
const { readDB, writeDB } = require('../db');

router.get('/', (req, res) => {
  const beacons = readDB('sosBeacons.json');
  res.json({ success: true, data: beacons });
});

router.post('/', (req, res) => {
  const beacons = readDB('sosBeacons.json');
  const newSOS = {
    id: `SOS-${Date.now()}`,
    ...req.body,
    status: 'pending',
    assignedTeam: null,
    createdAt: new Date().toISOString(),
    resolvedAt: null,
  };
  beacons.push(newSOS);
  writeDB('sosBeacons.json', beacons);
  req.app.get('io').emit('sos:created', { data: newSOS });
  res.status(201).json({ success: true, data: newSOS });
});

router.put('/:id/assign', (req, res) => {
  const beacons = readDB('sosBeacons.json');
  const index = beacons.findIndex(b => String(b.id) === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, error: 'SOS beacon not found' });
  }
  const { teamId } = req.body;
  beacons[index] = {
    ...beacons[index],
    status: 'assigned',
    assignedTeam: teamId,
    assignedAt: new Date().toISOString(),
  };
  writeDB('sosBeacons.json', beacons);
  req.app.get('io').emit('sos:assigned', { data: beacons[index] });
  res.json({ success: true, data: beacons[index] });
});

router.put('/:id/resolve', (req, res) => {
  const beacons = readDB('sosBeacons.json');
  const index = beacons.findIndex(b => String(b.id) === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, error: 'SOS beacon not found' });
  }
  beacons[index] = {
    ...beacons[index],
    status: 'resolved',
    resolvedAt: new Date().toISOString(),
  };
  writeDB('sosBeacons.json', beacons);
  req.app.get('io').emit('sos:resolved', { data: beacons[index] });
  res.json({ success: true, data: beacons[index] });
});

module.exports = router;
