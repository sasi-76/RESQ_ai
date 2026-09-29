import { useState, useEffect, useCallback } from 'react';
import {
  Brain,
  TrendingUp,
  AlertTriangle,
  Droplets,
  Wind,
  Zap,
  Layers,
  Clock,
  MapPin,
  RefreshCw,
  ChevronRight,
  ChevronDown,
  Shield,
  Target,
  Activity,
  BarChart3,
  ArrowUpRight,
  CheckCircle2,
  Info,
  X,
} from 'lucide-react';
import { fetchPredictions, refreshPredictions, fetchPredictionSummary } from '../services/api';

// ── Config ───────────────────────────────────────────────────────────────────

const typeConfig = {
  flood: {
    label: 'Flood',
    icon: Droplets,
    color: 'blue',
    gradient: 'from-blue-500 to-cyan-500',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    text: 'text-blue-400',
    ring: 'ring-blue-500/30',
    bar: 'bg-blue-500',
  },
  cyclone: {
    label: 'Cyclone',
    icon: Wind,
    color: 'purple',
    gradient: 'from-purple-500 to-violet-500',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
    text: 'text-purple-400',
    ring: 'ring-purple-500/30',
    bar: 'bg-purple-500',
  },
  earthquake: {
    label: 'Earthquake',
    icon: Zap,
    color: 'amber',
    gradient: 'from-amber-500 to-orange-500',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    text: 'text-amber-400',
    ring: 'ring-amber-500/30',
    bar: 'bg-amber-500',
  },
  compound: {
    label: 'Compound',
    icon: Layers,
    color: 'red',
    gradient: 'from-red-500 to-rose-500',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    text: 'text-red-400',
    ring: 'ring-red-500/30',
    bar: 'bg-red-500',
  },
};

const severityConfig = {
  critical: { label: 'Critical', color: 'bg-red-500/20 text-red-400 border-red-500/40' },
  high: { label: 'High', color: 'bg-orange-500/20 text-orange-400 border-orange-500/40' },
  moderate: { label: 'Moderate', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40' },
  low: { label: 'Low', color: 'bg-green-500/20 text-green-400 border-green-500/40' },
  minimal: { label: 'Minimal', color: 'bg-slate-500/20 text-slate-400 border-slate-500/40' },
};

function probabilityColor(prob) {
  if (prob >= 80) return 'text-red-400';
  if (prob >= 60) return 'text-orange-400';
  if (prob >= 40) return 'text-yellow-400';
  if (prob >= 20) return 'text-green-400';
  return 'text-slate-400';
}

function probabilityBarColor(prob) {
  if (prob >= 80) return 'bg-gradient-to-r from-red-600 to-rose-500';
  if (prob >= 60) return 'bg-gradient-to-r from-orange-600 to-amber-500';
  if (prob >= 40) return 'bg-gradient-to-r from-yellow-600 to-amber-400';
  if (prob >= 20) return 'bg-gradient-to-r from-green-600 to-emerald-500';
  return 'bg-gradient-to-r from-slate-600 to-slate-500';
}

function timeUntil(isoString) {
  if (!isoString) return 'Unknown';
  const diff = new Date(isoString).getTime() - Date.now();
  if (diff < 0) return 'Imminent';
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'Under 1 hour';
  if (hours < 24) return `~${hours}h`;
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;
  return `~${days}d ${remHours}h`;
}

function formatDate(isoString) {
  if (!isoString) return '';
  return new Date(isoString).toLocaleString('en-IN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
  });
}

// ── Components ───────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, subtext, gradient }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-700/60 bg-slate-800/60 p-4">
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-5`} />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
          {subtext && <p className="text-xs text-slate-500 mt-1">{subtext}</p>}
        </div>
        <div className={`p-2 rounded-lg bg-gradient-to-br ${gradient} bg-opacity-20`}>
          <Icon className="h-5 w-5 text-white/80" />
        </div>
      </div>
    </div>
  );
}

function PredictionCard({ prediction, isExpanded, onToggle }) {
  const config = typeConfig[prediction.type] || typeConfig.flood;
  const sevConfig = severityConfig[prediction.severity] || severityConfig.moderate;
  const TypeIcon = config.icon;

  return (
    <div
      className={`rounded-xl border transition-all duration-200 ${
        isExpanded ? 'border-slate-600 bg-slate-800/80 shadow-lg' : 'border-slate-700/60 bg-slate-800/50 hover:border-slate-600'
      }`}
    >
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full text-left p-4 flex items-start gap-4"
      >
        {/* Probability ring */}
        <div className="relative flex-shrink-0">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center ${config.bg} border ${config.border}`}>
            <span className={`text-lg font-bold ${probabilityColor(prediction.probability)}`}>
              {prediction.probability}%
            </span>
          </div>
          <div className={`absolute -bottom-1 -right-1 p-1 rounded-full ${config.bg} border ${config.border}`}>
            <TypeIcon className={`h-3.5 w-3.5 ${config.text}`} />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${sevConfig.color}`}>
              {sevConfig.label}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text} border ${config.border}`}>
              {config.label}
            </span>
            {prediction.source && (
              <span className="px-2 py-0.5 rounded-full text-xs text-slate-500 bg-slate-700/50">
                {prediction.source.replace(/-/g, ' ')}
              </span>
            )}
          </div>
          <h3 className="text-sm font-semibold text-white mt-1.5 leading-snug">
            {prediction.title}
          </h3>
          <div className="flex items-center gap-4 mt-1.5 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {prediction.areaName}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {timeUntil(prediction.predictedFor)}
            </span>
          </div>
        </div>

        {/* Probability bar */}
        <div className="flex-shrink-0 flex flex-col items-end gap-1">
          <div className="w-24 h-2 rounded-full bg-slate-700 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${probabilityBarColor(prediction.probability)}`}
              style={{ width: `${prediction.probability}%` }}
            />
          </div>
          <span className="text-[10px] text-slate-500">
            Confidence: {prediction.confidence?.toFixed(0) || '?'}%
          </span>
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-slate-500 mt-1" />
          ) : (
            <ChevronRight className="h-4 w-4 text-slate-500 mt-1" />
          )}
        </div>
      </button>

      {/* Expanded detail */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-slate-700/50 pt-4">
          {/* Description */}
          <p className="text-sm text-slate-300 leading-relaxed">
            {prediction.description}
          </p>

          {/* Timeline */}
          <div className="flex items-center gap-6 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-slate-400" />
              <span className="text-slate-400">Predicted at</span>
              <span className="text-slate-200 font-medium">{formatDate(prediction.predictedAt)}</span>
            </div>
            <ArrowUpRight className="h-3 w-3 text-slate-600" />
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${config.bar}`} />
              <span className="text-slate-400">Expected by</span>
              <span className="text-slate-200 font-medium">{formatDate(prediction.predictedFor)}</span>
            </div>
            <span className="text-slate-500">({timeUntil(prediction.predictedFor)})</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Factors */}
            <div className="rounded-lg bg-slate-900/50 border border-slate-700/40 p-3">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <BarChart3 className="h-3.5 w-3.5" />
                Contributing Factors
              </h4>
              <ul className="space-y-1.5">
                {(prediction.factors || []).map((factor, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                    <Activity className="h-3 w-3 text-slate-500 mt-0.5 flex-shrink-0" />
                    {factor}
                  </li>
                ))}
              </ul>
            </div>

            {/* Recommended Actions */}
            <div className="rounded-lg bg-slate-900/50 border border-slate-700/40 p-3">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5" />
                Recommended Actions
              </h4>
              <ul className="space-y-1.5">
                {(prediction.recommendedActions || []).map((action, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                    <CheckCircle2 className="h-3 w-3 text-cyan-500 mt-0.5 flex-shrink-0" />
                    {action}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function Predictions() {
  const [predictions, setPredictions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [typeFilter, setTypeFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [expandedId, setExpandedId] = useState(null);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    try {
      const [preds, summ] = await Promise.all([
        fetchPredictions(),
        fetchPredictionSummary(),
      ]);
      setPredictions(preds || []);
      setSummary(summ || null);
      setError(null);
    } catch (err) {
      setError('Failed to load predictions. Is the backend running?');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 60000); // refresh every minute
    return () => clearInterval(interval);
  }, [loadData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshPredictions();
      await loadData();
    } catch (err) {
      setError('Failed to refresh predictions');
    } finally {
      setRefreshing(false);
    }
  };

  // Apply filters
  const filtered = predictions.filter(p => {
    if (typeFilter !== 'all' && p.type !== typeFilter) return false;
    if (severityFilter !== 'all' && p.severity !== severityFilter) return false;
    return true;
  });

  const criticalCount = predictions.filter(p => p.severity === 'critical' || p.severity === 'high').length;
  const avgProbability = predictions.length
    ? Math.round(predictions.reduce((s, p) => s + p.probability, 0) / predictions.length)
    : 0;

  const typeBreakdown = {};
  for (const p of predictions) {
    typeBreakdown[p.type] = (typeBreakdown[p.type] || 0) + 1;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <Brain className="h-12 w-12 text-cyan-400 mx-auto animate-pulse" />
          <p className="text-slate-400">Analyzing disaster risk data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Brain className="h-7 w-7 text-cyan-400" />
            Disaster Predictions
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            AI-powered risk forecasting based on real-time trends, weather forecasts, and seismic analysis
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-medium transition-all disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Analyzing...' : 'Refresh Forecast'}
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-300">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto">
            <X className="h-4 w-4 text-red-400 hover:text-red-300" />
          </button>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={Target}
          label="Active Predictions"
          value={predictions.length}
          subtext={summary?.lastUpdated ? `Updated ${formatDate(summary.lastUpdated)}` : null}
          gradient="from-cyan-500 to-blue-600"
        />
        <StatCard
          icon={AlertTriangle}
          label="High / Critical"
          value={criticalCount}
          subtext={criticalCount > 0 ? 'Require immediate attention' : 'No critical risks'}
          gradient="from-red-500 to-rose-600"
        />
        <StatCard
          icon={TrendingUp}
          label="Avg Probability"
          value={`${avgProbability}%`}
          subtext="Across all predictions"
          gradient="from-amber-500 to-orange-600"
        />
        <StatCard
          icon={BarChart3}
          label="Risk Types"
          value={Object.keys(typeBreakdown).length}
          subtext={Object.entries(typeBreakdown).map(([t, c]) => `${typeConfig[t]?.label || t}: ${c}`).join(', ')}
          gradient="from-purple-500 to-violet-600"
        />
      </div>

      {/* Type breakdown bars */}
      {predictions.length > 0 && (
        <div className="rounded-xl border border-slate-700/60 bg-slate-800/50 p-4">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Risk Distribution</h3>
          <div className="flex gap-1 h-3 rounded-full overflow-hidden bg-slate-700">
            {Object.entries(typeBreakdown).map(([type, count]) => {
              const cfg = typeConfig[type] || typeConfig.flood;
              const widthPct = (count / predictions.length) * 100;
              return (
                <div
                  key={type}
                  className={`${cfg.bar} transition-all`}
                  style={{ width: `${widthPct}%` }}
                  title={`${cfg.label}: ${count} (${widthPct.toFixed(0)}%)`}
                />
              );
            })}
          </div>
          <div className="flex gap-4 mt-2">
            {Object.entries(typeBreakdown).map(([type, count]) => {
              const cfg = typeConfig[type] || typeConfig.flood;
              return (
                <span key={type} className="flex items-center gap-1.5 text-xs text-slate-400">
                  <span className={`w-2 h-2 rounded-full ${cfg.bar}`} />
                  {cfg.label}: {count}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Filter:</span>
        {/* Type filters */}
        <div className="flex gap-1.5">
          <button
            onClick={() => setTypeFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              typeFilter === 'all'
                ? 'bg-cyan-600 text-white shadow'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            All Types
          </button>
          {Object.entries(typeConfig).map(([key, cfg]) => {
            const TypeIcon = cfg.icon;
            const count = typeBreakdown[key] || 0;
            return (
              <button
                key={key}
                onClick={() => setTypeFilter(key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                  typeFilter === key
                    ? `bg-gradient-to-r ${cfg.gradient} text-white shadow`
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                <TypeIcon className="h-3 w-3" />
                {cfg.label} ({count})
              </button>
            );
          })}
        </div>

        <div className="w-px h-6 bg-slate-700" />

        {/* Severity filters */}
        <div className="flex gap-1.5">
          <button
            onClick={() => setSeverityFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              severityFilter === 'all'
                ? 'bg-slate-600 text-white shadow'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            All Severity
          </button>
          {['critical', 'high', 'moderate', 'low'].map(sev => {
            const cfg = severityConfig[sev];
            const count = predictions.filter(p => p.severity === sev).length;
            return (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                  severityFilter === sev
                    ? cfg.color + ' shadow'
                    : 'bg-slate-800 text-slate-400 border-transparent hover:bg-slate-700'
                }`}
              >
                {cfg.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Predictions List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-slate-700/60 bg-slate-800/50 p-12 text-center">
            <Brain className="h-12 w-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-400 mb-2">
              {predictions.length === 0 ? 'No Predictions Yet' : 'No Matching Predictions'}
            </h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              {predictions.length === 0
                ? 'Click "Refresh Forecast" to run the prediction engine, or wait for the next automatic cycle. The system analyzes dam trends, weather forecasts, and seismic data to predict potential disasters.'
                : 'Try adjusting the type or severity filters to see other predictions.'}
            </p>
          </div>
        ) : (
          <>
            <p className="text-xs text-slate-500">
              Showing {filtered.length} prediction{filtered.length !== 1 ? 's' : ''}, sorted by probability
            </p>
            {filtered.map(pred => (
              <PredictionCard
                key={pred.id}
                prediction={pred}
                isExpanded={expandedId === pred.id}
                onToggle={() =>
                  setExpandedId(expandedId === pred.id ? null : pred.id)
                }
              />
            ))}
          </>
        )}
      </div>

      {/* Info footer */}
      <div className="rounded-lg bg-slate-800/30 border border-slate-700/40 p-3 flex items-start gap-2">
        <Info className="h-4 w-4 text-slate-500 mt-0.5 flex-shrink-0" />
        <div className="text-xs text-slate-500 space-y-1">
          <p>
            <strong className="text-slate-400">How predictions work:</strong> The engine analyzes dam inflow/outflow trends to project when reservoirs reach critical levels, fetches 7-day weather forecasts for rainfall and wind patterns, monitors USGS earthquake data for seismic clustering, and evaluates compound risks when multiple hazards converge.
          </p>
          <p>
            Predictions refresh automatically every 10 minutes. Probability indicates likelihood within the forecast window. Confidence reflects how reliable the prediction model is for the given timeframe.
          </p>
        </div>
      </div>
    </div>
  );
}
