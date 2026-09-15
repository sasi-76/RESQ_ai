# 🔍 Hardcoded Parts in RESQAI

## Overview
This document lists ALL hardcoded data that should be replaced with real APIs/databases in production.

**Total Hardcoded:** ~90% of data
**Location:** Mostly in `src/data/mockData.js` (974 lines!)

---

## 📁 1. MOCK DATA FILE (Main Source)

### **File:** `src/data/mockData.js`
**Lines:** 974 lines of hardcoded data

### What's Inside:

#### **Monitored Areas** (Lines 10-500+)
```javascript
export const monitoredAreas = [
  {
    id: 11,
    name: 'Zone 15 Sholinganallur',
    lat: 12.8681,
    lng: 80.2166,
    riskPercent: 78,
    population: 185000,
    // ... 50+ areas with full details
  }
]
```
**Replace with:** Real geographic zones from government database

---

#### **Hospitals** (50+ hospitals)
```javascript
export const hospitals = [
  {
    id: 'H-001',
    name: 'Cuddalore Govt Hospital',
    lat: 11.7541,
    lng: 79.7621,
    freeBeds: 85,
    ambulances: 4,
    // ... full details
  }
]
```
**Replace with:** Hospital Management System API

---

#### **Teams** (5 rescue teams)
```javascript
export const resqTeams = [
  {
    id: 'RESQ-01',
    name: 'Alpha Squad',
    status: 'standby',
    members: 12,
    equipment: ['Inflatable rafts', 'Medical kits'],
    // ... full details
  }
]
```
**Replace with:** Personnel management database

---

#### **Sensor Data** (Simulated)
```javascript
export const sensorData = {
  rainfall: { value: 165.3, unit: 'mm', threshold: 150 },
  waterLevel: { value: 4.8, unit: 'm', threshold: 4.5 },
  windSpeed: { value: 78, unit: 'km/h', threshold: 60 },
  seismicActivity: { value: 2.3, unit: 'Richter', threshold: 3.0 }
}
```
**Replace with:** Real IoT sensors via API

---

#### **Alerts** (Pre-generated)
```javascript
export const alerts = [
  {
    id: 1,
    type: 'Flood Warning',
    severity: 'critical',
    areaName: 'Cuddalore',
    // ... details
  }
]
```
**Replace with:** Alert generation system

---

## 📍 2. LOCATION DATA

### **Hardcoded Coordinates:**

**Default User Location:**
```javascript
// src/context/AppContext.jsx
const [userLocation, setUserLocation] = useState({
  lat: 11.75,  // Cuddalore
  lng: 79.77,
  name: 'Cuddalore Operations HQ'
});
```

**Hospital Locations:** All lat/lng hardcoded

**Team Locations:** Base coordinates hardcoded

**Replace with:** 
- GPS API
- Google Maps Geocoding API
- Real-time location tracking

---

## 🏥 3. HOSPITAL SYSTEM

### **All Hospital Data Hardcoded:**

**From:** `src/data/mockData.js`

```javascript
{
  id: 'H-001',
  name: 'Cuddalore Govt Hospital',
  type: 'Government',
  lat: 11.7541,
  lng: 79.7621,
  freeBeds: 85,          // ❌ Hardcoded
  totalBeds: 250,        // ❌ Hardcoded
  ambulances: 4,         // ❌ Hardcoded
  icuBeds: 12,          // ❌ Hardcoded
  ventilators: 8,       // ❌ Hardcoded
  bloodBank: true,      // ❌ Hardcoded
  traumaCenter: true    // ❌ Hardcoded
}
```

**Replace with:**
- Hospital Management System API
- Real-time bed availability
- Real ambulance tracking
- Equipment inventory database

---

## 👥 4. TEAM MANAGEMENT

### **All Team Data Hardcoded:**

**From:** `src/data/mockData.js`

```javascript
{
  id: 'RESQ-01',
  name: 'Alpha Squad',
  status: 'standby',      // ❌ Manual update
  members: 12,            // ❌ Hardcoded
  location: 'Base Camp',  // ❌ Hardcoded
  equipment: [            // ❌ Hardcoded list
    'Inflatable rafts',
    'Medical kits',
    'Rescue ropes'
  ],
  specialization: 'Search & Rescue',
  experience: '5 years'
}
```

**Replace with:**
- Personnel database
- GPS tracking for teams
- Equipment inventory system
- Real-time status updates

---

## 📊 5. STATISTICS & CALCULATIONS

### **Hardcoded Values:**

**From:** `src/context/AppContext.jsx`

```javascript
// Hardcoded risk calculations
const overallRiskPercent = disasters.length > 0 
  ? Math.min(Math.round(disasters.reduce(...) / disasters.length), 100)
  : 25;  // ❌ Hardcoded baseline

// Hardcoded mission data
const completedMissions = [{
  id: 'mission-01',
  civiliansRescued: 142,  // ❌ Hardcoded number
  personnelInvolved: 15   // ❌ Hardcoded number
}];
```

**Replace with:**
- Real risk assessment algorithms
- Historical mission database
- Real-time mission tracking

---

## 🌦️ 6. WEATHER DATA

### **File:** `src/services/weatherService.js`

**Currently:**
```javascript
export const getWeatherData = async () => {
  try {
    // API call (needs real API key)
    const response = await fetch(`https://api.openweathermap.org/...`);
  } catch (error) {
    // Falls back to mock data ❌
    return MOCK_WEATHER_DATA;
  }
};

const MOCK_WEATHER_DATA = {  // ❌ Hardcoded fallback
  temp: 32,
  humidity: 78,
  windSpeed: 25
};
```

**Replace with:**
- Real Weather API (OpenWeatherMap, IMD)
- Add API key to .env file
- Remove fallback mock data

---

## 🤖 7. AI DECISION LOGS

### **File:** `src/pages/AdminDashboard.jsx`

```javascript
const aiDecisionLogs = [  // ❌ Hardcoded mock AI decisions
  {
    id: 1,
    module: 'Hazard Detection Engine',
    decision: 'Risk Increase Detected',
    confidence: 94,
    status: 'approved'
  },
  // ... 4 more hardcoded decisions
];
```

**Replace with:**
- Real AI/ML model decisions
- Decision logging database
- Confidence score calculations

---

## 📝 8. TASKS & MISSIONS

### **File:** `src/context/AppContext.jsx`

```javascript
const [tasks, setTasks] = useState([
  {
    id: 1,
    title: 'Evacuate Residents from Flood Zone',  // ❌ Hardcoded
    location: 'Cuddalore Old Town',
    status: 'in-progress',
    assignedTeam: 'Alpha Squad'
  },
  // ... 2 more hardcoded tasks
]);
```

**Replace with:**
- Task management database
- Dynamic task generation
- Assignment algorithms

---

## 🚨 9. SOS BEACONS

### **Currently:**
```javascript
const [sosBeacons, setSosBeacons] = useState([]);
```

**Good:** Uses state, but...

**SOS Creation:** Manual via code
```javascript
addSOSBeacon({
  id: Date.now(),
  location: 'Hardcoded Location',  // ❌
  lat: 11.75,  // ❌ Hardcoded
  lng: 79.77   // ❌ Hardcoded
});
```

**Replace with:**
- Real emergency hotline integration
- SMS gateway
- Mobile app SOS button
- GPS from caller

---

## 🗺️ 10. MAP DATA

### **Disaster Markers:**
```javascript
// All disaster locations are manually created via Demo Controls
// No real disaster detection
```

**Replace with:**
- Satellite imagery analysis
- Government disaster feeds
- News API integration
- Social media monitoring

---

## 🔐 11. AUTHENTICATION

### **Currently:** NONE! ❌

```javascript
// No user login
// No role-based access
// No session management
```

**Replace with:**
- Firebase Auth / Supabase Auth
- JWT tokens
- User roles (Admin, Controller, Viewer)
- Session management

---

## 📱 12. NOTIFICATIONS

### **Currently:**
```javascript
showNotification({
  id: Date.now(),
  title: 'Hardcoded Title',  // ❌
  message: 'Hardcoded Message'  // ❌
});
```

**Replace with:**
- Push notifications (Firebase Cloud Messaging)
- SMS alerts (Twilio)
- Email notifications
- WhatsApp Business API

---

## 🌐 13. API ENDPOINTS

### **Currently:** NONE!

No backend server, no API calls.

**Replace with:**
```javascript
// Real API endpoints
const API_BASE_URL = 'https://api.resqai.gov.in';

// Examples:
GET /api/disasters
GET /api/teams
POST /api/teams/{id}/deploy
GET /api/hospitals/availability
POST /api/sos/create
```

---

## 📋 14. CONFIGURATION VALUES

### **Hardcoded in Code:**

**Demo Controls:**
```javascript
const severityLevels = [  // ❌ Hardcoded
  { value: 'low', color: '#22c55e', range: '0-25%' },
  { value: 'medium', color: '#eab308', range: '26-50%' },
  { value: 'high', color: '#f97316', range: '51-75%' },
  { value: 'critical', color: '#ef4444', range: '76-100%' }
];
```

**Should be in:** Configuration file or database

---

## 🎨 15. THEME & STYLING

### **Colors:**
```css
/* Hardcoded in Tailwind classes */
bg-slate-900
text-blue-400
border-green-500
```

**Better:** Use CSS variables or theme system

---

## 📊 SUMMARY TABLE

| Category | Hardcoded? | Lines of Code | Priority |
|----------|-----------|---------------|----------|
| Monitored Areas | ✅ Yes | ~300 lines | High |
| Hospitals | ✅ Yes | ~400 lines | High |
| Teams | ✅ Yes | ~100 lines | High |
| Sensor Data | ✅ Yes | ~50 lines | Medium |
| Alerts | ✅ Yes | ~100 lines | Medium |
| Weather | ⚠️ Partial | ~50 lines | Medium |
| AI Decisions | ✅ Yes | ~80 lines | Low |
| Tasks | ✅ Yes | ~40 lines | Medium |
| SOS Beacons | ⚠️ Dynamic | ~0 lines | High |
| Coordinates | ✅ Yes | Throughout | High |
| Configuration | ✅ Yes | Throughout | Low |
| Authentication | ❌ None | 0 lines | High |
| API Endpoints | ❌ None | 0 lines | High |

---

## 🎯 REPLACEMENT PRIORITY

### **CRITICAL (Do First):**
1. ✅ Hospital data → Hospital Management System API
2. ✅ Team locations → GPS tracking API
3. ✅ SOS creation → Emergency hotline integration
4. ✅ User authentication → Auth system

### **HIGH:**
1. ✅ Weather data → Real weather API
2. ✅ Disaster detection → Satellite/sensor feeds
3. ✅ Coordinates → Real location services
4. ✅ Alerts → Automated alert system

### **MEDIUM:**
1. ✅ Sensor data → IoT sensors
2. ✅ Tasks → Task management system
3. ✅ Statistics → Analytics database
4. ✅ Notifications → Push notification service

### **LOW:**
1. Configuration → Config database
2. Theme → Theme management system
3. AI decisions → Real ML models

---

## 💡 RECOMMENDED APPROACH

### **Phase 1: Backend Setup (Week 1)**
```javascript
// Create backend with Node.js + Express
// Setup PostgreSQL database
// Create REST API endpoints
```

### **Phase 2: Replace Mock Data (Week 2)**
```javascript
// Replace mockData.js imports with API calls
// Add loading states
// Add error handling
```

### **Phase 3: Real Integrations (Week 3-4)**
```javascript
// Integrate real APIs:
// - Google Maps for geocoding
// - OpenWeatherMap for weather
// - Twilio for SMS
// - Firebase for auth
```

---

## 📝 SPECIFIC FILES TO MODIFY

### **Remove/Replace These:**
1. ❌ `src/data/mockData.js` - Replace with API calls
2. ⚠️ `src/services/weatherService.js` - Add real API key
3. ⚠️ `src/services/dataIntegration.js` - Connect to backend
4. ⚠️ `src/context/AppContext.jsx` - Fetch from API instead of state

### **Keep These:**
1. ✅ `src/components/*` - UI components (good)
2. ✅ `src/pages/*` - Pages (good)
3. ✅ `src/styles/*` - Styles (good)

---

## 🚀 QUICK START TO DE-HARDCODE

### **Step 1: Environment Variables**
```bash
# .env file
VITE_API_BASE_URL=https://api.resqai.gov.in
VITE_WEATHER_API_KEY=your_key_here
VITE_MAPS_API_KEY=your_key_here
VITE_FIREBASE_API_KEY=your_key_here
```

### **Step 2: Create API Service**
```javascript
// src/services/api.js
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const fetchDisasters = async () => {
  const response = await fetch(`${API_BASE_URL}/disasters`);
  return response.json();
};

export const fetchHospitals = async () => {
  const response = await fetch(`${API_BASE_URL}/hospitals`);
  return response.json();
};
```

### **Step 3: Replace in AppContext**
```javascript
// Before (Hardcoded)
const [hospitals, setHospitals] = useState(mockData.hospitals);

// After (Dynamic)
const [hospitals, setHospitals] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  fetchHospitals().then(data => {
    setHospitals(data);
    setLoading(false);
  });
}, []);
```

---

## ✅ SUMMARY

**Percentage Hardcoded:** ~90%

**Main File:** `src/data/mockData.js` (974 lines!)

**What's Dynamic:**
- User interactions ✅
- State management ✅
- UI rendering ✅
- Calculations ✅

**What's Hardcoded:**
- All data sources ❌
- All locations ❌
- All statistics ❌
- All configurations ❌

**To Make Production-Ready:**
- Build backend API
- Replace mockData imports
- Add real integrations
- Add authentication
- Connect to databases

---

**Your app is perfect for DEMO!** 🎉

**For production, you'll need to replace ~90% of data sources with real APIs.** 🔌

This is normal and expected for a prototype! The architecture is solid - just need to swap data sources. 🚀
