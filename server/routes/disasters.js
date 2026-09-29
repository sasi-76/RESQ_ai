const express = require('express');
const router = express.Router();
const { readDB, writeDB } = require('../db');
const { simulateReconnect } = require('../services/heartbeat');

router.get('/', (req, res) => {
  const disasters = readDB('disasters.json');
  res.json({ success: true, data: disasters });
});

router.post('/', (req, res) => {
  const disasters = readDB('disasters.json');
  const newDisaster = {
    id: `DISASTER-${Date.now()}`,
    ...req.body,
    createdAt: new Date().toISOString(),
    status: req.body.status || 'active',
  };
  disasters.push(newDisaster);
  writeDB('disasters.json', disasters);
  req.app.get('io').emit('disaster:created', { data: newDisaster });
  res.status(201).json({ success: true, data: newDisaster });
});

router.put('/:id', (req, res) => {
  const disasters = readDB('disasters.json');
  const index = disasters.findIndex(d => String(d.id) === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Disaster not found' });
  }

  const oldDisaster = disasters[index];
  disasters[index] = { ...disasters[index], ...req.body, updatedAt: new Date().toISOString() };

  // Auto-reconnect controller if infrastructure failure is resolved
  if (oldDisaster.type === 'infrastructure_failure' &&
      oldDisaster.controllerDown &&
      (disasters[index].status === 'completed' || disasters[index].status === 'resolved')) {
    console.log(`[Disasters] Auto-reconnecting controller ${oldDisaster.controllerDown} after disaster resolved`);
    simulateReconnect(oldDisaster.controllerDown);
  }

  writeDB('disasters.json', disasters);
  req.app.get('io').emit('disaster:updated', { data: disasters[index] });
  res.json({ success: true, data: disasters[index] });
});

router.delete('/:id', (req, res) => {
  let disasters = readDB('disasters.json');
  const index = disasters.findIndex(d => String(d.id) === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Disaster not found' });
  }
  const removed = disasters.splice(index, 1)[0];

  // Auto-reconnect controller if infrastructure failure is removed
  if (removed.type === 'infrastructure_failure' && removed.controllerDown) {
    console.log(`[Disasters] Auto-reconnecting controller ${removed.controllerDown} after disaster removed`);
    simulateReconnect(removed.controllerDown);
  }

  writeDB('disasters.json', disasters);
  req.app.get('io').emit('disaster:removed', { id: req.params.id });
  res.json({ success: true, data: removed });
});

module.exports = router;
