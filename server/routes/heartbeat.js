const express = require('express');
const router = express.Router();
const {
  receiveHeartbeat,
  getControllerStatuses,
  simulateDisconnect,
  simulateReconnect,
} = require('../services/heartbeat');

router.post('/', (req, res) => {
  const { controllerId, timestamp } = req.body;
  if (!controllerId) {
    return res.status(400).json({ success: false, error: 'controllerId required' });
  }
  const ok = receiveHeartbeat(controllerId, timestamp);
  res.json({ success: ok, data: { received: true } });
});

router.get('/status', (req, res) => {
  const statuses = getControllerStatuses();
  res.json({ success: true, data: statuses });
});

router.post('/simulate-disconnect', (req, res) => {
  const { controllerId } = req.body;
  if (!controllerId) {
    return res.status(400).json({ success: false, error: 'controllerId required' });
  }
  simulateDisconnect(controllerId);
  res.json({ success: true, data: { message: `${controllerId} simulated as disconnected` } });
});

router.post('/simulate-reconnect', (req, res) => {
  const { controllerId } = req.body;
  if (!controllerId) {
    return res.status(400).json({ success: false, error: 'controllerId required' });
  }
  simulateReconnect(controllerId);
  res.json({ success: true, data: { message: `${controllerId} reconnected` } });
});

module.exports = router;
