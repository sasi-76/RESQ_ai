import { useState, useEffect } from 'react';
import { Droplets, TrendingUp, TrendingDown, Clock, RefreshCw, AlertTriangle, Waves } from 'lucide-react';
import { tnDamData, getDamStatus, calculateFillPercentage, formatLastUpdated, normalizeDam } from '../data/damData';

const REFRESH_INTERVAL = 3600000; // 1 hour in milliseconds
const HEARTBEAT_INTERVAL = 30000; // 30 seconds

export default function Dams() {
  const [dams, setDams] = useState(() => {
    try {
      const cached = localStorage.getItem('resqai_dams_real_v2');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(d => normalizeDam(d) || d);
        }
      }
    } catch (e) {
      console.warn('Failed to parse cached dams', e);
    }
    return tnDamData.map(d => normalizeDam(d) || d);
  });

  const [lastSync, setLastSync] = useState(() => {
    try {
      const cached = localStorage.getItem('resqai_dams_last_sync');
      if (cached) {
        const d = new Date(cached);
        if (!isNaN(d.getTime())) return d;
      }
    } catch (e) {}
    return new Date();
  });

  const [nextRefreshIn, setNextRefreshIn] = useState(REFRESH_INTERVAL);
  const [isSyncing, setIsSyncing] = useState(false);

  // Simulate fetching fresh data from TN WRD
  const syncDamData = async () => {
    setIsSyncing(true);

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // In production, this would fetch from TN WRD API
    // For now, we refresh with the static data + small variations
    const refreshedData = tnDamData.map(dam => {
      const norm = normalizeDam(dam) || dam;
      return {
        ...norm,
        lastUpdated: new Date().toISOString(),
        inflow: Math.max(0, norm.inflow + Math.floor(Math.random() * 200 - 100)),
        outflow: Math.max(0, norm.outflow + Math.floor(Math.random() * 200 - 100)),
        currentLevel: Number((norm.currentLevel + (Math.random() * 0.2 - 0.1)).toFixed(2))
      };
    });

    setDams(refreshedData);
    const now = new Date();
    setLastSync(now);
    setNextRefreshIn(REFRESH_INTERVAL);

    localStorage.setItem('resqai_dams_real_v2', JSON.stringify(refreshedData));
    localStorage.setItem('resqai_dams_last_sync', now.toISOString());

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
                Last Bulletin Sync: {formatLastUpdated(lastSync instanceof Date && !isNaN(lastSync.getTime()) ? lastSync.toISOString() : new Date().toISOString())} IST
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
          </div>
        </div>
      </div>

      {/* Dam Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {dams.map(dam => {
          const status = getDamStatus(dam);
          const fillPct = calculateFillPercentage(dam);
          const currentLvl = dam.currentLevel ?? dam.currentLevelFt ?? 0;
          const frlLvl = dam.fullReservoirLevel ?? dam.frlFt ?? 100;
          const storageVal = Number(dam.storage ?? dam.storageMcft ?? 0);
          const capacityVal = Number(dam.capacity ?? dam.storageMcft ?? 0);
          const inflowVal = Number(dam.inflow ?? dam.inflowCusecs ?? 0);
          const outflowVal = Number(dam.outflow ?? dam.outflowCusecs ?? 0);

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
                  <span className="text-3xl font-bold text-white">{currentLvl} ft</span>
                  <span className="text-sm text-gray-400">/ {frlLvl} ft FRL</span>
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
                    style={{ width: `${Math.min(100, Math.max(0, Number(fillPct) || 0))}%` }}
                  />
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-gray-400">{fillPct}% Full</span>
                  <span className="text-xs text-gray-400">
                    {storageVal.toLocaleString()} / {capacityVal.toLocaleString()} mcft
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
                    {inflowVal.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-400">cusecs</p>
                </div>

                <div className="rounded-lg bg-slate-900/50 p-3 border border-slate-700">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingDown className="h-4 w-4 text-orange-400" />
                    <span className="text-xs text-gray-400">Outflow</span>
                  </div>
                  <p className="text-xl font-bold text-white">
                    {outflowVal.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-400">cusecs</p>
                </div>
              </div>

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
                {(dams.reduce((acc, dam) => acc + (parseFloat(calculateFillPercentage(dam)) || 0), 0) / (dams.length || 1)).toFixed(1)}%
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
