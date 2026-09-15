import { useState } from 'react';
import {
  Waves,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  ShieldAlert,
  Clock,
  MapPin,
  Send,
  Zap,
  CheckCircle,
  Eye,
  Sliders,
  Filter,
  Navigation,
  Droplets,
  Share2,
  Info,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  getDamsByBasin,
  sendDamSurgeWhatsAppAlert,
  sendCausewaySafetyWhatsApp,
} from '../services/damService';

const BASINS = [
  { id: 'ALL', label: 'All Basins' },
  { id: 'Cauvery Delta', label: 'Cauvery Delta' },
  { id: 'Chennai Metro', label: 'Chennai Metro' },
  { id: 'Vaigai & South', label: 'Vaigai & South' },
  { id: 'Thenpennai Basin', label: 'Thenpennai' },
  { id: 'Western Ghats', label: 'Western Ghats' },
];

export default function Dams() {
  const { dams, updateDamDischarge, simulateDamSurge, getDamStats, showNotification } = useApp();
  const [selectedBasin, setSelectedBasin] = useState('ALL');
  const [selectedDam, setSelectedDam] = useState(null);
  const [simulatingId, setSimulatingId] = useState(null);

  const stats = getDamStats();
  const filteredDams = getDamsByBasin(dams, selectedBasin);

  const handleSimulate = (damId) => {
    setSimulatingId(damId);
    simulateDamSurge(damId, 25000);
    setTimeout(() => setSimulatingId(null), 1000);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'CRITICAL_SURGE':
        return {
          bg: 'bg-red-500/20 text-red-300 border-red-500/50',
          dot: 'bg-red-500 animate-ping',
          label: 'CRITICAL SURGE',
        };
      case 'HIGH_ALERT':
        return {
          bg: 'bg-orange-500/20 text-orange-300 border-orange-500/50',
          dot: 'bg-orange-500',
          label: 'HIGH ALERT',
        };
      case 'CAUTION':
        return {
          bg: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50',
          dot: 'bg-yellow-500',
          label: 'CAUTION',
        };
      default:
        return {
          bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50',
          dot: 'bg-emerald-500',
          label: 'NORMAL',
        };
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider mb-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
            </span>
            Tamil Nadu Water Resources Dept (TN WRD) • Hydro Command
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
            <Waves className="h-7 w-7 text-cyan-400" />
            Dam &amp; Reservoir Early Warning Center
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Continuous water level monitoring, spillway flood surge tracking &amp; downstream accident prevention across major reservoirs.
          </p>
        </div>

        {/* Quick Top Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => handleSimulate('mettur')}
            disabled={simulatingId === 'mettur'}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-red-500/20 transition-all"
            title="Simulate high inflow surge at Mettur Dam to test alerts"
          >
            <Zap className={`h-4 w-4 ${simulatingId === 'mettur' ? 'animate-spin' : ''}`} />
            <span>Simulate Mettur Surge (+25k cusecs)</span>
          </button>
        </div>
      </div>

      {/* Statewide Reservoir Telemetry KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Storage */}
        <div className="glass-card p-4 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">State Storage Capacity</span>
            <span className="text-xs font-mono font-bold text-cyan-400">{stats.stateFillPercentage}% FULL</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">{stats.totalStorageTmc}</span>
            <span className="text-xs text-slate-400 font-medium">/ {stats.totalCapacityTmc} TMC</span>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-slate-800 rounded-full h-2 mt-3 overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all duration-700 ${
                stats.stateFillPercentage > 90
                  ? 'bg-red-500'
                  : stats.stateFillPercentage > 80
                  ? 'bg-orange-500'
                  : 'bg-cyan-500'
              }`}
              style={{ width: `${Math.min(stats.stateFillPercentage, 100)}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-500 mt-2">Combined live storage across 10 monitored state reservoirs</p>
        </div>

        {/* Total Outflow */}
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">Active Spillway Outflow</span>
            <ArrowUpRight className="h-4 w-4 text-orange-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-orange-400">
              {stats.totalOutflowCusecs.toLocaleString()}
            </span>
            <span className="text-xs text-slate-400 font-medium">cusecs</span>
          </div>
          <div className="flex items-center gap-2 mt-3 text-xs text-slate-400">
            <span className="inline-block w-2 h-2 rounded-full bg-orange-400 animate-ping" />
            <span>{stats.activeSpillwayCount} reservoirs actively discharging water</span>
          </div>
        </div>

        {/* Total Inflow */}
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">Monsoon Inflow</span>
            <ArrowDownRight className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-cyan-400">
              {stats.totalInflowCusecs.toLocaleString()}
            </span>
            <span className="text-xs text-slate-400 font-medium">cusecs</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-3">
            Catchment inflow from Western Ghats &amp; Inter-state rivers
          </p>
        </div>

        {/* Risk Alerts */}
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">Flood Watch Status</span>
            <ShieldAlert className="h-4 w-4 text-red-400" />
          </div>
          <div className="mt-2 flex items-center gap-3">
            <span className="text-2xl font-black text-red-400">
              {stats.highAlertCount + stats.criticalDamsCount}
            </span>
            <span className="text-xs text-slate-400">
              Dams in <strong className="text-red-300">High / Critical Alert</strong>
            </span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[10px] text-slate-400">
            <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-300 font-mono font-bold">
              {stats.criticalDamsCount} Critical
            </span>
            <span className="px-2 py-0.5 rounded bg-orange-500/20 text-orange-300 font-mono font-bold">
              {stats.highAlertCount} High Alert
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold">
              {stats.safeCount} Normal
            </span>
          </div>
        </div>
      </div>

      {/* Basin Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs scrollbar-none">
        <span className="text-slate-400 font-bold font-mono text-[11px] whitespace-nowrap flex items-center gap-1 mr-1">
          <Filter className="h-3.5 w-3.5 text-cyan-400" /> Basin:
        </span>
        {BASINS.map((b) => (
          <button
            key={b.id}
            onClick={() => setSelectedBasin(b.id)}
            className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all ${
              selectedBasin === b.id
                ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/20'
                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            {b.label}
          </button>
        ))}
      </div>

      {/* Main Dam Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {filteredDams.map((dam) => {
          const fillPct = ((dam.currentLevelFt / dam.frlFt) * 100).toFixed(1);
          const badge = getStatusBadge(dam.status);

          return (
            <div
              key={dam.id}
              className="glass-card p-5 border border-slate-700/60 hover:border-cyan-500/40 transition-all flex flex-col justify-between"
            >
              <div>
                {/* Top Dam Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg font-bold text-white tracking-tight">{dam.name}</h3>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {dam.basin}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-cyan-400" />
                      <span>{dam.river} River • {dam.district} District</span>
                    </p>
                  </div>

                  {/* Status Badge */}
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold border flex items-center gap-1.5 shrink-0 ${badge.bg}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                    <span>{badge.label}</span>
                  </span>
                </div>

                {/* Primary Water Level vs FRL Gauge Bar */}
                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 mb-4">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-slate-400 font-semibold flex items-center gap-1">
                      <Droplets className="h-3.5 w-3.5 text-cyan-400" /> Water Level
                    </span>
                    <span className="font-mono font-bold text-white">
                      <span className="text-cyan-300 text-sm font-black">{dam.currentLevelFt} ft</span>{' '}
                      <span className="text-slate-500">/ {dam.frlFt} ft (FRL)</span>{' '}
                      <span className="text-orange-400 font-bold ml-1">({fillPct}%)</span>
                    </span>
                  </div>

                  {/* Level Progress */}
                  <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-2.5 rounded-full transition-all duration-500 ${
                        Number(fillPct) >= 95
                          ? 'bg-red-500'
                          : Number(fillPct) >= 85
                          ? 'bg-orange-500'
                          : 'bg-cyan-500'
                      }`}
                      style={{ width: `${Math.min(Number(fillPct), 100)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1.5">
                    <span>Dead Storage</span>
                    <span>Safe Operating Buffer</span>
                    <span className="text-red-400 font-semibold">Crest Level (FRL)</span>
                  </div>
                </div>

                {/* Hydrological Metrics Quad */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4 text-xs">
                  {/* Storage TMC */}
                  <div className="p-2.5 rounded-lg bg-slate-900/50 border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Live Storage</span>
                    <p className="text-sm font-black text-white mt-0.5">{dam.storageTmc} TMC</p>
                    <span className="text-[9px] text-slate-500 font-mono">Max: {dam.capacityTmc} TMC</span>
                  </div>

                  {/* Inflow */}
                  <div className="p-2.5 rounded-lg bg-slate-900/50 border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
                      <ArrowDownRight className="h-3 w-3 text-cyan-400" /> Inflow
                    </span>
                    <p className="text-sm font-black text-cyan-400 mt-0.5">
                      {dam.inflowCusecs.toLocaleString()}
                    </p>
                    <span className="text-[9px] text-slate-500 font-mono">cusecs</span>
                  </div>

                  {/* Outflow */}
                  <div className="p-2.5 rounded-lg bg-slate-900/50 border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
                      <ArrowUpRight className="h-3 w-3 text-orange-400" /> Outflow
                    </span>
                    <p className="text-sm font-black text-orange-400 mt-0.5">
                      {dam.outflowCusecs.toLocaleString()}
                    </p>
                    <span className="text-[9px] text-slate-500 font-mono">cusecs release</span>
                  </div>

                  {/* Sluice Gates */}
                  <div className="p-2.5 rounded-lg bg-slate-900/50 border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Sluice Gates</span>
                    <p className="text-sm font-black text-white mt-0.5">
                      <span className="text-orange-400 font-bold">{dam.openGates}</span>{' '}
                      <span className="text-slate-500">/ {dam.spillwayGates}</span>
                    </p>
                    <span className="text-[9px] text-slate-500 font-mono">
                      {dam.openGates > 0 ? 'Spillway Open' : 'Closed'}
                    </span>
                  </div>
                </div>

                {/* Downstream Flood Transit & Peak Wave Schedule */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-2">
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-orange-400" /> Downstream Flood Wave Propagation (ETA)
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">Transit Model</span>
                  </div>

                  <div className="space-y-1.5">
                    {dam.transitSchedule.slice(0, 3).map((item, idx) => (
                      <div
                        key={idx}
                        className="p-2 rounded-lg bg-slate-900/70 border border-slate-800/60 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-4 h-4 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[9px] font-mono text-cyan-400">
                            {idx + 1}
                          </span>
                          <span className="font-semibold text-slate-200">{item.location}</span>
                          <span className="text-[10px] text-slate-500 font-mono">({item.distanceKm} km)</span>
                        </div>
                        <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-orange-500/10 text-orange-300 border border-orange-500/20">
                          Peak in ~{item.peakEta}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Accident Prevention & Causeway Alert Banner */}
                {dam.accidentPrevention && (
                  <div className="p-3 rounded-xl bg-red-950/20 border border-red-500/30 mb-4 text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-red-400 mb-1">
                      <AlertTriangle className="h-4 w-4" />
                      <span>Accident Prevention &amp; Public Hazards:</span>
                    </div>

                    {dam.accidentPrevention.causewaysSubmerged.length > 0 && (
                      <div className="text-[11px] text-slate-300 mt-1">
                        ⛔ <strong className="text-red-300">Submerged Causeways:</strong>{' '}
                        {dam.accidentPrevention.causewaysSubmerged.join(', ')}
                      </div>
                    )}

                    {dam.accidentPrevention.bathingBanned && (
                      <div className="text-[11px] text-slate-300 mt-1">
                        🚫 <strong className="text-amber-300">Bathing/Coracle Ban:</strong>{' '}
                        {dam.accidentPrevention.bathingBanLocations.join(', ')}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons Bar */}
              <div className="flex items-center gap-2 pt-3 border-t border-slate-800 flex-wrap">
                <button
                  onClick={() => sendDamSurgeWhatsAppAlert(dam)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-200 hover:text-white border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
                  title="Broadcast official WhatsApp flood warning to collectors & revenue officers"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Send Flood Alert (WhatsApp)</span>
                </button>

                {dam.accidentPrevention.causewaysSubmerged.length > 0 && (
                  <button
                    onClick={() =>
                      sendCausewaySafetyWhatsApp(
                        dam,
                        dam.accidentPrevention.causewaysSubmerged[0]
                      )
                    }
                    className="px-3 py-1.5 rounded-lg bg-amber-600/20 hover:bg-amber-600/40 text-amber-200 hover:text-white border border-amber-500/30 text-xs font-medium flex items-center gap-1.5 transition-all"
                  >
                    ⛔ Causeway Ban Alert
                  </button>
                )}

                <button
                  onClick={() => handleSimulate(dam.id)}
                  disabled={simulatingId === dam.id}
                  className="ml-auto px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium border border-slate-700 flex items-center gap-1 transition-all"
                >
                  <Zap className={`h-3 w-3 ${simulatingId === dam.id ? 'animate-spin text-cyan-400' : ''}`} />
                  <span>Test Surge</span>
                </button>

                <button
                  onClick={() => setSelectedDam(dam)}
                  className="px-2.5 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-300 hover:text-white text-xs font-bold border border-cyan-500/30 flex items-center gap-1 transition-all"
                >
                  <Eye className="h-3 w-3" />
                  <span>Details</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dam Detailed Inspection Modal */}
      {selectedDam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-5 animate-slide-up">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase">
                  Reservoir Technical Specification
                </span>
                <h3 className="text-xl font-bold text-white">{selectedDam.name}</h3>
                <p className="text-xs text-slate-400">
                  {selectedDam.river} Basin • Coordinates: {selectedDam.lat.toFixed(4)}°N, {selectedDam.lng.toFixed(4)}°E
                </p>
              </div>
              <button
                onClick={() => setSelectedDam(null)}
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Current Level</span>
                <p className="text-lg font-black text-white mt-0.5">{selectedDam.currentLevelFt} ft</p>
                <span className="text-[10px] text-cyan-400 font-mono">FRL: {selectedDam.frlFt} ft</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Storage</span>
                <p className="text-lg font-black text-white mt-0.5">{selectedDam.storageTmc} TMC</p>
                <span className="text-[10px] text-cyan-400 font-mono">Capacity: {selectedDam.capacityTmc} TMC</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Inflow Rate</span>
                <p className="text-lg font-black text-cyan-400 mt-0.5">{selectedDam.inflowCusecs.toLocaleString()}</p>
                <span className="text-[10px] text-slate-400 font-mono">cusecs</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Discharge Rate</span>
                <p className="text-lg font-black text-orange-400 mt-0.5">{selectedDam.outflowCusecs.toLocaleString()}</p>
                <span className="text-[10px] text-slate-400 font-mono">cusecs</span>
              </div>
            </div>

            {/* Downstream Vulnerability & Evacuation Zones */}
            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60">
              <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-2">
                <ShieldAlert className="h-4 w-4 text-orange-400" />
                Downstream Vulnerable Taluks on Alert:
              </h4>
              <div className="flex flex-wrap gap-2">
                {selectedDam.vulnerableTaluks.map((t, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs font-medium text-slate-200"
                  >
                    📍 {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Complete Transit Timeline */}
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-cyan-400" />
                Comprehensive Downstream Surge Arrival Timeline:
              </h4>
              <div className="space-y-2">
                {selectedDam.transitSchedule.map((t, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-bold text-white">{t.location}</p>
                      <p className="text-[10px] text-slate-400">Distance from dam: {t.distanceKm} km</p>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-orange-300 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
                        ETA: ~{t.peakEta}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setSelectedDam(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold"
              >
                Close
              </button>
              <button
                onClick={() => {
                  sendDamSurgeWhatsAppAlert(selectedDam);
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg"
              >
                <Send className="h-4 w-4" />
                <span>Send WhatsApp Advisory to Officers</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
