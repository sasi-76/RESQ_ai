# 🚀 RESQAI Quick Start Guide

## ⚡ Get Started in 60 Seconds

### 1️⃣ Open Your Terminal
```bash
cd C:/Users/tamil/Desktop/cit
```

### 2️⃣ Install Dependencies (First Time Only)
```bash
npm install
```
*Takes ~30-60 seconds*

### 3️⃣ Start the Server
```bash
npm run dev
```

### 4️⃣ Open Your Browser
Navigate to: **http://localhost:3000**

🎉 **Done!** The RESQAI Emergency Operations Center is now running.

---

## 📱 Navigation Guide

### Sidebar Menu (Left Side)
Click on any icon to navigate:

1. **🏠 Dashboard** - Main operations center with live stats
2. **🔔 Alerts** - Alert management and communication
3. **🗺️ Map** - Area analysis and heatmap visualization
4. **🏥 Hospitals** - Medical support and bed availability
5. **👥 Teams** - ResQ team deployment status
6. **📋 Recommendations** - Action checklist for authorities

---

## 🎯 What to Explore First

### Dashboard Page
- Check the **4 stat cards** at the top (Active Hazards, Areas, Teams, Risk Level)
- Look at the **donut chart** showing hazard distribution (Flood 76%, Cyclone 32%)
- Watch the **live sensor data** update every 3 seconds (rainfall, water level, wind, seismic)
- See the **risk trend chart** showing how the situation is escalating

### Alerts Page
- Click the **"Public Alerts"** tab to see alerts for the public
- Click the **"Controller Alerts"** tab for internal notifications
- Click on any alert card to view details in the right sidebar
- Try clicking **"Approve Alert"** button on critical alerts

### Map Page
- See the **interactive SVG heatmap** with 100km radius
- Watch the **pulse animations** on high-risk areas (Cuddalore in red)
- Hover over area markers to see details
- Check the **Area Details panel** on the right showing all 6 monitored locations

### Hospitals Page
- View **5 hospitals** with real-time bed availability
- Notice the **color-coded indicators** (green = available, yellow = limited, red = critical)
- See **bed occupancy progress bars** for each hospital
- Check the **distance** column to see how far each hospital is

### Teams Page
- See **5 ResQ teams** with their deployment status
- **3 teams are deployed** (green pulse dot) - Alpha, Bravo, Charlie
- **2 teams on standby** (yellow dot) - Delta, Echo
- Check each team's **equipment** and **vehicle** information
- Look at the **deployment workflow** at the bottom (3 steps)

### Recommendations Page
- See **6 action items** prioritized by urgency (Immediate, High, Ongoing)
- **Click the checkboxes** to mark actions as completed (interactive!)
- Watch the **progress bars** update in the right sidebar
- See the **continuous loop diagram** at the bottom showing the 8-step process

---

## 🎨 UI Features to Notice

### Real-Time Updates
- **Sensor data** changes every 3 seconds (watch the rainfall, water level, etc.)
- **Pulse animations** on deployed teams and critical alerts
- **Live clock** in the top-right header

### Color-Coded System
- **Red (P1)**: Critical priority - immediate action required
- **Orange (P2)**: High priority - action needed soon
- **Yellow (P3)**: Medium priority - monitor closely
- **Green (P4)**: Low priority - standard monitoring

### Interactive Elements
- **Hover** over charts to see tooltips with detailed values
- **Click** on alert cards to view full details
- **Check** recommendation boxes to mark as completed
- **Click** team action buttons (Reassign, Recall)

### Glass Morphism Design
- Notice the **translucent cards** with backdrop blur
- **Dark theme** optimized for 24/7 operations centers
- **Gradient accents** on stat cards and badges

---

## 🔍 Data Breakdown

### Monitored Areas (6 total)
1. **Cuddalore**: 76% risk, P1 priority, 173K population - *CRITICAL*
2. **Chidambaram**: 58% risk, P2 priority, 62K population
3. **Kurinjipadi**: 48% risk, P2 priority, 35K population
4. **Panruti**: 42% risk, P3 priority, 51K population
5. **Kattumannarkoil**: 35% risk, P3 priority, 23K population
6. **Virudhachalam**: 28% risk, P4 priority, 68K population

### Hospitals (5 total)
- **362 beds available** across all hospitals
- **27 ambulances** ready for deployment
- Closest: Cuddalore Govt. Hospital (2.5 km)
- Largest: RGGGH Chennai (800 total beds)

### ResQ Teams (5 specialized units)
- **Alpha Response**: Water rescue specialists (boats)
- **Bravo Medical**: Emergency medical team (ambulances)
- **Charlie Search**: Search & rescue with dogs
- **Delta Relief**: Relief supplies distribution
- **Echo Aerial**: Drone surveillance & coordination

### Active Hazards (4 types)
- **Flood**: 76% (primary threat)
- **Cyclone**: 32% (secondary)
- **Earthquake**: 18% (monitoring)
- **Volcanic**: 12% (low risk)

---

## ⚙️ Keyboard Shortcuts

While no built-in shortcuts exist yet, you can navigate using:
- **Tab**: Move between interactive elements
- **Enter**: Activate buttons and checkboxes
- **Escape**: Close modals (future feature)
- **Ctrl + Click** (in browser): Open link in new tab

---

## 🛠️ Troubleshooting

### Server won't start?
```bash
# Make sure you're in the right directory
cd C:/Users/tamil/Desktop/cit

# Try reinstalling dependencies
rm -rf node_modules package-lock.json
npm install
```

### Port 3000 already in use?
```bash
# Kill existing process or change port in vite.config.js
# Edit vite.config.js and change: server: { port: 3001 }
```

### Charts not rendering?
- Make sure you have a modern browser (Chrome, Firefox, Edge)
- Clear browser cache and reload (Ctrl + Shift + R)

### Blank page?
- Open browser console (F12) and check for errors
- Make sure all dependencies installed: `npm install`

---

## 📚 Learn More

### Documentation Files
- **README.md**: Full project documentation
- **PROJECT_OVERVIEW.md**: Detailed system architecture
- **QUICKSTART.md**: This guide

### Code Structure
- `src/pages/`: All 6 page components
- `src/data/mockData.js`: Sample data for all features
- `src/components/Layout/`: Sidebar and header
- `src/index.css`: Tailwind styles and animations

---

## 🎓 Tutorial: Your First Workflow

### Scenario: Flood Risk Increases in Cuddalore

1. **Open Dashboard** → See "Risk Level: 76%" in top-right stat card
2. **Check the Map** → Cuddalore appears as large red circle (P1 priority)
3. **Go to Alerts** → See "Flood risk increased in Cuddalore (76%)" alert
4. **Click "Approve Alert"** → Public will be notified (button turns green)
5. **Go to Teams** → See "RESQ-01 Alpha" and "RESQ-03 Charlie" deployed to Cuddalore
6. **Go to Hospitals** → Check Cuddalore Govt. Hospital has 85 free beds
7. **Go to Recommendations** → Check off actions as completed:
   - ✅ Issue public warnings
   - ✅ Deploy RESQ teams
   - ✅ Prepare hospitals
   - ✅ Open shelters
8. **Back to Dashboard** → Monitor sensor data for changes

---

## 🌐 Browser Compatibility

✅ **Fully Supported**:
- Chrome 90+
- Firefox 88+
- Edge 90+
- Safari 14+

⚠️ **Limited Support**:
- Internet Explorer: Not supported (use Edge instead)

---

## 📞 Emergency Reference

### Quick Dial Numbers (India)
- **112**: Emergency (Police, Fire, Medical)
- **108**: Ambulance
- **1077**: Disaster Management Helpline
- **1070**: Flood Control Room

### System Status
- **Green Pulse Dot**: System operational, live monitoring active
- **"Controller Operated | 24/7 Monitoring"**: Displayed in header

---

## 🎯 Next Steps

### For Developers
1. Explore `src/data/mockData.js` to understand data structure
2. Read component code in `src/pages/` to see implementation
3. Customize colors in `tailwind.config.js`
4. Add new features or integrate real APIs

### For Users
1. Familiarize yourself with all 6 pages
2. Test interactive features (checkboxes, buttons)
3. Watch real-time sensor updates
4. Practice emergency workflows

### For Deployment
1. Build for production: `npm run build`
2. Test production build: `npm run preview`
3. Deploy `dist/` folder to hosting service

---

**🚀 You're all set!** Explore RESQAI and see how AI-powered emergency response saves lives.

For questions, refer to **README.md** for full documentation.
