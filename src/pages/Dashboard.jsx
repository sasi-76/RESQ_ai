import { useState, useEffect } from 'react';
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
  alerts,
  resqTeams,
} from '../data/mockData';
import LiveDataDashboard from '../components/LiveDataDashboard';
import ResourceTracker from '../components/ResourceTracker';
import { useApp } from '../context/AppContext';

// ── Helpers ──────────────────────────────────────────────────────────────────

const priorityConfig = {
  P1: { color: 'bg-red-500/20 text-red-400 border-red-500/30', bar: 'bg-red-500' },
  P2: { color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', bar: 'bg-orange-500' },
  P3: { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', bar: 'bg-yellow-500' },
  P4: { color: 'bg-green-500/20 text-green-400 border-green-500/30', bar: 'bg-green-500' },
};

const alertBorderColor = {
  critical: 'border-l-red-500',
  warning: 'border-l-yellow-500',
  info: 'border-l-blue-500',
};

const alertIconMap = {
  critical: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const alertTextColor = {
  critical: 'text-red-400',
  warning: 'text-yellow-400',
  info: 'text-blue-400',
};

function formatTime(isoString) {
  const d = new Date(isoString);
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function sensorBarColor(pct) {
  if (pct >= 75) return 'bg-red-500';
  if (pct >= 50) return 'bg-yellow-500';
  return 'bg-green-500';
}

// ── Custom Recharts Tooltips ─────────────────────────────────────────────────

function PieTooltipContent({ active, payload }) {
  if (!active || !payload?.length) return null;
  const { name, value, color } = payload[0].payload;
  return (
    <div className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 shadow-xl text-xs">
      <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ background: color }} />
      <span className="text-slate-200 font-medium">{name}</span>
      <span className="ml-2 text-white font-bold">{value}%</span>
    </div>
  );
}

function AreaTooltipContent({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 shadow-xl text-xs">
      <p className="text-slate-400 mb-1">{label}</p>
      <p className="text-white font-bold">Risk: {payload[0].value}%</p>
    </div>
  );
}

// ── Custom Pie Center Label ──────────────────────────────────────────────────

function CenterLabel({ viewBox }) {
  if (!viewBox || !viewBox.cx || !viewBox.cy) return null;
  const { cx, cy } = viewBox;
  return (
    <g>
      <text x={cx} y={cy - 6} textAnchor="middle" className="fill-white text-lg font-bold">
        100 km
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle" className="fill-slate-400 text-[11px]">
        Monitoring Radius
      </text>
    </g>
  );
}

// ── Custom Pie Legend ────────────────────────────────────────────────────────

function CustomPieLegend({ payload }) {
  return (
    <div className="flex flex-wrap justify-center gap-x-5 gap-y-1 mt-2">
      {payload.map((entry) => (
        <div key={entry.value} className="flex items-center gap-1.5 text-xs text-slate-300">
          <span
            className="inline-block w-2.5 h-2.5 rounded-full"
            style={{ background: entry.color }}
          />
          {entry.value}
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// ── Dashboard Component ─────────────────────────────────────────────────────
// =============================================================================

function Dashboard() {
  // ── Simulated real-time sensor data ────────────────────────────────────────
  const [sensors, setSensors] = useState({
    rainfall: { ...initialSensorData.rainfall },
    waterLevel: { ...initialSensorData.waterLevel },
    windSpeed: { ...initialSensorData.windSpeed },
    seismic: {
      value: initialSensorData.seismicActivity.value,
      unit: initialSensorData.seismicActivity.unit,
      trend: initialSensorData.seismicActivity.trend,
      threshold: initialSensorData.seismicActivity.threshold,
    },
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setSensors((prev) => {
        const clamp = (val, min, max) => Math.max(min, Math.min(max, val));
        return {
          rainfall: {
            ...prev.rainfall,
            value: clamp(
              Math.round((prev.rainfall.value + (Math.random() * 4 - 1.5)) * 10) / 10,
              120, 195
            ),
          },
          waterLevel: {
            ...prev.waterLevel,
            value: clamp(
              Math.round((prev.waterLevel.value + (Math.random() * 0.3 - 0.1)) * 10) / 10,
              3.5, 5.8
            ),
          },
          windSpeed: {
            ...prev.windSpeed,
            value: clamp(
              Math.round(prev.windSpeed.value + (Math.random() * 6 - 3)),
              45, 95
            ),
          },
          seismic: {
            ...prev.seismic,
            value: clamp(
              Math.round((prev.seismic.value + (Math.random() * 0.2 - 0.1)) * 10) / 10,
              0.5, 3.5
            ),
          },
        };
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // ── Derived counts ─────────────────────────────────────────────────────────
  const activeHazards = hazardRiskOverview.filter((h) => h.value > 10).length;
  const areasCount = monitoredAreas.length;
  const deployedTeams = resqTeams.filter((t) => t.status === 'deployed').length;

  // ── Stat cards config ──────────────────────────────────────────────────────
  const statCards = [
    {
      label: 'Active Hazards',
      value: activeHazards,
      icon: AlertTriangle,
      gradient: 'from-red-500 to-rose-600',
      glow: 'shadow-red-500/20',
      trend: '+2 since 06:00',
      trendUp: true,
    },
    {
      label: 'Areas Monitored',
      value: areasCount,
      icon: MapPin,
      gradient: 'from-blue-500 to-cyan-500',
      glow: 'shadow-blue-500/20',
      trend: 'All sensors active',
      trendUp: null,
    },
    {
      label: 'Teams Deployed',
      value: deployedTeams,
      icon: Users,
      gradient: 'from-purple-500 to-violet-600',
      glow: 'shadow-purple-500/20',
      trend: '+1 last hour',
      trendUp: true,
    },
    {
      label: 'Risk Level',
      value: '76%',
      icon: Shield,
      gradient: 'from-orange-500 to-amber-500',
      glow: 'shadow-orange-500/20',
      trend: '+18% in 24h',
      trendUp: true,
    },
  ];

  // ── Sensor display config ──────────────────────────────────────────────────
  const sensorDisplays = [
    {
      key: 'rainfall',
      label: 'Rainfall',
      icon: Droplets,
      iconColor: 'text-blue-400',
      data: sensors.rainfall,
    },
    {
      key: 'waterLevel',
      label: 'Water Level',
      icon: Waves,
      iconColor: 'text-cyan-400',
      data: sensors.waterLevel,
    },
    {
      key: 'windSpeed',
      label: 'Wind Speed',
      icon: Wind,
      iconColor: 'text-teal-400',
      data: sensors.windSpeed,
    },
    {
      key: 'seismic',
      label: 'Seismic',
      icon: Zap,
      iconColor: 'text-yellow-400',
      data: sensors.seismic,
    },
  ];

  // ── Recent alerts (latest 3, sorted by timestamp descending) ───────────────
  const recentAlerts = [...alerts]
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 3);

  // ── Areas sorted by risk descending ────────────────────────────────────────
  const sortedAreas = [...monitoredAreas].sort((a, b) => b.riskPercent - a.riskPercent);

  // ═════════════════════════════════════════════════════════════════════════════
  // ── Render ────────────────────────────────────────────────────────────────
  // ═════════════════════════════════════════════════════════════════════════════

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Top Row : Stat Cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className={`glass-card p-5 flex items-start gap-4 shadow-lg ${card.glow}`}
            >
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${card.gradient} shadow-lg`}
              >
                <Icon className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                  {card.label}
                </p>
                <p className="text-2xl font-bold text-white mt-0.5">{card.value}</p>
                <div className="flex items-center gap-1 mt-1">
                  {card.trendUp === true && (
                    <TrendingUp className="h-3 w-3 text-red-400" />
                  )}
                  {card.trendUp === false && (
                    <TrendingDown className="h-3 w-3 text-green-400" />
                  )}
                  {card.trendUp === null && (
                    <Activity className="h-3 w-3 text-green-400" />
                  )}
                  <span className="text-[11px] text-slate-500">{card.trend}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Live Tamil Nadu Data ────────────────────────────────────── */}
      <LiveDataDashboard />

      {/* ── Resource Allocation Tracker ─────────────────────────────── */}
      <ResourceTracker />

      {/* ── Second Row : Donut Chart + Affected Areas ────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Hazard Risk Overview - Donut Chart */}
        <div className="lg:col-span-3 glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wide">
              Hazard Risk Overview
            </h2>
            <span className="text-[10px] text-slate-500 font-medium bg-slate-700/50 px-2.5 py-0.5 rounded-full">
              Last 24h
            </span>
          </div>
          <div className="h-[290px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={hazardRiskOverview}
                  cx="50%"
                  cy="45%"
                  innerRadius={72}
                  outerRadius={108}
                  paddingAngle={4}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {hazardRiskOverview.map((entry, idx) => (
                    <Cell
                      key={idx}
                      fill={entry.color}
                      style={{ filter: 'drop-shadow(0 0 6px rgba(0,0,0,0.3))' }}
                    />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltipContent />} />
                <Legend content={<CustomPieLegend />} />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Label Overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style={{ top: '-10%' }}>
              <span className="text-lg font-bold text-white">100 km</span>
              <span className="text-[11px] text-slate-400">Monitoring Radius</span>
            </div>
          </div>
        </div>

        {/* Affected Areas Table */}
        <div className="lg:col-span-2 glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wide">
              Affected Areas
            </h2>
            <span className="text-[10px] text-slate-500 font-medium bg-slate-700/50 px-2.5 py-0.5 rounded-full">
              {areasCount} Zones
            </span>
          </div>
          <div className="space-y-3 overflow-y-auto max-h-[280px] pr-1">
            {sortedAreas.map((area) => {
              const pCfg = priorityConfig[area.priority];
              return (
                <div
                  key={area.id}
                  className="flex items-center gap-3 rounded-xl bg-slate-800/50 px-3.5 py-2.5 hover:bg-slate-700/40 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-slate-200 truncate">
                        {area.name}
                      </span>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <span className="text-xs font-bold text-white tabular-nums">
                          {area.riskPercent}%
                        </span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${pCfg.color}`}
                        >
                          {area.priority}
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-700">
                      <div
                        className={`h-full rounded-full ${pCfg.bar} transition-all duration-500`}
                        style={{ width: `${area.riskPercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Third Row : Change Trend + Sensor Data ───────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Change Trend Area Chart */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wide">
              Change Trend
            </h2>
            <div className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 rounded-full px-2.5 py-1">
              <ArrowUpRight className="h-3.5 w-3.5 text-red-400" />
              <span className="text-[11px] font-semibold text-red-400">Risk Increasing</span>
            </div>
          </div>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={changeTrendData}
                margin={{ top: 5, right: 10, left: -10, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="dashRiskGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={{ stroke: '#334155' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip content={<AreaTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="risk"
                  stroke="#ef4444"
                  strokeWidth={2.5}
                  fill="url(#dashRiskGradient)"
                  dot={{ r: 3, fill: '#ef4444', strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: '#ef4444', stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sensor Data Panel */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wide">
              Live Sensor Data
            </h2>
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
              </span>
              <span className="text-[10px] text-green-400 font-medium uppercase tracking-wide">
                Real-time
              </span>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {sensorDisplays.map((sensor) => {
              const SIcon = sensor.icon;
              const pct = Math.min(
                (sensor.data.value / sensor.data.threshold) * 100,
                100
              );
              const barColorClass = sensorBarColor(pct);
              return (
                <div
                  key={sensor.key}
                  className="rounded-xl bg-slate-800/60 border border-slate-700/30 p-3.5"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <SIcon className={`h-4 w-4 ${sensor.iconColor}`} />
                      <span className="text-xs font-medium text-slate-400">{sensor.label}</span>
                    </div>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                        sensor.data.trend === 'rising'
                          ? 'bg-red-500/10 text-red-400'
                          : 'bg-slate-600/30 text-slate-400'
                      }`}
                    >
                      {sensor.data.trend === 'rising' ? 'Rising' : 'Stable'}
                    </span>
                  </div>
                  <p className="text-xl font-bold text-white tabular-nums">
                    {sensor.data.value}{' '}
                    <span className="text-xs font-normal text-slate-500">{sensor.data.unit}</span>
                  </p>
                  <div className="mt-2">
                    <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                      <span>{Math.round(pct)}% of threshold</span>
                      <span>
                        {sensor.data.threshold} {sensor.data.unit}
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-700">
                      <div
                        className={`h-full rounded-full ${barColorClass} transition-all duration-700`}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Bottom : Recent Alerts ───────────────────────────────────────── */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-slate-400" />
            <h2 className="text-sm font-semibold text-white uppercase tracking-wide">
              Recent Alerts
            </h2>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-3 w-3 text-slate-500" />
            <span className="text-[10px] text-slate-500 font-medium">Live feed</span>
          </div>
        </div>
        <div className="space-y-3">
          {recentAlerts.map((alert) => {
            const AIcon = alertIconMap[alert.type];
            return (
              <div
                key={alert.id}
                className={`flex items-start gap-3 rounded-xl bg-slate-800/40 border-l-4 ${alertBorderColor[alert.type]} px-4 py-3`}
              >
                <AIcon
                  className={`h-5 w-5 mt-0.5 shrink-0 ${alertTextColor[alert.type]} ${
                    alert.type === 'critical' ? 'animate-pulse' : ''
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-200 truncate">
                      {alert.title}
                    </p>
                    <span className="text-[10px] text-slate-500 font-medium whitespace-nowrap">
                      {formatTime(alert.timestamp)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{alert.message}</p>
                </div>
                <span
                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full shrink-0 ${
                    alert.type === 'critical'
                      ? 'bg-red-500/15 text-red-400'
                      : alert.type === 'warning'
                        ? 'bg-yellow-500/15 text-yellow-400'
                        : 'bg-blue-500/15 text-blue-400'
                  }`}
                >
                  {alert.type}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
