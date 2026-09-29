# RESQAI - AI-Powered Disaster Management & Emergency Response System

RESQAI is a real-time Emergency Operations Center (EOC) dashboard built for Tamil Nadu disaster management. It provides multi-hazard monitoring, AI-powered risk analysis, live dam water-level tracking, rescue team coordination, automated disaster detection, and multi-channel emergency alerts — all powered by AI and real-time data.

## Tech Stack

### Frontend
- **React 18** + **Vite 5** — Component-based SPA with fast HMR
- **Tailwind CSS 3** — Utility-first styling
- **Leaflet** + **React Leaflet** — Interactive maps, heatmaps, GPS tracking
- **Recharts** — Pie charts, area charts, trend analytics
- **React Router v6** — Client-side routing
- **Socket.IO Client** — Real-time WebSocket updates across all connected dashboards
- **Web Speech API** — Voice commands for the AI Copilot (browser-native, zero cost)
- **Lucide React** — Icon library

### Backend
- **Node.js** + **Express** — REST API server on port 5000
- **JSON File Database** — Lightweight file-based persistence (read/write via `fs`)
- **Socket.IO** — WebSocket server for real-time event broadcasting
- **CORS** — Configured for Vite dev server

### AI / LLM
- **Groq LPU** — Qwen 27B (fast), GPT-OSS 20B/120B (reasoning)
- **Google Gemini** — 2.5 Flash (fast/vision), 2.5 Pro (quality/reasoning)
- **LLaMA 3.2 90B Vision** — Image-based disaster analysis

### External APIs
- **Open-Meteo** — Real-time weather & atmospheric data (used for dam catchment rainfall)
- **OpenWeather** — City-level weather for 8 TN cities
- **USGS FDSNWS** — Live earthquake event feeds
- **Nominatim / OSM** — Geocoding & reverse geocoding
- **ntfy.sh** — Push notifications (zero account setup)
- **WhatsApp wa.me** — Alert broadcasting via deep links

### Deployment
- **Netlify** — Static frontend hosting
- **Vite Build** — Production build pipeline

## Features

### Core EOC Dashboard
- **Live Statistics** — Real-time hazard risk overview, sensor gauges (rainfall, water level, wind speed, seismic), alert ticker, trend analytics, and resource tracker
- **Interactive Map** — Leaflet-powered heatmap with priority-based risk zones (P1-P4), team positions, SOS beacons, hospital locations, district overlays, and live GPS tracking
- **Hospitals** — Bed availability tracker, ambulance dispatch with GPS distance calculation, emergency-ready facility status
- **ResQ Teams** — 5 specialized response units (Alpha-Echo) with equipment inventory, deploy/recall/reassign workflow, and GPS-based auto-dispatch
- **Alerts & Notifications** — Priority-based alerts (Critical/Warning/Info), commander and citizen notification channels via ntfy.sh push and WhatsApp
- **SOS Beacons** — Citizens trigger SOS with GPS coordinates; system auto-assigns nearest rescue team
- **Incident Reports** — Field reporting and mission status tracking
- **Field Tasks** — AI-generated task assignment and management

### Live Dam Monitoring (Real-Time Weather-Driven)
- **13 dams monitored** including cross-state Kaveri basin dams in Karnataka (KRS, Kabini, Hemavathy)
- **Live weather data** fetched from Open-Meteo API for each dam's GPS coordinates every hour
- **Dynamic inflow calculation** based on real catchment rainfall (last 6 hours) × catchment area multiplier
- **Dynamic outflow adjustment** — emergency release when fill > 90%, conservation when fill < 30%
- **Water level & storage** recalculated from net flow each refresh cycle
- **Weather badges** on each dam card — temperature, rainfall, 6h catchment rainfall, wind speed
- **Live Refresh button** to force immediate weather fetch from the frontend
- Falls back to cached data if APIs are unavailable

### AI Copilot (ResQ Copilot)
- **Multi-LLM powered** — Groq (GPT-OSS 120B reasoning) + Google Gemini with fallback chain
- **Intent detection** — Understands natural language commands: deploy team, recall unit, resolve SOS, dispatch ambulance, clear disaster, generate report
- **Action execution** — Directly modifies system state (deploys teams, resolves SOS beacons, creates alerts)
- **WhatsApp integration** — Sends deploy/recall orders to team leaders via wa.me deep links
- **Voice commands** — Speak into the mic button, speech is transcribed and auto-sent to the AI (Web Speech API, `en-IN` locale)
- **Chain-of-thought reasoning** — Strips `<think>` blocks from reasoning models for clean responses

### Automated Disaster Detection
- **Runs every 5 minutes** on the backend — zero human intervention
- **Dam overflow detection** — fill > 80% → WARNING, fill > 90% → CRITICAL flood alert
- **Rapid fill detection** — inflow > 2× outflow → WARNING
- **Rainfall-based flooding** — catchment rainfall > 50mm/6h → WARNING, > 100mm → CRITICAL
- **Cyclone detection** — wind speed > 60 km/h → WARNING, > 90 km/h → CRITICAL
- **Earthquake monitoring** — Fetches live USGS data; mag > 4.0 near TN → WARNING, > 5.5 → CRITICAL
- **Deduplication** — Won't create duplicate alerts within a 6-hour window
- **Auto-creates** disaster records + alert records in the JSON database
- Manual trigger: `POST /api/detect-threats`

### Real-Time Updates (Socket.IO)
- **WebSocket connection** between backend and all frontend clients
- **12 event types** broadcast on data changes:
  - `disaster:created/updated/removed`
  - `team:deployed/recalled/updated`
  - `alert:created/dismissed`
  - `sos:created/assigned/resolved`
  - `hospital:ambulance_dispatched`
  - `dam:updated`
  - `controller:down/recovered`
- **Multi-operator sync** — Create a disaster on one screen, all connected dashboards update instantly
- Frontend auto-connects on app load via `AppContext`

### Controller Heartbeat Failover
- **4 regional controllers** — Chennai, Madurai, Coimbatore, Salem
- Each covers multiple districts with GPS coordinates
- **Heartbeat ping** every 60 seconds between controllers
- **5-minute timeout** — if a controller stops responding, it's marked as `UNREACHABLE`
- **Auto-alert creation** — Critical disaster alert: "Controller DOWN — possible severe disaster in region"
- **Socket.IO broadcast** notifies all connected dashboards immediately
- **Recovery detection** — When controller comes back, info alert created: "Controller back online"
- **Two modes:**
  - **Demo mode** (default) — Single server simulates all 4 controllers. Dashboard widget has "Simulate Down" / "Reconnect" buttons for live demo
  - **Live mode** — Set `HEARTBEAT_MODE=live` env var for actual HTTP pings between servers on ports 5000-5003
- **Dashboard widget** — `ControllerStatus` component shows all 4 controllers with green/red status indicators

## Project Structure

```
cit/
  server/                              # Node.js Backend
    server.js                          # Express + Socket.IO server (port 5000)
    package.json                       # Backend dependencies
    middleware/
      cors.js                          # CORS configuration
    config/
      controllers.json                 # Regional controller registry (4 controllers)
    db/                                # JSON File Database
      index.js                         # readDB() / writeDB() helpers
      disasters.json                   # Active disasters (auto-detected + manual)
      teams.json                       # 5 ResQ teams (seeded)
      hospitals.json                   # 5 hospitals (seeded)
      dams.json                        # 13 dams (live weather-updated)
      alerts.json                      # Alert records
      sosBeacons.json                  # SOS beacon records
      missions.json                    # Completed missions
      tasks.json                       # Field tasks
    routes/                            # REST API Routes
      disasters.js                     # CRUD + Socket.IO emit
      teams.js                         # GET, deploy, recall + Socket.IO emit
      hospitals.js                     # GET, update, dispatch + Socket.IO emit
      alerts.js                        # GET (filter), POST, DELETE + Socket.IO emit
      sosBeacons.js                    # GET, POST, assign, resolve + Socket.IO emit
      dams.js                          # GET all, GET one, update + Socket.IO emit
      missions.js                      # GET, POST
      tasks.js                         # CRUD
      heartbeat.js                     # Receive ping, status, simulate disconnect/reconnect
    services/                          # Backend Services
      damFetcher.js                    # Live dam data — fetches Open-Meteo weather, calculates inflow/outflow/levels
      disasterDetector.js              # Auto disaster detection — dam overflow, rainfall, earthquake, cyclone
      heartbeat.js                     # Controller heartbeat failover — ping, monitor, timeout, alert
  src/                                 # React Frontend
    App.jsx                            # Root component with routing
    main.jsx                           # Entry point
    pages/
      Dashboard.jsx                    # Main EOC dashboard + ControllerStatus widget
      Dams.jsx                         # Dam monitoring (fetches from backend API + live refresh)
      Alerts.jsx                       # Alert management
      MapView.jsx                      # Interactive map
      Hospitals.jsx                    # Hospital & medical tracking
      Teams.jsx                        # ResQ team deployment
      FieldTasks.jsx                   # Field task management
      IncidentReports.jsx              # Field incident reports
      AdminDashboard.jsx               # Admin panel
      DemoControls.jsx                 # Demo simulation controls
    components/
      Layout/                          # App layout & navigation
      AICopilot/
        ResQCopilot.jsx                # AI chatbot + voice commands (Web Speech API)
      ControllerStatus.jsx             # Regional controller network widget (heartbeat status)
      LiveDataDashboard.jsx            # Real-time data widgets
      ResourceTracker.jsx              # Resource management
      CriticalDisasterAlert.jsx        # Full-screen critical alert
      Notifications.jsx                # Notification system
    services/
      api.js                           # Backend API client (26 functions)
      socket.js                        # Socket.IO client (connect, disconnect, event listeners)
      weatherService.js                # Open-Meteo weather integration
      liveDataService.js               # Real-time data feeds
      llmIntegration.js                # Groq & Gemini AI integration
      locationService.js               # Geolocation & risk analysis
      notificationService.js           # ntfy.sh push notifications
      whatsappService.js               # WhatsApp alert broadcasting
      dataIntegration.js               # Data aggregation
    data/
      damData.js                       # TN dam telemetry (13 reservoirs — frontend fallback)
      mockData.js                      # Seeded data & constants
    context/
      AppContext.jsx                    # Global state + Socket.IO real-time listeners
```

## Setup

### Prerequisites
- Node.js 18+
- npm

### Installation

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```
VITE_GROQ_API_KEY=your_groq_key
VITE_GEMINI_API_KEY=your_gemini_key
VITE_OPENWEATHER_API_KEY=your_openweather_key
```

### Running the App

```bash
# Terminal 1 — Start backend (port 5000)
cd server
npm start

# Terminal 2 — Start frontend (port 5173)
npm run dev
```

The app runs at `http://localhost:5173` with the API at `http://localhost:5000/api`.

### Running in Live Heartbeat Mode (multi-server)

```bash
# Terminal 1 — Chennai controller
CONTROLLER_ID=CTL-CHENNAI HEARTBEAT_MODE=live PORT=5000 node server.js

# Terminal 2 — Madurai controller
CONTROLLER_ID=CTL-MADURAI HEARTBEAT_MODE=live PORT=5001 node server.js

# Terminal 3 — Coimbatore controller
CONTROLLER_ID=CTL-COIMBATORE HEARTBEAT_MODE=live PORT=5002 node server.js

# Terminal 4 — Salem controller
CONTROLLER_ID=CTL-SALEM HEARTBEAT_MODE=live PORT=5003 node server.js
```

## API Endpoints

### Core Resources

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Server health check |
| GET | `/api/disasters` | List all disasters |
| POST | `/api/disasters` | Create a disaster |
| PUT | `/api/disasters/:id` | Update a disaster |
| DELETE | `/api/disasters/:id` | Remove a disaster |
| GET | `/api/teams` | List all teams |
| GET | `/api/teams/:id` | Get one team |
| POST | `/api/teams/:id/deploy` | Deploy a team |
| POST | `/api/teams/:id/recall` | Recall a team |
| PUT | `/api/teams/:id` | Update team fields |
| GET | `/api/hospitals` | List all hospitals |
| PUT | `/api/hospitals/:id` | Update hospital |
| POST | `/api/hospitals/:id/dispatch-ambulance` | Dispatch ambulance |
| GET | `/api/alerts` | List alerts (`?priority=` filter) |
| POST | `/api/alerts` | Create an alert |
| DELETE | `/api/alerts/:id` | Dismiss an alert |
| GET | `/api/sos` | List SOS beacons |
| POST | `/api/sos` | Create SOS beacon |
| PUT | `/api/sos/:id/assign` | Assign team to SOS |
| PUT | `/api/sos/:id/resolve` | Resolve SOS |
| GET | `/api/dams` | List all dams (with live weather data) |
| GET | `/api/dams/:id` | Get one dam |
| PUT | `/api/dams/:id` | Update dam data |
| GET | `/api/missions` | List completed missions |
| POST | `/api/missions` | Add a mission |
| GET | `/api/tasks` | List field tasks |
| POST | `/api/tasks` | Create a task |
| PUT | `/api/tasks/:id` | Update a task |
| DELETE | `/api/tasks/:id` | Delete a task |

### Automated Services

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/dams-refresh` | Force live weather fetch for all 13 dams |
| POST | `/api/detect-threats` | Force disaster detection cycle |
| POST | `/api/heartbeat` | Receive heartbeat ping from another controller |
| GET | `/api/heartbeat/status` | Get all controller statuses |
| POST | `/api/heartbeat/simulate-disconnect` | Demo: simulate controller going offline |
| POST | `/api/heartbeat/simulate-reconnect` | Demo: simulate controller recovery |

### Socket.IO Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `disaster:created` | Server → Client | New disaster detected or created |
| `disaster:updated` | Server → Client | Disaster status changed |
| `disaster:removed` | Server → Client | Disaster resolved/deleted |
| `team:deployed` | Server → Client | Team deployed to location |
| `team:recalled` | Server → Client | Team recalled to base |
| `team:updated` | Server → Client | Team data updated |
| `alert:created` | Server → Client | New alert (manual or auto-detected) |
| `alert:dismissed` | Server → Client | Alert dismissed |
| `sos:created` | Server → Client | New SOS beacon |
| `sos:assigned` | Server → Client | Team assigned to SOS |
| `sos:resolved` | Server → Client | SOS resolved |
| `hospital:ambulance_dispatched` | Server → Client | Ambulance dispatched |
| `controller:down` | Server → Client | Regional controller unreachable |
| `controller:recovered` | Server → Client | Regional controller back online |

## Automated Backend Services

| Service | File | Interval | What it does |
|---------|------|----------|-------------|
| **Dam Fetcher** | `services/damFetcher.js` | Every 1 hour | Fetches Open-Meteo weather for 13 dam coordinates, calculates dynamic inflow/outflow/levels |
| **Disaster Detector** | `services/disasterDetector.js` | Every 5 min | Monitors dam fill%, rainfall, wind speed, USGS earthquakes — auto-creates alerts |
| **Heartbeat Monitor** | `services/heartbeat.js` | Every 30 sec check | Monitors controller heartbeats, 5-min timeout triggers critical alert |

## Build & Deploy

```bash
npm run build
```

The `dist/` folder is ready for deployment to Netlify, Vercel, or any static host. The backend can be deployed to any Node.js hosting (Railway, Render, AWS EC2, etc.).

## What's Dynamic vs Static

### Dynamic (Live API Data)
- Dam water levels, inflow, outflow (recalculated from Open-Meteo rainfall every hour)
- Weather data for all dam coordinates (Open-Meteo API)
- Earthquake events (USGS FDSNWS API)
- Location weather on search (Open-Meteo API)
- City-level weather (OpenWeather API)
- Geocoding (Nominatim/OSM)
- User GPS location (Browser Geolocation API)
- AI responses (Groq + Gemini APIs)
- Disaster detection alerts (auto-generated from live data thresholds)
- Controller heartbeat status (real-time monitoring)

### Static (Seeded Data)
- 28 hospitals (name, GPS, phone, ambulance count)
- 5 ResQ teams (leaders, equipment, radio frequencies)
- 20 monitored area zones (GPS, population, evacuation routes)
- 35 TN sector registry entries (hazard types, zone codes)
- Emergency contacts, precautions, hazard type definitions

## License

MIT
