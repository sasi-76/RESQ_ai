const express = require('express');
const router = express.Router();
const { readDB, writeDB } = require('../db');

router.get('/', (req, res) => {
  const teams = readDB('teams.json');
  res.json({ success: true, data: teams });
});

router.get('/:id', (req, res) => {
  const teams = readDB('teams.json');
  const team = teams.find(t => t.id === req.params.id);
  if (!team) {
    return res.status(404).json({ success: false, error: 'Team not found' });
  }
  res.json({ success: true, data: team });
});

router.post('/:id/deploy', (req, res) => {
  const teams = readDB('teams.json');
  const index = teams.findIndex(t => t.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Team not found' });
  }
  const { location, mission } = req.body;
  teams[index] = {
    ...teams[index],
    status: 'deployed',
    assignedArea: location,
    location: location,
    mission: mission || 'Emergency response',
    deployedAt: new Date().toISOString(),
  };
  writeDB('teams.json', teams);
  req.app.get('io').emit('team:deployed', { data: teams[index] });
  res.json({ success: true, data: teams[index] });
});

router.post('/:id/recall', (req, res) => {
  const teams = readDB('teams.json');
  const index = teams.findIndex(t => t.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Team not found' });
  }
  teams[index] = {
    ...teams[index],
    status: 'standby',
    assignedArea: null,
    location: null,
    mission: null,
    deployedAt: null,
  };
  writeDB('teams.json', teams);
  req.app.get('io').emit('team:recalled', { data: teams[index] });
  res.json({ success: true, data: teams[index] });
});

router.put('/:id', (req, res) => {
  const teams = readDB('teams.json');
  const index = teams.findIndex(t => t.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Team not found' });
  }
  teams[index] = { ...teams[index], ...req.body };
  writeDB('teams.json', teams);
  req.app.get('io').emit('team:updated', { data: teams[index] });
  res.json({ success: true, data: teams[index] });
});

module.exports = router;
