const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const corsMiddleware = require('./middleware/cors');
const { fetchAndUpdateDams, startDamAutoRefresh } = require('./services/damFetcher');
const { runDisasterDetection, startAutoDetection } = require('./services/disasterDetector');
const { runDisasterPrediction, startAutoPrediction } = require('./services/disasterPredictor');
const heartbeatRoutes = require('./routes/heartbeat');
const { initHeartbeat } = require('./services/heartbeat');

const disasterRoutes = require('./routes/disasters');
const teamRoutes = require('./routes/teams');
const hospitalRoutes = require('./routes/hospitals');
const alertRoutes = require('./routes/alerts');
const sosRoutes = require('./routes/sosBeacons');
const damRoutes = require('./routes/dams');
const missionRoutes = require('./routes/missions');
const taskRoutes = require('./routes/tasks');
const predictionRoutes = require('./routes/predictions');
const scraperRoutes = require('./routes/scraper');
const riskScoreRoutes = require('./routes/riskScore');
const landReportRoutes = require('./routes/landReport');
const { runFullScrapeSync, isScraperAvailable, startAutoScraping } = require('./services/scraperBridge');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    methods: ['GET', 'POST'],
  },
});

app.set('io', io);

const PORT = process.env.PORT || 5000;

app.use(corsMiddleware);
app.use(express.json());

app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.path}`);
  next();
});

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'running',
      name: 'RESQAI Backend',
      version: '1.0.0',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    },
  });
});

app.use('/api/disasters', disasterRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/sos', sosRoutes);
app.use('/api/dams', damRoutes);
app.use('/api/missions', missionRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/predictions', predictionRoutes);
app.use('/api/scraper', scraperRoutes);
app.use('/api/risk-score', riskScoreRoutes);
app.use('/api/land-report', landReportRoutes);

app.post('/api/dams-refresh', async (req, res) => {
  try {
    const dams = await fetchAndUpdateDams();
    res.json({ success: true, data: dams, message: `${dams.length} dams refreshed with live weather data` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.use('/api/heartbeat', heartbeatRoutes);

app.post('/api/detect-threats', async (req, res) => {
  try {
    const result = await runDisasterDetection();
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.use((req, res) => {
  res.status(404).json({ success: false, error: `Route ${req.method} ${req.path} not found` });
});

app.use((err, req, res, next) => {
  console.error('[Server Error]', err.message);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

io.on('connection', (socket) => {
  console.log(`[Socket] Client connected: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`[Socket] Client disconnected: ${socket.id}`);
  });
});

server.listen(PORT, () => {
  console.log(`\n  RESQAI Backend Server`);
  console.log(`  ─────────────────────`);
  console.log(`  Status:  Running`);
  console.log(`  Port:    ${PORT}`);
  console.log(`  Realtime: Socket.IO enabled`);
  console.log(`  Health:  http://localhost:${PORT}/api/health`);
  console.log(`  API:     http://localhost:${PORT}/api/\n`);

  fetchAndUpdateDams().then(dams => {
    console.log(`  Dams:    ${dams.length} dams updated with live weather data`);
  }).catch(err => {
    console.log(`  Dams:    Using cached data (fetch failed: ${err.message})`);
  });
  startDamAutoRefresh(3600000);

  runDisasterDetection().then(result => {
    console.log(`  Threats: ${result.newDisasters} disasters, ${result.newAlerts} alerts detected\n`);
  }).catch(err => {
    console.log(`  Threats: Detection skipped (${err.message})\n`);
  });
  startAutoDetection(300000);

  runDisasterPrediction().then(result => {
    console.log(`  Predictions: ${result.totalPredictions} risk forecast(s) generated\n`);
  }).catch(err => {
    console.log(`  Predictions: Forecasting skipped (${err.message})\n`);
  });
  startAutoPrediction(600000);

  const MY_CONTROLLER_ID = process.env.CONTROLLER_ID || 'CTL-CHENNAI';
  const IS_DEMO = process.env.HEARTBEAT_MODE !== 'live';
  initHeartbeat(MY_CONTROLLER_ID, io, IS_DEMO);
  console.log(`  Heartbeat: ${MY_CONTROLLER_ID} (${IS_DEMO ? 'demo' : 'live'} mode)\n`);

  // Scrapling-powered real data enrichment
  setTimeout(async () => {
    const available = await isScraperAvailable();
    if (available) {
      console.log('  Scraper:   Python scraper service detected on port 5001');
      runFullScrapeSync().then(result => {
        console.log(`  Scraper:   ${result.sources} sources scraped in ${result.elapsed}`);
      }).catch(err => {
        console.log(`  Scraper:   Initial scrape failed (${err.message})`);
      });
      startAutoScraping(1800000); // every 30 minutes
    } else {
      console.log('  Scraper:   Python scraper not running (start with: cd server/scraper && python app.py)');
      startAutoScraping(1800000);
    }
  }, 5000);
});
