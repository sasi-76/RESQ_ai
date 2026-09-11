// ========== HAZARD TYPES ==========
export const HAZARD_TYPES = {
  FLOOD: { id: 'flood', label: 'Flood', color: '#3b82f6', icon: '🌊' },
  CYCLONE: { id: 'cyclone', label: 'Cyclone', color: '#8b5cf6', icon: '🌀' },
  EARTHQUAKE: { id: 'earthquake', label: 'Earthquake', color: '#f59e0b', icon: '🌍' },
  VOLCANIC: { id: 'volcanic', label: 'Volcanic', color: '#ef4444', icon: '🌋' },
};

// ========== MONITORED AREAS ==========
export const monitoredAreas = [
  {
    id: 1,
    name: 'Cuddalore',
    lat: 11.755, // Adjusted: ~0.8 km north of hospital
    lng: 79.775, // Adjusted: ~0.7 km east of hospital
    riskPercent: 76,
    priority: 'P1',
    population: 173676,
    hazards: { flood: 76, cyclone: 32, earthquake: 5, volcanic: 0 },
    status: 'critical',
    previousRisk: 58,
  },
  {
    id: 2,
    name: 'Chidambaram',
    lat: 11.415, // Adjusted: ~2 km north of hospital
    lng: 79.705, // Adjusted: ~1.5 km east of hospital
    riskPercent: 58,
    priority: 'P2',
    population: 62153,
    hazards: { flood: 58, cyclone: 28, earthquake: 8, volcanic: 0 },
    status: 'high',
    previousRisk: 45,
  },
  {
    id: 3,
    name: 'Panruti',
    lat: 11.775,
    lng: 79.552,
    riskPercent: 42,
    priority: 'P3',
    population: 50921,
    hazards: { flood: 42, cyclone: 18, earthquake: 6, volcanic: 0 },
    status: 'medium',
    previousRisk: 38,
  },
  {
    id: 4,
    name: 'Virudhachalam',
    lat: 11.523,
    lng: 79.322,
    riskPercent: 28,
    priority: 'P4',
    population: 68076,
    hazards: { flood: 28, cyclone: 12, earthquake: 4, volcanic: 0 },
    status: 'low',
    previousRisk: 22,
  },
  {
    id: 5,
    name: 'Kattumannarkoil',
    lat: 11.275,
    lng: 79.628,
    riskPercent: 35,
    priority: 'P3',
    population: 23456,
    hazards: { flood: 35, cyclone: 15, earthquake: 3, volcanic: 0 },
    status: 'medium',
    previousRisk: 30,
  },
  {
    id: 6,
    name: 'Kurinjipadi',
    lat: 11.619,
    lng: 79.641,
    riskPercent: 48,
    priority: 'P2',
    population: 34890,
    hazards: { flood: 48, cyclone: 22, earthquake: 5, volcanic: 0 },
    status: 'high',
    previousRisk: 40,
  },
];

// ========== HAZARD RISK OVERVIEW (for donut chart) ==========
export const hazardRiskOverview = [
  { name: 'Flood', value: 76, color: '#3b82f6' },
  { name: 'Cyclone', value: 32, color: '#8b5cf6' },
  { name: 'Earthquake', value: 18, color: '#f59e0b' },
  { name: 'Volcanic', value: 12, color: '#ef4444' },
];

// ========== CHANGE TREND DATA ==========
export const changeTrendData = [
  { time: '00:00', risk: 35, flood: 30, cyclone: 18, earthquake: 8 },
  { time: '04:00', risk: 38, flood: 34, cyclone: 20, earthquake: 8 },
  { time: '08:00', risk: 42, flood: 40, cyclone: 22, earthquake: 10 },
  { time: '12:00', risk: 55, flood: 52, cyclone: 25, earthquake: 12 },
  { time: '16:00', risk: 62, flood: 60, cyclone: 28, earthquake: 14 },
  { time: '20:00', risk: 70, flood: 68, cyclone: 30, earthquake: 16 },
  { time: 'Now', risk: 76, flood: 76, cyclone: 32, earthquake: 18 },
];

// ========== HOSPITALS ==========
export const hospitals = [
  {
    id: 1,
    name: 'Cuddalore Govt. Hospital',
    lat: 11.748,
    lng: 79.768,
    freeBeds: 85,
    totalBeds: 350,
    type: 'Multi-speciality',
    distance: 2.5,
    emergency: true,
    ambulances: 6,
    status: 'operational',
  },
  {
    id: 2,
    name: 'Chidambaram GH',
    lat: 11.399,
    lng: 79.691,
    freeBeds: 62,
    totalBeds: 200,
    type: '200 beds',
    distance: 28,
    emergency: true,
    ambulances: 4,
    status: 'operational',
  },
  {
    id: 3,
    name: 'Panruti Hospital',
    lat: 11.775,
    lng: 79.552,
    freeBeds: 40,
    totalBeds: 100,
    type: 'General',
    distance: 22,
    emergency: true,
    ambulances: 2,
    status: 'operational',
  },
  {
    id: 4,
    name: 'Virudhachalam GH',
    lat: 11.523,
    lng: 79.322,
    freeBeds: 55,
    totalBeds: 150,
    type: '150 beds',
    distance: 45,
    emergency: true,
    ambulances: 3,
    status: 'operational',
  },
  {
    id: 5,
    name: 'RGGGH Chennai',
    lat: 13.078,
    lng: 80.275,
    freeBeds: 120,
    totalBeds: 800,
    type: 'Super-speciality',
    distance: 185,
    emergency: true,
    ambulances: 12,
    status: 'operational',
  },
];

// ========== RESQ TEAMS ==========
export const resqTeams = [
  {
    id: 'RESQ-01',
    name: 'Alpha Response Unit',
    members: 12,
    status: 'deployed',
    assignedArea: 'Cuddalore',
    equipment: ['Rescue Boats', 'Medical Kit', 'Communication Gear'],
    deployedAt: '2026-09-11T08:30:00',
    leader: 'Captain Rajesh Kumar',
    vehicle: 'RESQ Vehicle + 2 Boats',
  },
  {
    id: 'RESQ-02',
    name: 'Bravo Medical Team',
    members: 8,
    status: 'deployed',
    assignedArea: 'Chidambaram',
    equipment: ['Ambulance', 'Medical Kit', 'Stretchers'],
    deployedAt: '2026-09-11T09:15:00',
    leader: 'Dr. Priya Sharma',
    vehicle: '2 Ambulances',
  },
  {
    id: 'RESQ-03',
    name: 'Charlie Search Unit',
    members: 10,
    status: 'deployed',
    assignedArea: 'Cuddalore',
    equipment: ['Search Dogs', 'Thermal Camera', 'Rescue Gear'],
    deployedAt: '2026-09-11T10:00:00',
    leader: 'Lt. Arjun Mehta',
    vehicle: 'RESQ Vehicle',
  },
  {
    id: 'RESQ-04',
    name: 'Delta Relief Squad',
    members: 15,
    status: 'standby',
    assignedArea: null,
    equipment: ['Relief Supplies', 'Tents', 'Water Purifier'],
    deployedAt: null,
    leader: 'Sgt. Deepa Nair',
    vehicle: '3 Trucks',
  },
  {
    id: 'RESQ-05',
    name: 'Echo Aerial Unit',
    members: 6,
    status: 'standby',
    assignedArea: null,
    equipment: ['Drones', 'Aerial Camera', 'Communication Relay'],
    deployedAt: null,
    leader: 'Cpt. Vikram Singh',
    vehicle: 'Drone Fleet',
  },
];

// ========== ALERTS ==========
export const alerts = [
  {
    id: 1,
    type: 'critical',
    hazard: 'flood',
    title: 'Flood risk increased in Cuddalore',
    message: 'Flood risk increased to 76%. Move away from low-lying areas. Take precautions.',
    area: 'Cuddalore',
    previousRisk: 58,
    currentRisk: 76,
    change: '+18%',
    timestamp: '2026-09-11T12:45:00',
    isPublic: true,
    actions: [
      'Send public warning',
      'Deploy 3 RESQ teams',
      'Alert nearby authorities',
      'Prepare 2 hospitals',
      'Open 1 shelter',
    ],
    approved: false,
  },
  {
    id: 2,
    type: 'warning',
    hazard: 'cyclone',
    title: 'Cyclone risk elevated in Chidambaram',
    message: 'Cyclone probability increased to 28%. Monitor wind patterns.',
    area: 'Chidambaram',
    previousRisk: 20,
    currentRisk: 28,
    change: '+8%',
    timestamp: '2026-09-11T11:30:00',
    isPublic: false,
    actions: [
      'Issue wind advisory',
      'Alert coastal communities',
      'Deploy 1 RESQ team on standby',
    ],
    approved: true,
  },
  {
    id: 3,
    type: 'info',
    hazard: 'flood',
    title: 'Water level rising in Kurinjipadi',
    message: 'River level rising steadily. Currently at 48% risk threshold.',
    area: 'Kurinjipadi',
    previousRisk: 40,
    currentRisk: 48,
    change: '+8%',
    timestamp: '2026-09-11T10:15:00',
    isPublic: false,
    actions: ['Continue monitoring', 'Prepare evacuation routes'],
    approved: true,
  },
  {
    id: 4,
    type: 'critical',
    hazard: 'flood',
    title: 'Dam overflow warning - Veeranam Lake',
    message: 'Water level at 94% capacity. Potential overflow in 6 hours.',
    area: 'Cuddalore',
    previousRisk: 70,
    currentRisk: 82,
    change: '+12%',
    timestamp: '2026-09-11T13:00:00',
    isPublic: true,
    actions: [
      'Evacuate downstream areas',
      'Open sluice gates',
      'Deploy all available teams',
      'Activate emergency shelters',
    ],
    approved: false,
  },
];

// ========== EMERGENCY CONTACTS ==========
export const emergencyContacts = [
  { number: '112', label: 'Emergency' },
  { number: '108', label: 'Ambulance' },
  { number: '1077', label: 'Disaster Helpline' },
  { number: '1070', label: 'Flood Control' },
];

// ========== PRECAUTIONS ==========
export const precautions = [
  'Avoid flooded areas',
  'Keep important documents safe & dry',
  'Follow official updates from authorities',
  'Stock emergency food and water supplies',
  'Keep first aid kit ready',
  'Charge all communication devices',
];

// ========== SENSOR DATA (simulated real-time) ==========
export const sensorData = {
  rainfall: { value: 145.2, unit: 'mm', trend: 'rising', threshold: 200 },
  waterLevel: { value: 4.8, unit: 'm', trend: 'rising', threshold: 6.0 },
  windSpeed: { value: 65, unit: 'km/h', trend: 'stable', threshold: 100 },
  temperature: { value: 28.5, unit: '°C', trend: 'stable', threshold: null },
  humidity: { value: 92, unit: '%', trend: 'rising', threshold: null },
  seismicActivity: { value: 1.2, unit: 'Richter', trend: 'stable', threshold: 4.0 },
};

// ========== RECOMMENDATIONS FOR AUTHORITIES ==========
export const recommendations = [
  {
    id: 1,
    category: 'Public Warning',
    action: 'Issue public warnings (with message templates)',
    priority: 'immediate',
    status: 'pending',
    details: 'Send SMS, TV, radio alerts to all residents in Cuddalore district',
  },
  {
    id: 2,
    category: 'Team Deployment',
    action: 'Deploy RESQ teams (with vehicles & equipment)',
    priority: 'immediate',
    status: 'in-progress',
    details: 'Deploy 3 teams to Cuddalore, 1 to Chidambaram',
  },
  {
    id: 3,
    category: 'Medical Prep',
    action: 'Prepare hospitals (with medical supplies)',
    priority: 'high',
    status: 'in-progress',
    details: 'Alert Cuddalore Govt Hospital and Chidambaram GH for mass casualty prep',
  },
  {
    id: 4,
    category: 'Shelter',
    action: 'Open shelters (with food & water)',
    priority: 'high',
    status: 'pending',
    details: 'Activate 3 emergency shelters in Cuddalore area',
  },
  {
    id: 5,
    category: 'Coordination',
    action: 'Coordinate with local administration',
    priority: 'high',
    status: 'pending',
    details: 'Brief district collector and block-level officers',
  },
  {
    id: 6,
    category: 'Monitoring',
    action: 'Monitor and update every 30 minutes',
    priority: 'ongoing',
    status: 'active',
    details: 'Continuous monitoring of all sensor data and satellite feeds',
  },
];

// ========== DATA SOURCES ==========
export const dataSources = [
  { name: 'Meteorological Department', status: 'active', lastUpdate: '2 min ago' },
  { name: 'Geological Survey', status: 'active', lastUpdate: '5 min ago' },
  { name: 'Disaster Management Authority', status: 'active', lastUpdate: '1 min ago' },
  { name: 'Satellite & Sensor Data', status: 'active', lastUpdate: 'Real-time' },
  { name: 'River Gauge Network', status: 'active', lastUpdate: '30 sec ago' },
  { name: 'Weather Radar', status: 'active', lastUpdate: 'Real-time' },
];
