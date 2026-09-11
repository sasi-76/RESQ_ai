# RESQAI Project Overview

## 🎯 Project Summary

**RESQAI** (Emergency Response AI) is a comprehensive web-based Emergency Operations Center (EOC) dashboard that provides real-time monitoring, AI-powered risk analysis, and coordinated emergency response for multi-hazard scenarios including floods, cyclones, earthquakes, and volcanic eruptions.

---

## 📊 System Architecture

\`\`\`
┌──────────────────────────────────────────────────────────────────────┐
│                         RESQAI SYSTEM                                │
│  AI-Powered Multi-Hazard Monitoring & Emergency Response System      │
└──────────────────────────────────────────────────────────────────────┘
                                    │
                ┌───────────────────┼───────────────────┐
                │                   │                   │
        ┌───────▼───────┐   ┌──────▼──────┐   ┌───────▼────────┐
        │ Data Collection│   │ Processing  │   │   Controller   │
        │  & Monitoring  │   │ & AI Analysis│   │   Dashboard    │
        └───────┬───────┘   └──────┬──────┘   └───────┬────────┘
                │                   │                   │
    ┌───────────┼───────────┬───────┼───────┬───────────┼──────────┐
    │           │           │       │       │           │          │
┌───▼───┐  ┌───▼───┐  ┌────▼───┐ ┌▼──────┐┌▼─────┐ ┌──▼───┐ ┌───▼───┐
│ Flood │  │Cyclone│  │Earthquake││Volcanic││ DB & ││ Risk ││ Change│
│       │  │       │  │          ││Eruption││Storage││Assess││ Detect│
└───────┘  └───────┘  └──────────┘└────────┘└──────┘└──────┘└───────┘
                                                        │
                        ┌───────────────────────────────┼─────────────┐
                        │                               │             │
                   ┌────▼────┐                    ┌─────▼─────┐  ┌───▼────┐
                   │  Alert  │                    │ Hospitals │  │  ResQ  │
                   │  System │                    │ & Medical │  │  Teams │
                   └─────────┘                    └───────────┘  └────────┘
\`\`\`

---

## 🔄 Operational Workflow (Continuous Loop)

\`\`\`
┌─────────────────────────────────────────────────────────────────────┐
│                      CONTINUOUS MONITORING LOOP                      │
└─────────────────────────────────────────────────────────────────────┘

    1. MONITOR              →    Collect data from sensors & sources
              ↓
    2. DETECT CHANGE        →    AI identifies risk increases
              ↓
    3. ANALYSE              →    Calculate risk %, affected areas
              ↓
    4. ALERT                →    Notify controller & public
              ↓
    5. PRIORITIZE           →    Assign P1-P4 based on severity
              ↓
    6. DEPLOY               →    Send ResQ teams to field
              ↓
    7. RESCUE               →    Provide emergency assistance
              ↓
    8. UPDATE               →    Feed results back to system
              ↓
    (Loop back to MONITOR AGAIN)
\`\`\`

---

## 📱 Page Structure & Features

### 1️⃣ **Dashboard** (`/` or `/dashboard`)
**Purpose**: Main operations center for real-time monitoring

**Components**:
- **4 Stat Cards**: Active Hazards (4), Areas (6), Teams (3), Risk Level (76%)
- **Hazard Donut Chart**: Flood 76%, Cyclone 32%, Earthquake 18%, Volcanic 12%
- **Affected Areas Table**: 6 areas with risk % and priority (P1-P4)
- **Risk Trend Chart**: Time-series showing escalation from 35% → 76%
- **Live Sensor Data**: Rainfall, Water Level, Wind Speed, Seismic Activity
- **Recent Alerts**: Latest 3 alerts with type indicators

**Key Features**:
✅ Real-time data updates every 3 seconds
✅ Interactive charts (Recharts)
✅ Color-coded priority levels
✅ Threshold-based progress bars

---

### 2️⃣ **Alerts** (`/alerts`)
**Purpose**: Alert management and public/controller communication

**Components**:
- **Tab System**: Public Alerts vs Controller Alerts
- **Alert Cards**: 4 alerts (2 critical, 1 warning, 1 info)
  - Cuddalore flood risk: 58% → 76% (P1, Critical)
  - Dam overflow warning: 70% → 82% (P1, Critical)
  - Cyclone risk Chidambaram: 20% → 28% (P2, Warning)
  - Water level Kurinjipadi: 40% → 48% (P3, Info)
- **RESQAI Alert Panel**: Detailed view with precautions & contacts
- **Action Buttons**: Approve Alert, View Details

**Key Features**:
✅ Risk change visualization (previous → current with arrow)
✅ Recommended actions checklist
✅ Emergency contacts (112, 108, 1077)
✅ Approval workflow for controller

---

### 3️⃣ **Map View** (`/map`)
**Purpose**: Geographic area analysis and prioritization

**Components**:
- **SVG Heatmap**: 600x600 interactive visualization
  - 100 km radius circle from controller location
  - 6 monitored areas plotted with color-coded markers
  - Radial gradient heat zones based on risk %
  - Pulse animations for high-risk areas
- **Area Details Panel**: List view with risk bars
- **Legend**: P1 (red), P2 (orange), P3 (yellow), P4 (green)
- **Info Box**: Shows affected areas, % affected, damages, priority levels

**Key Features**:
✅ Custom SVG-based heatmap (no Leaflet dependency)
✅ Animated pulse rings on high-risk zones
✅ Population data for each area
✅ Primary hazard type display

**Areas Monitored**:
1. Cuddalore: 76% risk, P1, 173,676 population
2. Chidambaram: 58% risk, P2, 62,153 population
3. Kurinjipadi: 48% risk, P2, 34,890 population
4. Panruti: 42% risk, P3, 50,921 population
5. Kattumannarkoil: 35% risk, P3, 23,456 population
6. Virudhachalam: 28% risk, P4, 68,076 population

---

### 4️⃣ **Hospitals** (`/hospitals`)
**Purpose**: Medical support and bed availability tracking

**Components**:
- **4 Stats Cards**: Total Hospitals (5), Available Beds (362), Ambulances (27), Emergency Ready (5)
- **Hospital Data Table**: 5 hospitals with:
  - Cuddalore Govt. Hospital: 85/350 beds, 6 ambulances, 2.5 km
  - Chidambaram GH: 62/200 beds, 4 ambulances, 28 km
  - Panruti Hospital: 40/100 beds, 2 ambulances, 22 km
  - Virudhachalam GH: 55/150 beds, 3 ambulances, 45 km
  - RGGGH Chennai: 120/800 beds, 12 ambulances, 185 km
- **Controller Note**: Privacy notice for bed availability data

**Key Features**:
✅ Real-time bed occupancy tracking
✅ Color-coded indicators (green/yellow/red based on availability)
✅ Ambulance fleet visibility
✅ Distance from controller location
✅ Hospital type classification

---

### 5️⃣ **Teams** (`/teams`)
**Purpose**: ResQ team deployment and field coordination

**Components**:
- **4 Stats Cards**: Deployed (3), Standby (2), Personnel (51), Areas Covered (3)
- **5 Team Cards** (2-column grid):
  1. **RESQ-01 Alpha Response Unit**: 12 members, deployed to Cuddalore, Capt. Rajesh Kumar
     - Equipment: Rescue Boats, Medical Kit, Communication Gear
     - Vehicle: RESQ Vehicle + 2 Boats
  2. **RESQ-02 Bravo Medical Team**: 8 members, deployed to Chidambaram, Dr. Priya Sharma
     - Equipment: Ambulance, Medical Kit, Stretchers
     - Vehicle: 2 Ambulances
  3. **RESQ-03 Charlie Search Unit**: 10 members, deployed to Cuddalore, Lt. Arjun Mehta
     - Equipment: Search Dogs, Thermal Camera, Rescue Gear
     - Vehicle: RESQ Vehicle
  4. **RESQ-04 Delta Relief Squad**: 15 members, standby, Sgt. Deepa Nair
     - Equipment: Relief Supplies, Tents, Water Purifier
     - Vehicle: 3 Trucks
  5. **RESQ-05 Echo Aerial Unit**: 6 members, standby, Cpt. Vikram Singh
     - Equipment: Drones, Aerial Camera, Communication Relay
     - Vehicle: Drone Fleet
- **Deployment Workflow**: 3-step visualization (Authority → Team → Field)
- **Action Buttons**: Reassign, Recall

**Key Features**:
✅ Real-time deployment status with pulse indicators
✅ Equipment inventory tracking
✅ Team leader information
✅ Deployment timestamps
✅ Unassigned teams visible for quick allocation

---

### 6️⃣ **Recommendations** (`/recommendations`)
**Purpose**: Actionable measures and decision support for authorities

**Components**:
- **6 Action Items** with priority levels:
  1. Issue public warnings (templates) - IMMEDIATE - Pending
  2. Deploy RESQ teams (vehicles & equipment) - IMMEDIATE - In Progress
  3. Prepare hospitals (medical supplies) - HIGH - In Progress
  4. Open shelters (food & water) - HIGH - Pending
  5. Coordinate with local administration - HIGH - Pending
  6. Monitor and update every 30 minutes - ONGOING - Active
- **Interactive Checklist**: Click to mark as completed
- **Emergency Contacts Panel**: Quick-dial 112, 108, 1077
- **Progress Summary**: Completion tracking bars
- **Continuous Loop Visualization**: 8-step cyclical process diagram

**Key Features**:
✅ Priority badges (Immediate=red, High=orange, Ongoing=blue)
✅ Status tracking (Pending, In Progress, Completed, Active)
✅ Expandable detail sections
✅ Visual workflow diagram

---

## 🎨 Design System

### Color Palette
\`\`\`css
/* Priority Levels */
P1 / Critical:  #ef4444 (red-500)
P2 / Warning:   #f97316 (orange-500)
P3 / Medium:    #eab308 (yellow-500)
P4 / Low:       #22c55e (green-500)

/* UI Colors */
Background:     #0f172a (slate-950)
Cards:          rgba(30, 41, 59, 0.6) with backdrop-blur
Text Primary:   #e2e8f0 (slate-200)
Text Secondary: #94a3b8 (slate-400)
Borders:        #334155 (slate-700)

/* Accent Colors */
Blue:           #3b82f6 (Flood)
Purple:         #8b5cf6 (Cyclone)
Orange:         #f59e0b (Earthquake)
Red:            #ef4444 (Volcanic)
\`\`\`

### Typography
- **Font**: Inter (Google Fonts)
- **Headers**: Bold, uppercase tracking, slate-300
- **Body**: Regular, slate-200
- **Small Text**: 11-12px, slate-400
- **Mono**: For timestamps and sensor values

### Components
- **Glass Cards**: `glass-card` class with backdrop-blur and translucent bg
- **Stat Cards**: Icon + value + label with gradient backgrounds
- **Progress Bars**: Color-coded based on risk/occupancy thresholds
- **Badges**: Rounded-full with priority color backgrounds (20% opacity)
- **Buttons**: Blue-600 primary, Red-500 danger, outlined for secondary actions

---

## 🔧 Technical Details

### Stack
- **React 18.3.1**: Functional components with Hooks
- **Vite 5.4.2**: Lightning-fast build tool
- **Tailwind CSS 3.4.10**: Utility-first styling
- **React Router DOM 6.26.0**: Client-side routing
- **Recharts 2.12.7**: Chart library
- **Lucide React 0.441.0**: Icon library (600+ icons)

### Key Files
\`\`\`
src/
├── main.jsx                  # React app entry point
├── App.jsx                   # Router configuration with 6 routes
├── index.css                 # Tailwind directives + custom animations
├── components/
│   └── Layout/Layout.jsx     # Sidebar (72px) + Header + Main content area
├── data/
│   └── mockData.js           # All mock data (areas, hospitals, teams, alerts)
└── pages/
    ├── Dashboard.jsx         # 340 lines - Main EOC dashboard
    ├── Alerts.jsx            # 180 lines - Alert management
    ├── MapView.jsx           # 220 lines - SVG heatmap
    ├── Hospitals.jsx         # 150 lines - Medical support
    ├── Teams.jsx             # 200 lines - Team deployment
    └── Recommendations.jsx   # 190 lines - Action checklist
\`\`\`

### Animations
- **Pulse**: Used for live indicators and high-risk areas
- **Slide-up**: Page transitions and expanding details
- **Fade-in**: Initial page load
- **Blink**: Critical alert icons
- **Ping**: Real-time status dots

### Performance
- **Code splitting**: React.lazy (if needed for larger deployments)
- **Memoization**: Sensor updates use shallow comparison
- **Interval management**: Cleanup on component unmount
- **Optimized charts**: Recharts with ResponsiveContainer

---

## 🚀 Deployment Checklist

### Development
- [x] Install dependencies: `npm install`
- [x] Start dev server: `npm run dev`
- [x] Access at: `http://localhost:3000`

### Production
- [ ] Build: `npm run build` (outputs to `dist/`)
- [ ] Preview: `npm run preview`
- [ ] Deploy `dist/` folder to hosting (Vercel, Netlify, AWS S3+CloudFront)

### Environment Variables (for production)
\`\`\`env
VITE_API_URL=https://api.resqai.gov.in
VITE_WEBSOCKET_URL=wss://ws.resqai.gov.in
VITE_MAP_API_KEY=your_map_provider_key
\`\`\`

---

## 📚 Data Sources (Production Integration)

### Current (Mock Data)
- Hardcoded in `src/data/mockData.js`
- Simulated real-time updates every 3 seconds

### Future (Real Data)
1. **Meteorological API**: India Meteorological Department (IMD)
2. **Seismological API**: National Center for Seismology (NCS)
3. **Satellite Data**: ISRO/INSAT imagery
4. **River Gauges**: Central Water Commission (CWC)
5. **Hospital Database**: State Health Department API
6. **Team Management**: Custom backend with WebSocket

---

## 🧪 Testing Scenarios

### User Workflows
1. **Controller logs in** → Dashboard shows real-time data
2. **Risk increases** → Alert auto-generated → Controller approves → Public notified
3. **Team deployed** → Status changes to "Deployed" → Timestamp recorded
4. **Hospital capacity checked** → Bed availability visible only to controller
5. **Recommendations reviewed** → Actions checked off → Progress updated

### Edge Cases
- No data from sensors (show "No Data" state)
- All teams deployed (disable "Deploy" button)
- Hospital at 100% capacity (show red indicator)
- Multiple P1 alerts (sort by timestamp)

---

## 📊 Metrics & KPIs

### System Performance
- Response time: < 2s for all page loads
- Data refresh rate: 3 seconds for sensors
- Alert latency: < 5s from detection to notification

### Operational Metrics
- Areas monitored: 6 (within 100 km)
- Hospitals tracked: 5 (total 1,600 beds)
- ResQ teams: 5 (51 personnel)
- Hazard types: 4 (Flood, Cyclone, Earthquake, Volcanic)

---

## 🎓 User Roles & Permissions

| Feature | Public | Controller | Admin |
|---------|--------|-----------|-------|
| View Dashboard | ✅ (limited) | ✅ Full | ✅ Full |
| See Hospital Beds | ❌ | ✅ | ✅ |
| Approve Alerts | ❌ | ✅ | ✅ |
| Deploy Teams | ❌ | ✅ | ✅ |
| View Sensor Data | ✅ (aggregated) | ✅ (raw) | ✅ (raw) |
| Access Recommendations | ❌ | ✅ | ✅ |

---

## 🆘 Emergency Protocols

### Alert Priority Levels
- **P1 (Critical)**: Immediate action required, life-threatening
- **P2 (High)**: Action needed within 1 hour
- **P3 (Medium)**: Monitor closely, prepare response
- **P4 (Low)**: Standard monitoring, no immediate action

### Response Times
- P1: 0-15 minutes (teams deployed immediately)
- P2: 15-60 minutes
- P3: 1-4 hours
- P4: 4-24 hours

### Communication Channels
1. **Public Alerts**: SMS, TV, Radio, Mobile App
2. **Controller Alerts**: Dashboard notifications, Email
3. **Team Communication**: Dedicated radio, Satellite phone
4. **Authorities**: Direct phone, Secure messaging

---

**Project Status**: ✅ **COMPLETE & OPERATIONAL**

The RESQAI system is fully functional with all 6 pages, real-time data simulation, interactive features, and professional emergency operations center design. Ready for integration with live data sources.
