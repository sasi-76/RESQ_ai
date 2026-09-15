import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  MapPin,
  Users,
  Shield,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Activity,
  Droplets,
  Waves,
  Wind,
  Zap,
  Clock,
  Bell,
  AlertCircle,
  Info,
  Search,
  Compass,
  Crosshair,
  Building2,
  Ambulance,
  RefreshCw,
  ChevronRight,
  X,
  ShieldAlert,
  Send,
  Navigation,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import {
  monitoredAreas,
  hazardRiskOverview,
  changeTrendData,
  sensorData as initialSensorData,
  alerts as defaultAlerts,
  resqTeams,
} from '../data/mockData';
import { useApp } from '../context/AppContext';
import {
  searchLocations,
  calculateDistanceKm,
  calculateTransitEta,
} from '../services/locationService';
import { fetchRealtimeWeather } from '../services/weatherService';
import { fetchLiveEarthquakes } from '../services/liveDataService';

// ── Helpers ──────────────────────────────────────────────────────────────────

const priorityConfig = {
  P1: { color: 'bg-red-500/20 text-red-400 border border-red-500/40', bar: 'bg-red-500' },
  P2: { color: 'bg-orange-500/20 text-orange-400 border border-orange-500/40', bar: 'bg-orange-500' },
  P3: { color: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40', bar: 'bg-yellow-500' },
  P4: { color: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40', bar: 'bg-emerald-500' },
};

const alertBorderColor = {
  critical: 'border-l-red-500 bg-red-500/10',
  warning: 'border-l-amber-500 bg-amber-500/10',
  info: 'border-l-cyan-500 bg-cyan-500/10',
};

const alertIconMap = {
  critical: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const alertTextColor = {
  critical: 'text-red-400',
  warning: 'text-amber-400',
  info: 'text-cyan-400',
};

function formatTime(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  return d.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function sensorBarColor(pct) {
  if (pct >= 75) return 'bg-red-500';
  if (pct >= 50) return 'bg-amber-500';
  return 'bg-cyan-500';
}

function PieTooltipContent({ active, payload }) {
  if (!active || !payload?.length) return null;
  const { name, value, color } = payload[0].payload;
  return (
    <div className="rounded-xl bg-slate-900 border border-slate-700 px-3.5 py-2 shadow-2xl text-xs backdrop-blur-md">
      <span className="inline-block w-2.5 h-2.5 rounded-full mr-2" style={{ background: color }} />
      <span className="text-slate-200 font-semibold">{name}</span>
      <span className="ml-2 text-cyan-300 font-bold">{value}%</span>
    </div>
  );
}

function AreaTooltipContent({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl bg-slate-900 border border-slate-700 px-3.5 py-2.5 shadow-2xl text-xs backdrop-blur-md">
      <p className="text-slate-400 mb-1 font-mono">{label}</p>
      <p className="text-white font-bold text-sm">
        Composite Risk: <span className="text-red-400">{payload[0].value}%</span>
      </p>
    </div>
  );
}

// =============================================================================
// ── Dashboard Component ─────────────────────────────────────────────────────
// =============================================================================

export default function Dashboard() {
  const {
    userLocation,
    isDetectingLocation,
    selectedSearchLocation,
    isLiveTracking,
    setIsLiveTracking,
    detectUserLocation,
    setSearchLocation,
    disasters,
    teams,
    hospitals,
    dams,
    alerts: contextAlerts,
    monitoredAreas: contextAreas,
    getStats,
    showNotification,
    autoDeployTeam,
  } = useApp();

  const stats = getStats();

  // ── Live Digital Clock ────────────────────────────────────────────────────
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // ── Search State ──────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);
  const searchContainerRef = useRef(null);

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setSearchDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSearchResults([]);
      setSearchDropdownOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchLocations(searchQuery);
        setSearchResults(results);
        setSearchDropdownOpen(results.length > 0);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectLocation = (loc) => {
    setSearchQuery(loc.name);
    setSearchDropdownOpen(false);
    setSearchLocation(loc);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSearchDropdownOpen(false);
    setSearchLocation(null);
  };

  const quickCities = ['Chennai', 'Cuddalore', 'Madurai', 'Coimbatore', 'Salem', 'Trichy'];

  // ── Sensors & Weather ─────────────────────────────────────────────────────
  const [sensors, setSensors] = useState({
    rainfall: { ...initialSensorData.rainfall, value: 0 },
    waterLevel: { ...initialSensorData.waterLevel, value: 1.5 },
    windSpeed: { ...initialSensorData.windSpeed },
    seismic: {
      value: 0.0,
      unit: initialSensorData.seismicActivity.unit,
      trend: 'stable',
      threshold: initialSensorData.seismicActivity.threshold,
    },
  });

  const activeOrigin = selectedSearchLocation || userLocation;
  const nearestHospital = hospitals[0] || null;

  // Real weather fetch
  useEffect(() => {
    if (!activeOrigin?.lat || !activeOrigin?.lng) return;
    fetchRealtimeWeather(activeOrigin.lat, activeOrigin.lng, activeOrigin.name)
      .then((w) => {
        if (w) {
          setSensors((prev) => ({
            ...prev,
            rainfall: {
              ...prev.rainfall,
              value: parseFloat(w.precipitationMm) || 0,
              trend: parseFloat(w.precipitationMm) > 0 ? 'rising' : 'stable',
            },
            windSpeed: {
              ...prev.windSpeed,
              value: w.windSpeed != null ? w.windSpeed : prev.windSpeed.value,
            },
          }));
        }
      })
      .catch(console.error);
  }, [activeOrigin?.lat, activeOrigin?.lng, activeOrigin?.name]);

  // Live Earthquakes
  useEffect(() => {
    fetchLiveEarthquakes()
      .then((eqs) => {
        if (eqs && eqs.length > 0) {
          const maxMag = Math.max(...eqs.map((e) => e.magnitude));
          setSensors((prev) => ({
            ...prev,
            seismic: {
              ...prev.seismic,
              value: maxMag,
              trend: maxMag > 3.0 ? 'rising' : 'stable',
            },
          }));
        }
      })
      .catch(console.error);
  }, []);

  // ── Counts ─────────────────────────────────────────────────────────────────
  const activeHazards =
    disasters.length > 0 ? disasters.length : hazardRiskOverview.filter((h) => h.value > 10).length;
  const criticalHazards = disasters.filter((d) => d.severity === 'critical').length;
  const deployedTeams = teams.filter((t) => t.status === 'deployed').length;
  const currentRiskPercent = stats.overallRiskPercent || 76;

  // ── Stat Cards ─────────────────────────────────────────────────────────────
  const statCards = [
    {
      label: 'Overall Threat Index',
      value: `${currentRiskPercent}%`,
      icon: ShieldAlert,
      gradient: 'from-rose-500 to-red-600',
      glow: 'shadow-red-500/20 border-red-500/30',
      subtext: currentRiskPercent >= 75 ? 'DEFCON 2: CRITICAL SURVEILLANCE' : 'DEFCON 3: ELEVATED ALERT',
      trend: disasters.length > 0 ? `${disasters.length} active emergency` : 'Multi-sensor baseline',
      trendUp: true,
    },
    {
      label: 'Active Incident Hazards',
      value: activeHazards,
      icon: AlertTriangle,
      gradient: 'from-amber-500 to-orange-600',
      glow: 'shadow-amber-500/20 border-amber-500/30',
      subtext: `${criticalHazards} Critical Priority Zones`,
      trend: disasters.length > 0 ? '+ Live Sensor Alarms' : 'Patrols Active',
      trendUp: disasters.length > 0,
    },
    {
      label: 'Field Rescue Units',
      value: `${deployedTeams} / ${teams.length}`,
      icon: Users,
      gradient: 'from-purple-500 to-indigo-600',
      glow: 'shadow-purple-500/20 border-purple-500/30',
      subtext: `${stats.availableTeams || 0} squads on standby`,
      trend: deployedTeams > 0 ? `${deployedTeams} active deployment(s)` : 'All squads ready',
      trendUp: deployedTeams > 0,
    },
    {
      label: 'Nearest Trauma Facility',
      value: nearestHospital ? `${nearestHospital.distance} km` : '2.5 km',
      icon: Building2,
      gradient: 'from-emerald-500 to-teal-600',
      glow: 'shadow-emerald-500/20 border-emerald-500/30',
      subtext: nearestHospital ? nearestHospital.name : 'Cuddalore GH',
      trend: `ETA: ${nearestHospital ? nearestHospital.transitEta : '6 mins'} • ${nearestHospital ? nearestHospital.ambulances : 4} Ambulances`,
      trendUp: false,
    },
  ];

  // ── Sensors Quad ───────────────────────────────────────────────────────────
  const sensorDisplays = [
    {
      key: 'rainfall',
      label: 'Rainfall Intensity',
      icon: Droplets,
      iconColor: 'text-cyan-400',
      data: sensors.rainfall,
    },
    {
      key: 'waterLevel',
      label: 'River / Flood Crest',
      icon: Waves,
      iconColor: 'text-blue-400',
      data: sensors.waterLevel,
    },
    {
      key: 'windSpeed',
      label: 'Gale Wind Velocity',
      icon: Wind,
      iconColor: 'text-teal-400',
      data: sensors.windSpeed,
    },
    {
      key: 'seismic',
      label: 'Seismic Richter Scale',
      icon: Zap,
      iconColor: 'text-amber-400',
      data: sensors.seismic,
    },
  ];

  // ── Recent Alerts ──────────────────────────────────────────────────────────
  const recentAlerts = [...(contextAlerts && contextAlerts.length > 0 ? contextAlerts : defaultAlerts)]
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 4);

  // ── Areas ──────────────────────────────────────────────────────────────────
  const sortedAreas = [...(contextAreas && contextAreas.length > 0 ? contextAreas : monitoredAreas)]
    .sort((a, b) => b.riskPercent - a.riskPercent);

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in pb-12">
      
      {/* ── Top Tactical HUD Header ────────────────────────────────────────── */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="relative flex h-3.5 w-3.5 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-emerald-500 shadow-md shadow-emerald-500/50" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs sm:text-sm font-black tracking-widest text-emerald-400 uppercase font-mono">
                RESQAI TACTICAL OPERATIONS COMMAND
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                DEFCON 2 • ACTIVE
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Tamil Nadu Multi-Hazard Surveillance &amp; Rapid Emergency Dispatch Center
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Live digital clock */}
          <div className="flex items-center gap-2 bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800 font-mono text-xs text-slate-200">
            <Clock className="h-4 w-4 text-cyan-400" />
            <span className="font-bold">
              {currentTime.toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true,
              })}
            </span>
            <span className="text-slate-500 font-semibold">IST</span>
          </div>

          <Link
            to="/map"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-cyan-500/20 active:scale-95"
          >
            <Compass className="h-4 w-4" />
            <span>Open Tactical Map</span>
          </Link>
        </div>
      </div>

      {/* ── Command Origin & Location Search Console ───────────────────────── */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
          
          {/* Active Sector Display */}
          <div className="lg:col-span-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-1.5">
                <Crosshair className="h-4 w-4 text-cyan-400" /> Command Sector Locked:
              </span>
              <button
                onClick={detectUserLocation}
                disabled={isDetectingLocation}
                className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
                title="Refresh hardware GPS coordinates"
              >
                <RefreshCw className={`h-3 w-3 ${isDetectingLocation ? 'animate-spin' : ''}`} />
                <span>Locate Me (GPS)</span>
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-cyan-400 shrink-0" />
                  <span className="font-bold text-white text-sm truncate">
                    {activeOrigin.name || 'Detecting GPS Sector...'}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                  <span>Coordinates: <strong className="text-slate-200">{activeOrigin.lat?.toFixed(4)}, {activeOrigin.lng?.toFixed(4)}</strong></span>
                  {activeOrigin.accuracy && <span>• ±{Math.round(activeOrigin.accuracy)}m</span>}
                </div>
              </div>

              {selectedSearchLocation && (
                <button
                  onClick={handleClearSearch}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 hover:text-white shrink-0 transition-colors"
                >
                  Reset GPS
                </button>
              )}
            </div>
          </div>

          {/* Location Search Bar */}
          <div className="lg:col-span-7 space-y-2" ref={searchContainerRef}>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-1.5">
              <Search className="h-4 w-4 text-cyan-400" /> Search Any Area in Tamil Nadu:
            </span>

            <div className="relative">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => {
                    if (searchResults.length > 0) setSearchDropdownOpen(true);
                  }}
                  placeholder="Search any town, neighborhood, city or district (e.g. Cuddalore, Velachery, Madurai)..."
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 px-4 py-3 pl-10 pr-10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-all shadow-inner"
                />
                <Search className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                {isSearching && (
                  <RefreshCw className="absolute right-3.5 h-4 w-4 text-cyan-400 animate-spin" />
                )}
                {!isSearching && searchQuery && (
                  <button
                    onClick={handleClearSearch}
                    className="absolute right-3.5 text-slate-400 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Suggestions Dropdown */}
              {searchDropdownOpen && searchResults.length > 0 && (
                <div className="absolute z-50 left-0 right-0 mt-1.5 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden divide-y divide-slate-800 max-h-60 overflow-y-auto">
                  {searchResults.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleSelectLocation(item)}
                      className="w-full px-4 py-2.5 text-left hover:bg-slate-800 flex items-center justify-between gap-3 text-xs transition-colors"
                    >
                      <div className="truncate">
                        <p className="font-bold text-white truncate">{item.name}</p>
                        <p className="text-[11px] text-slate-400 truncate">{item.city || item.district}</p>
                      </div>
                      <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded shrink-0">
                        Focus Area
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quick City Chips */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-xs text-slate-500 mr-1">Quick:</span>
              {quickCities.map((city) => (
                <button
                  key={city}
                  onClick={() => {
                    setSearchQuery(city);
                    searchLocations(city).then((res) => {
                      if (res?.[0]) handleSelectLocation(res[0]);
                    });
                  }}
                  className="px-2.5 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 hover:text-white transition-colors border border-slate-700/60"
                >
                  {city}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── 4 Key Metric KPI Cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className={`p-5 rounded-2xl bg-slate-900/90 border shadow-lg flex items-start gap-4 transition-all ${card.glow}`}
            >
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${card.gradient} shadow-md`}
              >
                <Icon className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide font-mono">
                  {card.label}
                </p>
                <p className="text-2xl font-black text-white mt-0.5 truncate tracking-tight">{card.value}</p>
                <p className="text-xs font-semibold text-slate-300 truncate mt-0.5">
                  {card.subtext}
                </p>
                <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-400">
                  {card.trendUp === true && <TrendingUp className="h-3.5 w-3.5 text-red-400 shrink-0" />}
                  {card.trendUp === false && <Activity className="h-3.5 w-3.5 text-emerald-400 shrink-0" />}
                  <span className="truncate font-medium">{card.trend}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Statewide Reservoir Water Levels Telemetry (1-Hour WRD Feed) ───── */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <Waves className="h-5 w-5 text-cyan-400" />
                Statewide Major Reservoir &amp; Dam Telemetry
              </h3>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                1-HR WRD FEED
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Real-time official government bulletin records • Inflow, spillway discharge, and downstream flood transit
            </p>
          </div>

          <Link
            to="/dams"
            className="px-3.5 py-1.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-300 hover:text-white border border-cyan-500/40 text-xs font-bold flex items-center gap-1.5 transition-all self-start sm:self-center shrink-0"
          >
            <span>Full Dam Operations Center</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* 4 Featured Reservoir Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {(dams || []).slice(0, 4).map((dam) => {
            const fillPct = ((dam.currentLevelFt / dam.frlFt) * 100).toFixed(1);
            const isHigh = dam.status === 'HIGH_ALERT' || dam.status === 'CRITICAL_SURGE';

            return (
              <div
                key={dam.id}
                className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-bold text-white text-sm truncate">{dam.shortName} Dam</span>
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                        isHigh ? 'bg-red-500/20 text-red-300 border border-red-500/40' : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      }`}
                    >
                      {fillPct}% FRL
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 truncate">{dam.river} River • {dam.district}</p>

                  <div className="w-full bg-slate-800 rounded-full h-2 mt-2.5 overflow-hidden">
                    <div
                      className={`h-2 rounded-full ${isHigh ? 'bg-red-500' : 'bg-cyan-500'}`}
                      style={{ width: `${Math.min(Number(fillPct), 100)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-300 mt-2.5">
                    <span>Level: <strong className="text-white">{dam.currentLevelFt}</strong> / {dam.frlFt} ft</span>
                    <span>Outflow: <strong className={isHigh ? 'text-red-400' : 'text-orange-400'}>{dam.outflowCusecs.toLocaleString()}</strong> cusecs</span>
                  </div>
                </div>

                {dam.transitSchedule?.[0] && (
                  <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                    <span className="truncate">➔ {dam.transitSchedule[0].location}</span>
                    <span className="font-mono text-orange-400 font-bold shrink-0">ETA ~{dam.transitSchedule[0].peakEta}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Multi-Sensor Live Telemetry Quad ───────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {sensorDisplays.map((sensor) => {
          const Icon = sensor.icon;
          const val = sensor.data?.value || 0;
          const thresh = sensor.data?.threshold || 100;
          const pct = Math.min(Math.round((val / thresh) * 100), 100);

          return (
            <div
              key={sensor.key}
              className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 shadow-md space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                  <Icon className={`h-4 w-4 ${sensor.iconColor}`} />
                  {sensor.label}
                </span>
                <span className="text-xs font-mono font-bold text-slate-300">
                  {val} {sensor.data?.unit}
                </span>
              </div>

              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-1.5 rounded-full transition-all duration-500 ${sensorBarColor(pct)}`}
                  style={{ width: `${pct}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Safe Threshold: {thresh} {sensor.data?.unit}</span>
                <span className="font-bold text-slate-300">{pct}%</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Visual Analytics & Temporal Trends (Charts) ────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Hazard Risk Distribution */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wide flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-cyan-400" />
              Hazard Threat Distribution
            </h3>
            <span className="text-xs font-mono text-slate-400">Multi-Hazard AI</span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={hazardRiskOverview}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {hazardRiskOverview.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltipContent />} />
                <Legend
                  formatter={(value) => <span className="text-xs text-slate-300 font-medium">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 24-Hour Composite Risk Trend */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wide flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-red-400" />
              Composite Risk Trend (24 Hours)
            </h3>
            <span className="text-xs font-mono text-emerald-400">Predictive Modeling</span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={changeTrendData}>
                <defs>
                  <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis dataKey="time" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} domain={[0, 100]} />
                <Tooltip content={<AreaTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="risk"
                  stroke="#ef4444"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#riskGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Monitored Priority Zones Table ─────────────────────────────────── */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <MapPin className="h-5 w-5 text-cyan-400" />
              Monitored Vulnerable Sectors
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Live automated surveillance rankings based on population, sensor levels &amp; historical inundation
            </p>
          </div>

          <span className="text-xs text-slate-400 font-mono">
            {sortedAreas.length} Areas Tracked
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase font-mono">
                <th className="pb-3 font-semibold">Priority</th>
                <th className="pb-3 font-semibold">Area / Sector</th>
                <th className="pb-3 font-semibold">Primary Hazard</th>
                <th className="pb-3 font-semibold">Risk Index</th>
                <th className="pb-3 font-semibold">Population</th>
                <th className="pb-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {sortedAreas.map((area) => {
                const conf = priorityConfig[area.priority] || priorityConfig.P3;
                return (
                  <tr key={area.name} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${conf.color}`}>
                        {area.priority}
                      </span>
                    </td>
                    <td className="py-3 font-bold text-white">
                      {area.name}
                    </td>
                    <td className="py-3 text-slate-300">
                      {area.primaryHazard}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-1.5 rounded-full ${conf.bar}`}
                            style={{ width: `${area.riskPercent}%` }}
                          />
                        </div>
                        <span className="font-bold text-white">{area.riskPercent}%</span>
                      </div>
                    </td>
                    <td className="py-3 text-slate-300 font-mono">
                      {area.population?.toLocaleString() || '15,000'}
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => {
                          autoDeployTeam({
                            areaName: area.name,
                            type: area.primaryHazard,
                            severity: area.priority === 'P1' ? 'critical' : 'high',
                            lat: area.lat,
                            lng: area.lng,
                          });
                        }}
                        className="px-2.5 py-1 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-300 hover:text-white border border-cyan-500/30 text-xs font-bold transition-all"
                      >
                        Deploy Squad
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Bottom Deck : Recent Alerts & Active Squads ────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Recent Alerts */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <Bell className="h-5 w-5 text-amber-400" />
              Active System Emergency Alerts
            </h3>
            <Link to="/alerts" className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
              <span>View All</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {recentAlerts.map((alert) => {
              const borderClass = alertBorderColor[alert.severity] || alertBorderColor.warning;
              const textClass = alertTextColor[alert.severity] || alertTextColor.warning;
              const Icon = alertIconMap[alert.severity] || AlertTriangle;

              return (
                <div
                  key={alert.id}
                  className={`p-3.5 rounded-xl border border-slate-800 border-l-4 ${borderClass} flex items-start gap-3`}
                >
                  <Icon className={`h-4 w-4 shrink-0 mt-0.5 ${textClass}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-white text-xs truncate">
                        {alert.area || alert.title}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400 shrink-0">
                        {formatTime(alert.timestamp)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      {alert.message}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ResQ Field Teams Standby & Deployments */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-400" />
              Rescue Units (NDRF / SDRF / Quick Response)
            </h3>
            <Link to="/teams" className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
              <span>Manage Teams</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {teams.slice(0, 4).map((team) => {
              const isDeployed = team.status === 'deployed';
              return (
                <div
                  key={team.id}
                  className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-xs">{team.name}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          isDeployed
                            ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        {isDeployed ? 'Deployed' : 'Standby'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {team.members} Personnel • {team.location || 'Command Base'} • {team.specialization || 'Flood Rescue'}
                    </p>
                  </div>

                  <span className="text-xs font-mono font-bold text-slate-300">
                    {team.id}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
}
