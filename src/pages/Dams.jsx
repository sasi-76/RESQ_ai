import { useState, useEffect } from 'react';
import { Droplets, TrendingUp, TrendingDown, Clock, RefreshCw, AlertTriangle, Waves, Zap } from 'lucide-react';
import { tnDamData, getDamStatus, calculateFillPercentage, formatLastUpdated } from '../data/damData';
import { fetchDams as fetchDamsFromAPI } from '../services/api';

const REFRESH_INTERVAL = 3600000; // 1 hour in milliseconds
const HEARTBEAT_INTERVAL = 30000; // 30 seconds

export default function Dams() {
  const [dams, setDams] = useState(() => {
    const cached = localStorage.getItem('resqai_dams_real_v2');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        return parsed;
      } catch (e) {
        return tnDamData;
      }
    }
    return tnDamData;
  });

  const [lastSync, setLastSync] = useState(() => {
    const cached = localStorage.getItem('resqai_dams_last_sync');
    return cached ? new Date(cached) : new Date();
  });

  const [nextRefreshIn, setNextRefreshIn] = useState(REFRESH_INTERVAL);
  const [isSyncing, setIsSyncing] = useState(false);

  const syncDamData = async () => {
    setIsSyncing(true);
    try {
      const data = await fetchDamsFromAPI();
      if (data && data.length > 0) {
        setDams(data);
        const now = new Date();
        setLastSync(now);
        setNextRefreshIn(REFRESH_INTERVAL);
        localStorage.setItem('resqai_dams_real_v2', JSON.stringify(data));
        localStorage.setItem('resqai_dams_last_sync', now.toISOString());
      }
    } catch (err) {
      console.warn('[Dams] Backend fetch failed, keeping cached data:', err.message);
    }
    setIsSyncing(false);
  };

  const triggerLiveRefresh = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('http://localhost:5000/api/dams-refresh', { method: 'POST' });
      const json = await res.json();
      if (json.success && json.data) {
        setDams(json.data);
        setLastSync(new Date());
        setNextRefreshIn(REFRESH_INTERVAL);
        localStorage.setItem('resqai_dams_real_v2', JSON.stringify(json.data));
        localStorage.setItem('resqai_dams_last_sync', new Date().toISOString());
      }
    } catch (err) {
      console.warn('[Dams] Live refresh failed:', err.message);
    }
    setIsSyncing(false);
  };

  // Hourly auto-refresh with background wakeup detection
  useEffect(() => {
    let lastCheck = Date.now();

    // Main hourly refresh timer
    const refreshTimer = setInterval(() => {
      syncDamData();
    }, REFRESH_INTERVAL);

    // Heartbeat to detect sleep/background and trigger immediate sync if hour passed
    const heartbeat = setInterval(() => {
      const now = Date.now();
      const elapsed = now - lastCheck;

      // If more than 1 hour passed since last check, sync immediately
      if (elapsed >= REFRESH_INTERVAL) {
        syncDamData();
      }

      lastCheck = now;
    }, HEARTBEAT_INTERVAL);

    return () => {
      clearInterval(refreshTimer);
      clearInterval(heartbeat);
    };
  }, []);

  // Fetch from backend on mount
  useEffect(() => {
    syncDamData();
  }, []);

  // Countdown timer
  useEffect(() => {
    const countdown = setInterval(() => {
      const now = Date.now();
      const lastSyncTime = new Date(lastSync).getTime();
      const elapsed = now - lastSyncTime;
      const remaining = Math.max(0, REFRESH_INTERVAL - elapsed);

      setNextRefreshIn(remaining);

      // If countdown hits zero, trigger refresh
      if (remaining === 0) {
        syncDamData();
      }
    }, 1000);

    return () => clearInterval(countdown);
  }, [lastSync]);

  const formatCountdown = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleManualSync = () => {
    syncDamData();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10">
            <Droplets className="h-6 w-6 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Reservoir Telemetry</h1>
            <p className="text-sm text-gray-400">Tamil Nadu, Karnataka & Andhra Pradesh - Live Feed</p>
          </div>
        </div>
      </div>

      {/* Official 1-Hour Feed Banner */}
      <div className="rounded-xl border border-cyan-500/30 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-cyan-500/10 p-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-cyan-400 uppercase tracking-wide">
                  Official 1-Hour WRD Feed
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Last Bulletin Sync: {formatLastUpdated(lastSync.toISOString())} IST
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 rounded-lg bg-slate-800/50 px-3 py-2 border border-slate-700">
              <Clock className="h-4 w-4 text-cyan-400" />
              <div className="text-right">
                <p className="text-xs text-gray-400">Next Auto Refresh</p>
                <p className="text-lg font-mono font-bold text-white tabular-nums">
                  {formatCountdown(nextRefreshIn)}
                </p>
              </div>
            </div>

            <button
              onClick={handleManualSync}
              disabled={isSyncing}
              className="flex items-center gap-2 rounded-lg bg-cyan-500 hover:bg-cyan-600 disabled:bg-cyan-500/50 px-4 py-2 text-sm font-semibold text-white transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing...' : 'Sync Feed Now'}
            </button>

            <button
              onClick={triggerLiveRefresh}
              disabled={isSyncing}
              className="flex items-center gap-2 rounded-lg bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 disabled:opacity-50 px-4 py-2 text-sm font-semibold text-green-400 transition-colors"
            >
              <Zap className={`h-4 w-4 ${isSyncing ? 'animate-pulse' : ''}`} />
              Live Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Dam Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {dams.map(dam => {
          const status = getDamStatus(dam);
          const fillPct = calculateFillPercentage(dam);

          return (
            <div
              key={dam.id}
              className="rounded-xl border border-slate-700 bg-slate-800/50 p-6 hover:border-cyan-500/50 transition-all"
            >
              {/* Dam Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white">{dam.name}</h3>
                  <p className="text-sm text-gray-400">{dam.river} River • {dam.district}</p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    status.color === 'red'
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : status.color === 'orange'
                      ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                      : status.color === 'yellow'
                      ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                      : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  }`}
                >
                  {status.label}
                </span>
              </div>

              {/* Water Level Bar */}
              <div className="mb-4">
                <div className="flex items-end justify-between mb-2">
                  <span className="text-3xl font-bold text-white">{dam.currentLevel} ft</span>
                  <span className="text-sm text-gray-400">/ {dam.fullReservoirLevel} ft FRL</span>
                </div>
                <div className="relative h-3 rounded-full bg-slate-700 overflow-hidden">
                  <div
                    className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${
                      status.color === 'red'
                        ? 'bg-red-500'
                        : status.color === 'orange'
                        ? 'bg-orange-500'
                        : status.color === 'yellow'
                        ? 'bg-yellow-500'
                        : 'bg-cyan-500'
                    }`}
                    style={{ width: `${fillPct}%` }}
                  />
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-gray-400">{fillPct}% Full</span>
                  <span className="text-xs text-gray-400">
                    {dam.storage.toLocaleString()} / {dam.capacity.toLocaleString()} mcft
                  </span>
                </div>
              </div>

              {/* Flow Metrics */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="rounded-lg bg-slate-900/50 p-3 border border-slate-700">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="h-4 w-4 text-blue-400" />
                    <span className="text-xs text-gray-400">Inflow</span>
                  </div>
                  <p className="text-xl font-bold text-white">
                    {dam.inflow.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-400">cusecs</p>
                </div>

                <div className="rounded-lg bg-slate-900/50 p-3 border border-slate-700">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingDown className="h-4 w-4 text-orange-400" />
                    <span className="text-xs text-gray-400">Outflow</span>
                  </div>
                  <p className="text-xl font-bold text-white">
                    {dam.outflow.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-400">cusecs</p>
                </div>
              </div>

              {/* Live Weather Data */}
              {dam.weather && (
                <div className="flex items-center flex-wrap gap-3 mb-4 rounded-lg bg-slate-900/50 p-2.5 border border-slate-700">
                  <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wide mr-1">Live Weather</span>
                  <span className="text-xs text-slate-300">🌡️ {dam.weather.temperature}°C</span>
                  <span className="text-xs text-slate-300">💧 {dam.weather.rainfall}mm</span>
                  <span className="text-xs text-slate-300">🌧️ 6h: {dam.weather.catchmentRainfall6h}mm</span>
                  <span className="text-xs text-slate-300">💨 {dam.weather.windSpeed}km/h</span>
                  <span className="text-xs text-slate-300">💦 {dam.weather.humidity}%</span>
                </div>
              )}

              {/* Timestamp */}
              <div className="flex items-center gap-2 text-xs text-gray-500 pt-3 border-t border-slate-700">
                <Clock className="h-3 w-3" />
                <span>🕒 {formatLastUpdated(dam.lastUpdated)} IST (TN WRD 1-Hour Feed)</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <div className="flex items-center gap-3">
            <Waves className="h-8 w-8 text-cyan-400" />
            <div>
              <p className="text-sm text-gray-400">Total Reservoirs</p>
              <p className="text-2xl font-bold text-white">{dams.length}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <div className="flex items-center gap-3">
            <Droplets className="h-8 w-8 text-blue-400" />
            <div>
              <p className="text-sm text-gray-400">Average Fill Level</p>
              <p className="text-2xl font-bold text-white">
                {(dams.reduce((acc, dam) => acc + parseFloat(calculateFillPercentage(dam)), 0) / dams.length).toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-orange-400" />
            <div>
              <p className="text-sm text-gray-400">High Alert Dams</p>
              <p className="text-2xl font-bold text-white">
                {dams.filter(dam => getDamStatus(dam).severity === 'high' || getDamStatus(dam).severity === 'elevated').length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
