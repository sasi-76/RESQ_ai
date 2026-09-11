# 🌐 Real-Time Disaster Data Integration Guide

## 📍 Overview

This guide explains how RESQAI connects to **live disaster monitoring APIs** to fetch real-time data instead of using mock data.

---

## 🔗 Available Data Sources (India)

### 1. **India Meteorological Department (IMD)**
**Website:** https://mausam.imd.gov.in  
**API:** Contact IMD for API access  
**Data:**
- Real-time weather conditions
- Rainfall measurements
- Storm warnings
- Cyclone tracking
- Weather forecasts

**How to Get Access:**
1. Visit IMD website
2. Register for data services
3. Request API key for institutional/research use
4. Receive credentials via email

---

### 2. **National Center for Seismology (NCS)**
**Website:** https://seismo.gov.in  
**API:** https://seismo.gov.in/api (public access)  
**Data:**
- Recent earthquakes (past 24 hours)
- Magnitude, depth, location
- Seismic activity patterns
- Real-time alerts

**API Endpoint Example:**
```
GET https://seismo.gov.in/api/earthquakes/recent
Response: JSON list of recent earthquakes
```

---

### 3. **ISRO Satellite Data (Bhuvan)**
**Website:** https://bhuvan.nrsc.gov.in  
**API:** https://bhuvan-app1.nrsc.gov.in/api  
**Data:**
- Satellite imagery
- Cyclone tracking
- Flood extent mapping
- Land use changes

**How to Get Access:**
1. Register on Bhuvan portal
2. Apply for API access
3. Specify use case (disaster management)
4. Receive API key

---

### 4. **Central Water Commission (CWC)**
**Website:** http://cwc.gov.in  
**API:** http://ffs.tamingtheflood.in (Flood Forecast System)  
**Data:**
- River water levels
- Dam reservoir levels
- Flood forecasts
- Discharge rates

**Data Points:**
- 200+ river gauge stations
- Real-time updates (15-minute intervals)
- Historical data for trend analysis

---

### 5. **OpenWeatherMap (Backup/International)**
**Website:** https://openweathermap.org  
**API:** https://api.openweathermap.org/data/2.5  
**Free Tier:** 1,000 calls/day  
**Paid Plans:** Up to 60 calls/minute

**How to Get API Key:**
1. Sign up at https://openweathermap.org/api
2. Verify email
3. Get API key from dashboard
4. Free for development, paid for production

---

### 6. **USGS Earthquake API (Global)**
**Website:** https://earthquake.usgs.gov  
**API:** https://earthquake.usgs.gov/fdsnws/event/1  
**Data:**
- Global earthquakes (real-time)
- Magnitude, depth, location
- No API key required (public)

**Example Query:**
```
GET https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&latitude=11.75&longitude=79.77&maxradiuskm=500&minmagnitude=2.5
```

---

## ⚙️ Setup Instructions

### Step 1: Create Environment Variables File

Create `.env` file in project root:

```bash
# India Meteorological Department
VITE_IMD_API_KEY=your_imd_api_key_here

# National Center for Seismology
VITE_SEISMOLOGY_API_KEY=your_ncs_api_key_here

# ISRO Satellite Data
VITE_ISRO_API_KEY=your_isro_api_key_here

# OpenWeatherMap (Backup)
VITE_OPENWEATHER_API_KEY=your_openweather_api_key_here

# WebSocket Server (if using)
VITE_WEBSOCKET_URL=ws://your-websocket-server.com/stream

# Polling Interval (milliseconds)
VITE_POLLING_INTERVAL=30000
```

### Step 2: Install the `.env` File

```bash
# Already in gitignore, so your keys stay private
echo ".env" >> .gitignore
```

### Step 3: Get API Keys

**Quick Start (Free):**
1. **OpenWeatherMap:** Sign up at https://openweathermap.org/api (instant)
2. **USGS Earthquakes:** No key needed (public API)

**Production (Government APIs):**
1. Contact IMD for weather data
2. Register with ISRO for satellite imagery
3. Access CWC for river/flood data

---

## 🚀 How to Use Real-Time Data

### Option 1: Polling Service (Recommended for Start)

**In your Dashboard component:**

```javascript
import { useEffect, useState } from 'react';
import { DataPollingService } from '../services/dataIntegration';
import { monitoredAreas } from '../data/mockData';

function Dashboard() {
  const [realTimeData, setRealTimeData] = useState([]);

  useEffect(() => {
    // Create polling service
    const pollingService = new DataPollingService(
      monitoredAreas,
      30000 // Poll every 30 seconds
    );

    // Start polling and handle updates
    pollingService.start((data) => {
      console.log('📊 Real-time data received:', data);
      setRealTimeData(data);

      // Update state with new risk scores
      data.forEach(areaData => {
        console.log(`${areaData.areaName}: ${areaData.risk.riskPercent}% risk`);
      });
    });

    // Cleanup on unmount
    return () => pollingService.stop();
  }, []);

  return (
    <div>
      {/* Your dashboard UI */}
      {realTimeData.map(area => (
        <div key={area.areaId}>
          <h3>{area.areaName}</h3>
          <p>Risk: {area.risk.riskPercent}%</p>
          <p>Rainfall: {area.rainfall?.rainfall1h}mm</p>
          <p>Wind: {area.weather?.windSpeed}km/h</p>
        </div>
      ))}
    </div>
  );
}
```

---

### Option 2: WebSocket Service (Real-Time Push)

**If you have a WebSocket server:**

```javascript
import { useEffect } from 'react';
import { RealTimeDataStream } from '../services/dataIntegration';

function Dashboard() {
  useEffect(() => {
    const wsUrl = import.meta.env.VITE_WEBSOCKET_URL || 'ws://localhost:8080';
    const stream = new RealTimeDataStream(wsUrl);

    stream.connect();

    // Subscribe to sensor updates
    stream.subscribe('sensor_update', (data) => {
      console.log('📡 Sensor update:', data);
      // Update your state here
    });

    // Subscribe to risk changes
    stream.subscribe('risk_alert', (data) => {
      console.log('⚠️ Risk alert:', data);
      // Show notification, update UI
    });

    return () => stream.disconnect();
  }, []);

  return <div>Your UI</div>;
}
```

---

### Option 3: Manual API Calls

**Fetch data on demand:**

```javascript
import { fetchWeatherData, fetchEarthquakeData } from '../services/dataIntegration';

async function checkAreaStatus(lat, lng) {
  const weather = await fetchWeatherData(lat, lng);
  const earthquakes = await fetchEarthquakeData(lat, lng, 100);

  console.log('Weather:', weather);
  console.log('Recent Earthquakes:', earthquakes);

  return { weather, earthquakes };
}

// Use in component
useEffect(() => {
  checkAreaStatus(11.75, 79.77).then(data => {
    console.log('Area data:', data);
  });
}, []);
```

---

## 📊 Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   REAL-TIME DATA SOURCES                     │
├─────────────────────────────────────────────────────────────┤
│  IMD Weather │ NCS Seismic │ ISRO Satellite │ CWC Rivers    │
└──────┬───────────────┬───────────────┬──────────────┬───────┘
       │               │               │              │
       └───────────────┴───────────────┴──────────────┘
                            │
                  ┌─────────▼──────────┐
                  │ Data Integration   │
                  │ Service Layer      │
                  │ (dataIntegration.js)│
                  └─────────┬──────────┘
                            │
              ┌─────────────┼─────────────┐
              │             │             │
       ┌──────▼──────┐ ┌───▼────┐ ┌─────▼──────┐
       │ Polling     │ │ WebSocket│ │ Manual API │
       │ Service     │ │ Stream   │ │ Calls      │
       └──────┬──────┘ └───┬────┘ └─────┬──────┘
              │             │             │
              └─────────────┴─────────────┘
                            │
                  ┌─────────▼──────────┐
                  │   React Components │
                  │  (Dashboard, etc.) │
                  └─────────┬──────────┘
                            │
                  ┌─────────▼──────────┐
                  │    AI Risk Engine   │
                  │ calculateRiskScore()│
                  └─────────┬──────────┘
                            │
                  ┌─────────▼──────────┐
                  │   UI Display       │
                  │ (Charts, Alerts)   │
                  └────────────────────┘
```

---

## 🤖 AI Risk Calculation

The system calculates risk percentage based on real-time data:

```javascript
Risk Score = 
  Rainfall Risk (0-30 points) +
  Water Level Risk (0-25 points) +
  Wind Speed Risk (0-20 points) +
  Earthquake Risk (0-15 points) +
  Pressure Drop Risk (0-10 points)
  ────────────────────────────────
  Total: 0-100%
```

**Example:**
```
Rainfall: 145mm → 21.75 points (145/200 * 30)
Water Level: 4.8m / 6.0m → 20 points (80% of danger level)
Wind Speed: 65km/h → 13 points (65/100 * 20)
Earthquake: 3.2 magnitude → 6 points (3.2/8 * 15)
Pressure: 1005mb → 2.67 points ((1013-1005)/30 * 10)

Total Risk: 63.42% ≈ 63% (MEDIUM-HIGH)
```

---

## 🔄 Update Frequencies

**Recommended Polling Intervals:**

| Data Type | Interval | Reason |
|-----------|----------|--------|
| Weather | 5-10 min | Changes gradually |
| Rainfall | 15 min | Rain gauge updates |
| River Levels | 15 min | CWC update frequency |
| Seismic | 1 min | Immediate alerts needed |
| Satellite | 30-60 min | Image processing time |

**In Production:**
```javascript
const pollingService = new DataPollingService(
  monitoredAreas,
  300000 // 5 minutes (300,000 ms)
);
```

---

## 📡 WebSocket Setup (Optional)

If you want **instant push notifications** instead of polling:

### Backend Setup (Node.js Example)

```javascript
// server.js
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
  console.log('Client connected');

  // Push data every 30 seconds
  const interval = setInterval(() => {
    const data = {
      type: 'sensor_update',
      payload: {
        rainfall: Math.random() * 200,
        waterLevel: 4 + Math.random() * 2,
        timestamp: new Date().toISOString(),
      },
    };
    ws.send(JSON.stringify(data));
  }, 30000);

  ws.on('close', () => {
    clearInterval(interval);
    console.log('Client disconnected');
  });
});

console.log('WebSocket server running on ws://localhost:8080');
```

### Frontend Usage
Already included in `dataIntegration.js` - see Option 2 above.

---

## 🔐 Security Best Practices

### 1. **Never Commit API Keys**
```bash
# Add to .gitignore
.env
.env.local
.env.production
```

### 2. **Use Environment Variables**
```javascript
const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY;
```

### 3. **Rate Limiting**
```javascript
// Add delay between API calls
await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
```

### 4. **Error Handling**
```javascript
try {
  const data = await fetchWeatherData(lat, lng);
} catch (error) {
  console.error('API Error:', error);
  // Fall back to cached data or show error to user
}
```

---

## 🧪 Testing Real-Time Integration

### Step 1: Start with USGS Earthquakes (No Key Needed)

```javascript
import { fetchEarthquakeData } from './services/dataIntegration';

// Test in browser console
fetchEarthquakeData(11.75, 79.77, 500).then(data => {
  console.log('Recent earthquakes:', data);
});
```

### Step 2: Add OpenWeatherMap (Free)

1. Get free API key from https://openweathermap.org/api
2. Add to `.env`: `VITE_OPENWEATHER_API_KEY=your_key`
3. Test:

```javascript
import { fetchWeatherData } from './services/dataIntegration';

fetchWeatherData(11.75, 79.77).then(data => {
  console.log('Weather:', data);
});
```

### Step 3: Full Integration

```javascript
import { fetchAllAreasData } from './services/dataIntegration';
import { monitoredAreas } from './data/mockData';

fetchAllAreasData(monitoredAreas).then(data => {
  console.log('All areas:', data);
});
```

---

## 📈 Production Deployment

### Step 1: Get Production API Keys
- Apply for IMD API access
- Register with ISRO for satellite data
- Contact CWC for river data access

### Step 2: Set Up Backend Server
- Deploy Node.js server for API proxying
- Implement caching (Redis)
- Set up monitoring (Grafana)

### Step 3: Configure Environment
```bash
# .env.production
VITE_IMD_API_KEY=prod_key_xxx
VITE_POLLING_INTERVAL=300000
VITE_WEBSOCKET_URL=wss://api.resqai.gov.in/ws
```

### Step 4: Deploy
```bash
npm run build
# Deploy dist/ folder to hosting
```

---

## 🆘 Troubleshooting

### Issue: "API Key Invalid"
**Solution:** Check `.env` file exists and variable names match

### Issue: "CORS Error"
**Solution:** Use a backend proxy server or CORS proxy

### Issue: "Rate Limit Exceeded"
**Solution:** Increase polling interval or upgrade API plan

### Issue: "No Data Returned"
**Solution:** Check API endpoint URLs and network connectivity

---

## 📞 Support Contacts

**For API Access:**
- **IMD:** helpdesk@imd.gov.in
- **ISRO:** bhuvan@nrsc.gov.in  
- **CWC:** cwc@cwc.gov.in

**For Technical Issues:**
- Check API documentation
- Review browser console for errors
- Test API endpoints with Postman/curl

---

## ✅ Quick Setup Checklist

- [ ] Get OpenWeatherMap API key (free)
- [ ] Create `.env` file with API keys
- [ ] Test USGS earthquake API (no key needed)
- [ ] Import `dataIntegration.js` in your components
- [ ] Use `DataPollingService` to start fetching data
- [ ] Replace mock data with real data in state
- [ ] Test risk calculation with live data
- [ ] Monitor API usage and errors
- [ ] Set up production API keys (IMD, ISRO, CWC)
- [ ] Deploy with environment variables

---

**Your RESQAI system is now ready to connect to real-time disaster monitoring data sources!** 🌐✨
