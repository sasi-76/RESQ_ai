const express = require('express');
const router = express.Router();
const { readDB, writeDB } = require('../db');

router.get('/', (req, res) => {
  const missions = readDB('missions.json');
  res.json({ success: true, data: missions });
});

router.post('/', (req, res) => {
  const missions = readDB('missions.json');
  const newMission = {
    id: `MISSION-${Date.now()}`,
    ...req.body,
    completedAt: new Date().toISOString(),
  };
  missions.push(newMission);
  writeDB('missions.json', missions);
  res.status(201).json({ success: true, data: newMission });
});

module.exports = router;
