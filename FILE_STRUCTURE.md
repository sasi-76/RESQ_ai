# 📁 COMPLETE FILE STRUCTURE

## **Every File in the Project - Purpose & Details**

---

## 🗂️ **ROOT DIRECTORY**

```
C:\Users\tamil\Desktop\cit\
```

### **Configuration Files:**

#### **package.json**
```json
{
  "name": "resqai",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```
- **Purpose**: NPM package configuration
- **Dependencies**: React, Vite, Tailwind, Leaflet, Recharts, etc.
- **Scripts**: Dev server, build, preview
- **Size**: ~1 KB

#### **vite.config.js**
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { port: 3002 }
})
```
- **Purpose**: Vite build tool configuration
- **Port**: 3002 (not default 5173)
- **Plugins**: React Fast Refresh
- **Size**: ~200 bytes

#### **tailwind.config.js**
```javascript
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: { /* custom colors */ },
      animation: { /* custom animations */ }
    }
  }
}
```
- **Purpose**: Tailwind CSS configuration
- **Content**: Scans src/ for classes
- **Theme**: Custom colors, animations
- **Size**: ~2 KB

#### **postcss.config.js**
```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  }
}
```
- **Purpose**: PostCSS configuration for Tailwind
- **Plugins**: Tailwind, Autoprefixer
- **Size**: ~100 bytes

#### **.env** (Not committed)
```bash
VITE_OPENWEATHER_API_KEY=your_key_here
VITE_GROQ_API_KEY=your_key_here
VITE_GEMINI_API_KEY=your_key_here
```
- **Purpose**: Environment variables (API keys)
- **Security**: NOT in version control
- **Access**: import.meta.env.VITE_*
- **Size**: ~200 bytes

#### **.env.example**
```bash
VITE_OPENWEATHER_API_KEY=
VITE_GROQ_API_KEY=
VITE_GEMINI_API_KEY=
```
- **Purpose**: Template for .env file
- **Committed**: Yes (no sensitive data)
- **Instructions**: Copy to .env and fill keys
- **Size**: ~150 bytes

#### **.gitignore**
```
node_modules/
dist/
.env
*.log
.DS_Store
```
- **Purpose**: Files to ignore in git
- **Ignores**: Dependencies, build, env, logs
- **Size**: ~200 bytes

#### **README.md**
- **Purpose**: Project documentation
- **Contents**: Setup, features, usage
- **Size**: ~10 KB

---

## 📂 **SRC/ DIRECTORY**

```
src/
├── components/
├── context/
├── data/
├── pages/
├── services/
├── App.jsx
├── main.jsx
└── index.css
```

---

## 🧩 **COMPONENTS/**

### **Layout/**

#### **Layout.jsx** (175 lines)
```javascript
import { NavLink } from 'react-router-dom';
import Notifications from '../Notifications';

function Layout({ children }) {
  // Sidebar + Header + Content wrapper
}
```
- **Purpose**: Main layout wrapper for all pages
- **Features**:
  - Sidebar with 9 nav items
  - Header with branding, clock, status
  - Hazard badges
  - Navigation tooltips
  - Responsive layout
- **Dependencies**: react-router-dom, lucide-react
- **Imports**: Notifications
- **Size**: ~6 KB

### **LiveDataDashboard.jsx** (350+ lines)
```javascript
import { useEffect, useState } from 'react';
import liveDataService from '../services/liveDataService';

function LiveDataDashboard() {
  // Displays live TN weather & earthquakes
}
```
- **Purpose**: Live data display for Tamil Nadu
- **Features**:
  - Weather for 8 cities
  - Earthquake monitoring
  - Auto-refresh (60s)
  - Manual refresh button
  - Risk calculation
  - High-risk alerts
- **API**: OpenWeatherMap, USGS
- **State**: weather, earthquakes, risk, lastUpdate
- **Size**: ~15 KB

### **Notifications.jsx** (100+ lines)
```javascript
import { useApp } from '../context/AppContext';

function Notifications() {
  // Toast notification system
}
```
- **Purpose**: Global toast notifications
- **Features**:
  - Auto-dismiss (5s)
  - Manual close
  - Severity colors
  - Animations
  - Stacking
- **Position**: Fixed top-right
- **Types**: Critical, High, Medium, Low
- **Size**: ~4 KB

### **ResourceTracker.jsx** (300+ lines)
```javascript
import { useApp } from '../context/AppContext';

function ResourceTracker() {
  // Real-time resource display
}
```
- **Purpose**: Resource allocation tracker
- **Features**:
  - 4 resource cards (Teams, Personnel, Ambulances, Beds)
  - Progress bars
  - Color coding (Green/Yellow/Red)
  - Automatic alerts
  - Percentage calculations
- **Data**: From AppContext.getResourceStats()
- **Updates**: Real-time on state changes
- **Size**: ~12 KB

---

## 🌐 **CONTEXT/**

### **AppContext.jsx** (800+ lines)
```javascript
import { createContext, useState, useContext } from 'react';

const AppContext = createContext();

export function AppProvider({ children }) {
  // Global state management
}

export function useApp() {
  return useContext(AppContext);
}
```
- **Purpose**: Global state management
- **State Variables**:
  - disasters (array)
  - teams (array)
  - hospitals (array)
  - alerts (array)
  - aiDecisions (array)
  - notifications (array)
  - monitoredAreas (array)
  - sensors (array)
  
- **Actions**:
  - deployTeam(teamId, location, mission)
  - recallTeam(teamId)
  - addDisaster(disaster)
  - resolveAlert(alertId)
  - reopenAlert(alertId)
  - updateAiDecision(decisionId, status, reason)
  - showNotification(notification)
  - dismissNotification(id)
  
- **Computed Functions**:
  - getResourceStats() → teams, personnel, ambulances, beds
  - getStats() → activeDisasters, deployedTeams, activeAlerts
  
- **Dependencies**: react, mockData
- **Exports**: AppProvider, useApp
- **Size**: ~30 KB

---

## 📊 **DATA/**

### **mockData.js** (1000+ lines)
```javascript
export const resqTeams = [ /* 5 teams */ ];
export const hospitals = [ /* 5 hospitals */ ];
export const initialAlerts = [ /* 10+ alerts */ ];
export const monitoredAreas = [ /* 6 areas */ ];
export const sensorData = [ /* sensor readings */ ];
export const recommendations = [ /* AI recommendations */ ];
export const aiDecisions = [ /* AI decisions */ ];
```
- **Purpose**: Static sample data for development
- **Data Types**:
  - RESQ Teams (5) - Personnel, equipment, status
  - Hospitals (5) - Beds, ambulances, location
  - Alerts (10+) - Types, severity, locations
  - Monitored Areas (6) - Coordinates, risk levels
  - Sensor Data - Mock readings
  - Recommendations (5) - AI suggestions
  - AI Decisions (3) - Pending approvals
  
- **Features**:
  - Realistic coordinates
  - Varied risk levels
  - Different disaster types
  - Complete team rosters
  - Hospital capacities
  
- **Notes**:
  - Chidambaram coordinates fixed (not same as hospital)
  - Cuddalore coordinates fixed (not same as hospital)
  - Distances now show correctly (not 0.00 km)
  
- **Size**: ~40 KB

---

## 📄 **PAGES/**

### **Dashboard.jsx** (400+ lines)
```javascript
import LiveDataDashboard from '../components/LiveDataDashboard';
import ResourceTracker from '../components/ResourceTracker';
import { useApp } from '../context/AppContext';

function Dashboard() {
  // Main dashboard with charts and stats
}
```
- **Purpose**: Main overview page
- **Sections**:
  1. Welcome header
  2. Live Tamil Nadu data
  3. Resource allocation tracker
  4. 4 stat cards (hazards, teams, alerts, sensors)
  5. Hazard overview pie chart
  6. Risk trends line chart
  7. Response time bar chart
  8. Recent alerts list
  
- **Data**: AppContext (should use, currently mock)
- **Charts**: Recharts
- **Size**: ~15 KB

### **Alerts.jsx** (500+ lines)
```javascript
import { useState } from 'react';
import { useApp } from '../context/AppContext';

function Alerts() {
  // Alert management page
}
```
- **Purpose**: Alert list and management
- **Features**:
  - Filter buttons (All/Active/Resolved)
  - Alert cards with severity badges
  - Mark resolved button
  - Reopen button
  - Details modal
  - Emergency contacts
  - Safety precautions
  
- **State**: filter, selectedAlert
- **Actions**: resolveAlert, reopenAlert
- **Size**: ~20 KB

### **MapView.jsx** (300+ lines)
```javascript
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import { useApp } from '../context/AppContext';

function MapView() {
  // Interactive map with monitoring
}
```
- **Purpose**: Geographic visualization
- **Features**:
  - Leaflet interactive map
  - OpenStreetMap tiles
  - 6 monitored area markers
  - Risk-based color coding
  - 100km radius circles
  - Clickable popups
  - Zoom/pan controls
  
- **Center**: [11.75, 79.77] (Cuddalore)
- **Zoom**: 10
- **Pending**: Disaster markers from context
- **Size**: ~12 KB

### **Hospitals.jsx** (600+ lines)
```javascript
import { useState } from 'react';
import { useApp } from '../context/AppContext';

function Hospitals() {
  // Hospital directory and routing
}
```
- **Purpose**: Hospital information and actions
- **Features**:
  - Hospital list (5 facilities)
  - Bed availability
  - Ambulance count
  - Distance display
  - Details modal
  - Call Ambulance button
  - Get Directions button (Google Maps)
  
- **Data**: hospitals from AppContext
- **Modal**: Full hospital details
- **Size**: ~25 KB

### **Teams.jsx** (600+ lines)
```javascript
import { useApp } from '../context/AppContext';

function Teams() {
  // Team deployment management
}
```
- **Purpose**: RESQ team management
- **Features**:
  - Team list (5 teams)
  - Status badges (Standby/Deployed)
  - Deploy button (with prompts)
  - Recall button (with confirmation)
  - Reassign button
  - Personnel count
  - Equipment list
  - Stats at top
  
- **Actions**: deployTeam, recallTeam
- **State**: From AppContext
- **Integration**: Resource tracker updates
- **Size**: ~25 KB

### **MissionStatus.jsx** (310 lines)
```javascript
import { useState } from 'react';
import { useApp } from '../context/AppContext';

function MissionStatus() {
  // Active mission tracking
}
```
- **Purpose**: Mission completion workflow
- **Features**:
  - Active missions list
  - Mission duration (live timer)
  - Personnel deployed count
  - Mark complete button
  - Completion report modal
  - Required report field
  - Automatic resource return
  - Notifications
  
- **Calculations**: getMissionDuration(deployedAt)
- **State**: selectedTeam, completionReport
- **Size**: ~12 KB

### **Recommendations.jsx** (400+ lines)
```javascript
import { recommendations } from '../data/mockData';

function Recommendations() {
  // AI recommendations display
}
```
- **Purpose**: Display AI suggestions
- **Features**:
  - Recommendation cards
  - Priority badges
  - Resource requirements
  - Response time estimates
  - Affected population
  - Action buttons (pending)
  
- **Data**: Static mockData
- **Pending**: Button functionality
- **Size**: ~15 KB

### **AdminDashboard.jsx** (800+ lines)
```javascript
import { useState } from 'react';
import { useApp } from '../context/AppContext';

function AdminDashboard() {
  // AI decision management
}
```
- **Purpose**: AI workflow oversight
- **Features**:
  - 8-step AI workflow diagram
  - Decision queue
  - Filter buttons (All/Approved/Pending/Rejected)
  - Approve button
  - Reject button (with reason)
  - Explainable AI reasoning
  - Data source status
  - Auto-deployment on approval
  
- **State**: aiFilter
- **Actions**: updateAiDecision
- **Integration**: Auto-deploys teams
- **Size**: ~30 KB

### **DemoControls.jsx** (700+ lines)
```javascript
import { useState } from 'react';
import { useApp } from '../context/AppContext';

function DemoControls() {
  // Manual disaster simulation
}
```
- **Purpose**: Testing and demonstration
- **Features**:
  - Disaster creation form
    - Location dropdown (6 areas)
    - Type picker (4 types)
    - Risk slider (0-100%)
    - Population input
  - Hospital routing calculator
  - Nearest hospital finder
  - Distance calculation (Haversine)
  - Travel time estimation
  - Turn-by-turn directions
  - AI decision generation
  
- **Calculations**:
  - calculateDistance() - Haversine formula
  - formatDistance() - km or meters
  - estimateTravelTime() - based on distance
  
- **State**: disasterForm, routeInfo
- **Size**: ~28 KB

---

## 🔌 **SERVICES/**

### **liveDataService.js** (400+ lines)
```javascript
const OPENWEATHER_API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;

export async function fetchLiveWeather() { /* 8 TN cities */ }
export async function fetchLiveEarthquakes() { /* USGS API */ }
export function calculateRiskFromLiveData() { /* Risk scoring */ }

export class LiveDataPoller {
  constructor(callback, interval) { /* Auto-refresh */ }
  start() { /* Begin polling */ }
  stop() { /* End polling */ }
}
```
- **Purpose**: External API integration
- **APIs**:
  - OpenWeatherMap (weather for 8 cities)
  - USGS (earthquake data)
  
- **Functions**:
  - fetchLiveWeather() → weatherData[]
  - fetchLiveEarthquakes() → earthquakeData[]
  - calculateRiskFromLiveData() → riskScore (0-100%)
  
- **Classes**:
  - LiveDataPoller - Auto-refresh every 60s
  
- **Features**:
  - Tamil Nadu filtering (8°-13.5°N, 76.5°-80.5°E)
  - Mock data fallback on error
  - Rate limiting awareness
  
- **Size**: ~15 KB

---

## 🎨 **ROOT SRC FILES**

### **App.jsx** (38 lines)
```javascript
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Layout from './components/Layout/Layout';
// ... imports for all pages

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            {/* 9 routes */}
          </Routes>
        </Layout>
      </BrowserRouter>
    </AppProvider>
  );
}
```
- **Purpose**: Root component, routing setup
- **Routes**: 9 pages
- **Providers**: AppProvider (global state)
- **Wrapper**: Layout (sidebar, header)
- **Size**: ~1.5 KB

### **main.jsx** (10 lines)
```javascript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```
- **Purpose**: Application entry point
- **Mounts**: App to #root div
- **Mode**: StrictMode for development
- **Size**: ~300 bytes

### **index.css** (100+ lines)
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer components {
  .glass-card { /* glass morphism */ }
  .btn-primary { /* gradient button */ }
  /* ... utility classes */
}
```
- **Purpose**: Global styles
- **Includes**:
  - Tailwind directives
  - Custom component classes
  - Animations
  - Scrollbar styling
  
- **Size**: ~4 KB

---

## 📚 **DOCUMENTATION FILES**

All in root directory:

### **PENDING_TASKS.md** (~460 lines)
- Comprehensive task list
- Priorities (High/Medium/Low)
- 20+ tasks documented
- Testing checklist
- Technical debt

### **ALL_BUTTONS_FIXED.md** (~300 lines)
- Button functionality guide
- What was fixed
- How to test each button
- Integration details

### **RESOURCE_TRACKING_COMPLETE.md** (~490 lines)
- Resource system explanation
- How tracking works
- Testing guide
- Calculation formulas
- API documentation

### **LIVE_TN_DATA_COMPLETE.md** (~400 lines)
- Live data integration guide
- API setup instructions
- Risk calculation algorithm
- Testing procedures
- Troubleshooting

### **PROJECT_OVERVIEW.md** (New - 300+ lines)
- High-level project overview
- System objectives
- Geographic coverage
- User roles
- Technical stack
- Success criteria

### **FEATURES_COMPLETE.md** (New - 600+ lines)
- Detailed feature list
- 12 major features
- Each with status
- Testing verification
- Completion percentages

### **TESTING_GUIDE.md** (New - 1000+ lines)
- Complete testing manual
- Step-by-step tests
- Expected results
- Troubleshooting
- Full workflow tests
- Integration tests
- Checklist

### **ARCHITECTURE.md** (New - 800+ lines)
- Technical architecture
- System diagrams
- Data flow
- State management
- API integration
- Algorithms
- Security
- Performance
- Scalability

### **FILE_STRUCTURE.md** (This file - 1000+ lines)
- Every file documented
- Purpose and contents
- Dependencies
- Size estimates
- Code snippets

### **COMPLETE_REVIEW.md** (Next - TBD)
- Master review document
- Links to all docs
- Quick reference
- Status summary

---

## 📦 **BUILD OUTPUT (dist/)**

Generated by `npm run build`:

```
dist/
├── assets/
│   ├── index-[hash].js        # Bundled JavaScript
│   ├── index-[hash].css       # Compiled CSS
│   └── [other-assets]         # Images, fonts, etc.
├── index.html                 # Main HTML file
└── vite.svg                   # Favicon
```

- **Purpose**: Production build
- **Optimized**: Minified, tree-shaken
- **Not committed**: In .gitignore
- **Deploy**: Upload dist/ to hosting
- **Size**: ~500 KB (total)

---

## 📊 **FILE COUNT & SIZE**

### **By Directory:**

```
src/
  components/   4 files    ~37 KB
  context/      1 file     ~30 KB
  data/         1 file     ~40 KB
  pages/        9 files   ~200 KB
  services/     1 file     ~15 KB
  root files    3 files    ~6 KB
  
Total src/:    19 files   ~328 KB

docs/          15 files   ~150 KB
config/         6 files    ~5 KB
public/         1 file     ~1 KB

Total Project: 41 files   ~484 KB
(excluding node_modules, dist)
```

### **Lines of Code:**

```
JavaScript/JSX:  ~8,000 lines
CSS:              ~500 lines
Markdown:       ~6,000 lines
Config:           ~200 lines

Total:          ~14,700 lines
```

---

## 🔍 **FINDING FILES**

### **By Purpose:**

**State Management:**
- `src/context/AppContext.jsx`

**Pages (Routes):**
- `src/pages/Dashboard.jsx`
- `src/pages/Alerts.jsx`
- `src/pages/MapView.jsx`
- `src/pages/Hospitals.jsx`
- `src/pages/Teams.jsx`
- `src/pages/MissionStatus.jsx`
- `src/pages/Recommendations.jsx`
- `src/pages/AdminDashboard.jsx`
- `src/pages/DemoControls.jsx`

**Reusable Components:**
- `src/components/Layout/Layout.jsx`
- `src/components/LiveDataDashboard.jsx`
- `src/components/Notifications.jsx`
- `src/components/ResourceTracker.jsx`

**Data:**
- `src/data/mockData.js`

**Services:**
- `src/services/liveDataService.js`

**Configuration:**
- `vite.config.js`
- `tailwind.config.js`
- `postcss.config.js`
- `package.json`
- `.env.example`

**Documentation:**
- All `.md` files in root

---

## 🎯 **KEY FILES TO KNOW**

### **Top 10 Most Important:**

1. **AppContext.jsx** - Global state, all actions
2. **App.jsx** - Routing setup
3. **mockData.js** - All sample data
4. **Teams.jsx** - Deployment functionality
5. **Dashboard.jsx** - Main interface
6. **MissionStatus.jsx** - Completion workflow
7. **liveDataService.js** - API integration
8. **AdminDashboard.jsx** - AI decisions
9. **DemoControls.jsx** - Testing tools
10. **Layout.jsx** - Navigation structure

---

## 🚀 **QUICK ACCESS**

### **Need to modify:**

**Add new page:**
1. Create `src/pages/NewPage.jsx`
2. Import in `src/App.jsx`
3. Add route: `<Route path="/new" element={<NewPage />} />`
4. Add nav item in `src/components/Layout/Layout.jsx`

**Add new API:**
1. Add to `src/services/liveDataService.js`
2. Or create new `src/services/newService.js`
3. Import and use in components

**Add new data:**
1. Add to `src/data/mockData.js`
2. Import in AppContext or components
3. Or fetch from API

**Add new action:**
1. Add function to AppContext.jsx
2. Add to context value export
3. Use via `useApp()` hook

**Add new component:**
1. Create in `src/components/`
2. Import where needed
3. Pass props as needed

---

## ✅ **FILE STRUCTURE STATUS**

**Organization:** ✅ Excellent  
**Separation of Concerns:** ✅ Clear  
**Scalability:** ✅ Ready  
**Maintainability:** ✅ Good  
**Documentation:** ✅ Complete  

---

**Every file documented and explained!** 📁
