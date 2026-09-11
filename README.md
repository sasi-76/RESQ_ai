# RESQAI - AI-Powered Multi-Hazard Monitoring & Emergency Response System

![RESQAI](https://img.shields.io/badge/RESQAI-Emergency_Operations-blue?style=for-the-badge)
![React](https://img.shields.io/badge/React-18.3-61dafb?style=flat-square&logo=react)
![Vite](https://img.shields.io/badge/Vite-5.4-646cff?style=flat-square&logo=vite)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?style=flat-square&logo=tailwindcss)

**RESQAI** is a comprehensive emergency operations center (EOC) dashboard for real-time multi-hazard monitoring, AI-powered risk analysis, and coordinated emergency response across affected areas.

---

## 🌟 Features

### 📊 **Dashboard (Real-time Operations Center)**
- **Live Statistics**: Active hazards, monitored areas, deployed teams, and current risk levels
- **Hazard Risk Overview**: Interactive donut chart showing distribution of Flood, Cyclone, Earthquake, and Volcanic risks
- **Affected Areas**: Real-time risk percentages with color-coded priority levels (P1-P4)
- **Change Trend Analysis**: Time-series visualization of risk escalation
- **Live Sensor Data**: Real-time monitoring of rainfall, water level, wind speed, and seismic activity with threshold indicators
- **Recent Alerts Ticker**: Latest critical, warning, and info alerts with timestamps

### 🚨 **Alerts & Communication**
- **Public & Controller Alerts**: Separate views for public advisories and internal controller notifications
- **Alert Management**: Approve, view, and track alerts with risk change visualization (previous → current)
- **RESQAI Alert Details**: Precautions, emergency contacts, and recommended actions
- **Priority-based Alerts**: Critical (red), Warning (yellow), Info (blue) with visual indicators

### 🗺️ **Area Analysis & Prioritization**
- **Interactive Heatmap**: SVG-based hazard risk visualization with 100km radius
- **Area Details Panel**: Population affected, primary hazards, and risk percentages
- **Priority Color Coding**: P1 (red), P2 (orange), P3 (yellow), P4 (green)
- **Geographic Distribution**: Monitoring Cuddalore, Chidambaram, Panruti, Virudhachalam, and surrounding areas

### 🏥 **Hospitals & Medical Support**
- **Hospital Statistics**: Total hospitals, available beds, ambulances, emergency-ready facilities
- **Bed Availability Matrix**: Real-time free bed counts with occupancy indicators
- **Distance & Type**: Multi-speciality, general, and super-speciality hospital tracking
- **Controller-Only Data**: Sensitive medical capacity data visible only to authorized personnel

### 👥 **ResQ Team Deployment**
- **Team Overview**: 5 specialized response units (Alpha, Bravo, Charlie, Delta, Echo)
- **Deployment Status**: Real-time tracking of deployed vs standby teams
- **Equipment Inventory**: Rescue boats, medical kits, search dogs, drones, relief supplies
- **Deployment Workflow**: 3-step visualization (Authority Allocates → Team Notified → Field Response)
- **Team Management**: Reassign and recall capabilities

### 📋 **Measures & Recommendations**
- **Actionable Checklist**: Priority-based recommendations (Immediate, High, Ongoing)
- **Progress Tracking**: Interactive checkboxes to mark actions as completed
- **Status Indicators**: Pending, In Progress, Completed, Active
- **Emergency Contacts**: Quick access to 112, 108, 1077 helplines
- **Continuous Loop Visualization**: 8-step MONITOR → DETECT → ANALYSE → ALERT → PRIORITIZE → DEPLOY → RESCUE → UPDATE cycle

---

## 🎨 Design Highlights

- **Dark Theme**: Slate-900 background with glass morphism cards (backdrop blur, translucent overlays)
- **Color-Coded Priorities**: Consistent color language across all views
  - 🔴 P1/Critical: Red (#ef4444)
  - 🟠 P2/Warning: Orange (#f97316)
  - 🟡 P3/Medium: Yellow (#eab308)
  - 🟢 P4/Low: Green (#22c55e)
- **Real-time Animations**: Pulsing indicators, live sensor updates every 3 seconds
- **Responsive Layout**: Mobile-first design with adaptive grid layouts
- **Professional Iconography**: Lucide React icons throughout

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 16+ and **npm** 8+

### Installation

\`\`\`bash
# Navigate to project directory
cd C:/Users/tamil/Desktop/cit

# Install dependencies
npm install

# Start development server
npm run dev
\`\`\`

The application will launch at **http://localhost:3000**

### Build for Production

\`\`\`bash
# Create optimized production build
npm run build

# Preview production build
npm run preview
\`\`\`

---

## 📁 Project Structure

\`\`\`
cit/
├── public/
│   └── vite.svg                    # RESQAI logo
├── src/
│   ├── components/
│   │   └── Layout/
│   │       └── Layout.jsx          # Main layout with sidebar + header
│   ├── data/
│   │   └── mockData.js             # Mock data (areas, hospitals, teams, alerts)
│   ├── pages/
│   │   ├── Dashboard.jsx           # Main operations dashboard
│   │   ├── Alerts.jsx              # Alert management & communication
│   │   ├── MapView.jsx             # Area analysis with heatmap
│   │   ├── Hospitals.jsx           # Hospital & medical support
│   │   ├── Teams.jsx               # ResQ team deployment
│   │   └── Recommendations.jsx     # Measures & action checklist
│   ├── App.jsx                     # Router configuration
│   ├── main.jsx                    # App entry point
│   └── index.css                   # Tailwind + custom styles
├── index.html                      # HTML template
├── vite.config.js                  # Vite configuration
├── tailwind.config.js              # Tailwind theme customization
├── postcss.config.js               # PostCSS configuration
└── package.json                    # Dependencies & scripts
\`\`\`

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|-----------|
| **Frontend Framework** | React 18.3.1 |
| **Build Tool** | Vite 5.4.2 |
| **Styling** | Tailwind CSS 3.4.10 |
| **Routing** | React Router DOM 6.26.0 |
| **Charts** | Recharts 2.12.7 |
| **Icons** | Lucide React 0.441.0 |
| **Language** | JavaScript (ES6+) |

---

## 🎯 Key Components

### Dashboard
- **Stat Cards**: 4 KPI cards with animated gradients
- **Donut Chart**: Hazard distribution visualization (Recharts PieChart)
- **Area Chart**: Risk trend over time (Recharts AreaChart)
- **Sensor Panel**: Live updates with threshold progress bars

### Alerts
- **Tab System**: Public vs Controller alerts
- **Alert Cards**: Risk change visualization with approve/view actions
- **Sidebar**: Selected alert details with precautions & contacts

### Map View
- **SVG Heatmap**: Custom-built with radial gradients and pulse animations
- **Area Markers**: Color-coded by priority with population data
- **Info Panel**: Shows affected areas, damages, priority levels

### Hospitals
- **Stats Row**: 4 metrics (hospitals, beds, ambulances, emergency-ready)
- **Data Table**: Sortable with bed occupancy progress bars
- **Controller Note**: Privacy notice for sensitive medical data

### Teams
- **Team Cards**: 2-column grid showing 5 specialized units
- **Status Badges**: Deployed (green pulse) vs Standby (yellow)
- **Workflow Viz**: 3-step deployment process diagram

### Recommendations
- **Action Checklist**: Interactive checkboxes with priority badges
- **Progress Summary**: Completion tracking with progress bars
- **Continuous Loop**: 8-step cyclical process visualization

---

## 📊 Data Model

### Monitored Areas
Each area includes:
- Name, coordinates (lat/lng), population
- Risk percentage, priority level (P1-P4)
- Hazard breakdown (flood, cyclone, earthquake, volcanic)
- Previous risk for trend comparison

### Hospitals
Each hospital includes:
- Name, location, distance from controller
- Free beds, total beds, occupancy percentage
- Type (Multi-speciality, General, Super-speciality)
- Ambulance count, emergency readiness status

### ResQ Teams
Each team includes:
- Team ID (RESQ-01 through RESQ-05)
- Name (Alpha, Bravo, Charlie, Delta, Echo)
- Leader, member count, deployment status
- Assigned area, equipment list, vehicle type
- Deployment timestamp

### Alerts
Each alert includes:
- Type (critical, warning, info)
- Hazard type (flood, cyclone, earthquake, volcanic)
- Area, previous/current risk percentages
- Recommended actions, approval status
- Timestamp, public/controller visibility

---

## 🎨 Customization

### Color Palette
Edit `tailwind.config.js` to customize the color scheme:

\`\`\`javascript
colors: {
  resq: {
    primary: '#1a365d',    // Dark blue
    secondary: '#2b6cb0',  // Blue
    accent: '#ed8936',     // Orange
    danger: '#e53e3e',     // Red
    success: '#38a169',    // Green
    warning: '#d69e2e',    // Yellow
  }
}
\`\`\`

### Mock Data
Edit `src/data/mockData.js` to:
- Add/remove monitored areas
- Update hospital information
- Configure ResQ teams
- Modify alert templates

---

## 🔒 Security Considerations

- **Controller-Only Data**: Hospital bed availability is marked as sensitive
- **Role-Based Views**: Public alerts vs controller-specific notifications
- **Data Privacy**: No personally identifiable information in public displays

---

## 🚧 Future Enhancements

- [ ] Real API integration (replace mock data)
- [ ] WebSocket for true real-time updates
- [ ] User authentication & role-based access control
- [ ] Historical data analytics & reporting
- [ ] Mobile app (React Native)
- [ ] SMS/Email alert notifications
- [ ] GIS integration with live satellite imagery
- [ ] Predictive AI models for risk forecasting
- [ ] Multi-language support (Tamil, Hindi, English)

---

## 📄 License

This project is developed as an emergency management system demonstration. For production deployment, ensure compliance with local data privacy and emergency response regulations.

---

## 🤝 Contributing

Built with ❤️ for emergency response operations. The system is designed to save lives through timely information, coordinated response, and data-driven decision-making.

---

## 📞 Emergency Contacts

- **Emergency**: 112
- **Ambulance**: 108
- **Disaster Helpline**: 1077
- **Flood Control**: 1070

---

**Note**: This is a demonstration system. For actual emergency operations, integrate with official meteorological, seismological, and disaster management authority data sources.
