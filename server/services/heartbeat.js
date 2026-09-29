const { readDB, writeDB } = require('../db');
const path = require('path');
const fs = require('fs');

const HEARTBEAT_INTERVAL = 60000;
const TIMEOUT_THRESHOLD = 300000;
const CHECK_INTERVAL = 30000;

function getControllers() {
  const configPath = path.join(__dirname, '..', 'config', 'controllers.json');
  return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
}

function saveControllers(controllers) {
  const configPath = path.join(__dirname, '..', 'config', 'controllers.json');
  fs.writeFileSync(configPath, JSON.stringify(controllers, null, 2), 'utf-8');
}

let myControllerId = null;
let demoMode = true;
let io = null;
let checkIntervalHandle = null;
let pingIntervalHandle = null;

const simulatedDisconnects = new Set();

function initHeartbeat(controllerId, socketIo, isDemoMode = true) {
  myControllerId = controllerId;
  io = socketIo;
  demoMode = isDemoMode;

  const controllers = getControllers();
  const self = controllers.find(c => c.id === controllerId);
  if (self) {
    self.status = 'online';
    self.lastSeen = new Date().toISOString();
    saveControllers(controllers);
  }

  console.log(`[Heartbeat] Initialized as ${controllerId} (${demoMode ? 'DEMO' : 'LIVE'} mode)`);

  if (demoMode) {
    const ctrls = getControllers();
    ctrls.forEach(c => {
      c.status = 'online';
      c.lastSeen = new Date().toISOString();
    });
    saveControllers(ctrls);

    checkIntervalHandle = setInterval(checkControllerHealth, CHECK_INTERVAL);
    console.log(`[Heartbeat] Demo mode: all 4 controllers simulated as online`);
    console.log(`[Heartbeat] Monitoring every ${CHECK_INTERVAL / 1000}s, timeout threshold: ${TIMEOUT_THRESHOLD / 1000}s`);
  } else {
    pingIntervalHandle = setInterval(sendHeartbeats, HEARTBEAT_INTERVAL);
    checkIntervalHandle = setInterval(checkControllerHealth, CHECK_INTERVAL);
    sendHeartbeats();
    console.log(`[Heartbeat] Live mode: pinging ${controllers.length - 1} other controllers every ${HEARTBEAT_INTERVAL / 1000}s`);
  }
}

async function sendHeartbeats() {
  const controllers = getControllers();
  const others = controllers.filter(c => c.id !== myControllerId);

  for (const controller of others) {
    try {
      const res = await fetch(`${controller.url}/api/heartbeat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          controllerId: myControllerId,
          region: controllers.find(c => c.id === myControllerId)?.region,
          timestamp: new Date().toISOString(),
          status: 'online',
        }),
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (err) {
      console.warn(`[Heartbeat] Failed to ping ${controller.id}: ${err.message}`);
    }
  }
}

function receiveHeartbeat(controllerId, timestamp) {
  const controllers = getControllers();
  const ctrl = controllers.find(c => c.id === controllerId);
  if (!ctrl) return false;

  const wasOffline = ctrl.status === 'unreachable';
  ctrl.lastSeen = timestamp || new Date().toISOString();
  ctrl.status = 'online';
  saveControllers(controllers);

  if (wasOffline) {
    console.log(`[Heartbeat] ✅ ${ctrl.region} Controller RECOVERED — back online`);

    const alerts = readDB('alerts.json');
    alerts.unshift({
      id: `alert-recovery-${Date.now()}`,
      type: 'system',
      priority: 'info',
      title: `${ctrl.region} Controller Back Online`,
      message: `The ${ctrl.region} regional controller has recovered and is now responding to heartbeat pings. Normal operations resumed.`,
      area: ctrl.region,
      source: 'heartbeat-recovery',
      createdAt: new Date().toISOString(),
      read: false,
    });
    writeDB('alerts.json', alerts);

    if (io) {
      io.emit('controller:recovered', { controllerId, region: ctrl.region, timestamp: new Date().toISOString() });
      io.emit('alert:created', { data: alerts[0] });
    }
  }

  return true;
}

function checkControllerHealth() {
  const controllers = getControllers();
  const now = Date.now();
  let changed = false;

  for (const ctrl of controllers) {
    if (ctrl.id === myControllerId && !demoMode) continue;

    if (demoMode && simulatedDisconnects.has(ctrl.id)) {
      const lastSeen = ctrl.lastSeen ? new Date(ctrl.lastSeen).getTime() : 0;
      const elapsed = now - lastSeen;

      if (elapsed >= TIMEOUT_THRESHOLD && ctrl.status !== 'unreachable') {
        markControllerDown(ctrl, controllers);
        changed = true;
      }
      continue;
    }

    if (demoMode && !simulatedDisconnects.has(ctrl.id)) {
      ctrl.lastSeen = new Date().toISOString();
      ctrl.status = 'online';
      changed = true;
      continue;
    }

    if (!ctrl.lastSeen) continue;
    const lastSeen = new Date(ctrl.lastSeen).getTime();
    const elapsed = now - lastSeen;

    if (elapsed >= TIMEOUT_THRESHOLD && ctrl.status !== 'unreachable') {
      markControllerDown(ctrl, controllers);
      changed = true;
    }
  }

  if (changed) saveControllers(controllers);
}

function markControllerDown(ctrl, controllers) {
  console.log(`[Heartbeat] 🚨 ${ctrl.region} Controller UNREACHABLE — no response for 5 minutes!`);
  ctrl.status = 'unreachable';

  const disasters = readDB('disasters.json');
  const newDisaster = {
    id: `heartbeat-${ctrl.id}-${Date.now()}`,
    type: 'infrastructure_failure',
    severity: 'critical',
    areaName: `${ctrl.region} Region`,
    description: `Regional controller (${ctrl.id}) has been unreachable for over 5 minutes. This may indicate severe infrastructure failure or disaster affecting the ${ctrl.region} region covering ${ctrl.district}.`,
    lat: ctrl.lat,
    lng: ctrl.lng,
    source: 'heartbeat-failover',
    trigger: `${ctrl.region} Controller unreachable for 5+ minutes — possible severe disaster in region`,
    riskPercent: 95,
    status: 'active',
    createdAt: new Date().toISOString(),
    autoDetected: true,
    controllerDown: ctrl.id,
  };
  disasters.push(newDisaster);
  writeDB('disasters.json', disasters);

  const alerts = readDB('alerts.json');
  const newAlert = {
    id: `alert-heartbeat-${Date.now()}`,
    type: 'infrastructure_failure',
    priority: 'critical',
    title: `CONTROLLER DOWN: ${ctrl.region} Region Unreachable`,
    message: `The ${ctrl.region} regional controller (covering ${ctrl.district}) has not responded for over 5 minutes. This may indicate a severe disaster has knocked out regional infrastructure. All neighboring controllers have been notified. Immediate investigation required.`,
    area: ctrl.region,
    source: 'heartbeat-failover',
    createdAt: new Date().toISOString(),
    read: false,
  };
  alerts.unshift(newAlert);
  writeDB('alerts.json', alerts);

  if (io) {
    io.emit('controller:down', {
      controllerId: ctrl.id,
      region: ctrl.region,
      district: ctrl.district,
      lat: ctrl.lat,
      lng: ctrl.lng,
      timestamp: new Date().toISOString(),
    });
    io.emit('disaster:created', { data: newDisaster });
    io.emit('alert:created', { data: newAlert });
  }

  const onlineControllers = controllers.filter(c => c.status === 'online' && c.id !== ctrl.id);
  console.log(`[Heartbeat] Notified ${onlineControllers.length} other controllers about ${ctrl.region} outage`);
}

function simulateDisconnect(controllerId) {
  simulatedDisconnects.add(controllerId);
  const controllers = getControllers();
  const ctrl = controllers.find(c => c.id === controllerId);
  if (ctrl) {
    ctrl.lastSeen = new Date(Date.now() - TIMEOUT_THRESHOLD - 1000).toISOString();
    saveControllers(controllers);
  }
  console.log(`[Heartbeat] DEMO: Simulating disconnect of ${controllerId}`);
  checkControllerHealth();
  return true;
}

function simulateReconnect(controllerId) {
  simulatedDisconnects.delete(controllerId);
  receiveHeartbeat(controllerId, new Date().toISOString());
  console.log(`[Heartbeat] DEMO: Simulating reconnect of ${controllerId}`);
  return true;
}

function getControllerStatuses() {
  const controllers = getControllers();
  const now = Date.now();
  return controllers.map(c => ({
    ...c,
    isSimulatedDisconnect: simulatedDisconnects.has(c.id),
    lastSeenAgo: c.lastSeen ? Math.round((now - new Date(c.lastSeen).getTime()) / 1000) : null,
  }));
}

function stopHeartbeat() {
  if (checkIntervalHandle) clearInterval(checkIntervalHandle);
  if (pingIntervalHandle) clearInterval(pingIntervalHandle);
}

module.exports = {
  initHeartbeat,
  receiveHeartbeat,
  getControllerStatuses,
  simulateDisconnect,
  simulateReconnect,
  stopHeartbeat,
};
