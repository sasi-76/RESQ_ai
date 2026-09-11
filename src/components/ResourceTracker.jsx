import { useApp } from '../context/AppContext';
import { Users, User, Ambulance, BedDouble, TrendingDown, TrendingUp } from 'lucide-react';

function ResourceTracker() {
  const { getResourceStats } = useApp();
  const resources = getResourceStats();

  const getPercentage = (used, total) => {
    if (total === 0) return 0;
    return Math.round((used / total) * 100);
  };

  const getStatusColor = (available, total) => {
    const percentage = (available / total) * 100;
    if (percentage > 50) return { bg: 'bg-green-500', text: 'text-green-400', border: 'border-green-500' };
    if (percentage > 25) return { bg: 'bg-yellow-500', text: 'text-yellow-400', border: 'border-yellow-500' };
    return { bg: 'bg-red-500', text: 'text-red-400', border: 'border-red-500' };
  };

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-white">Resource Allocation</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Real-time tracking</span>
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Teams */}
        <div className="p-4 rounded-lg bg-slate-800/40 border-l-4 border-l-blue-500">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Users className="h-5 w-5 text-blue-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-500 uppercase tracking-wider">Teams</p>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-white">{resources.teams.available}</span>
                <span className="text-sm text-slate-400">/ {resources.teams.total}</span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Available</span>
              <span className="text-slate-400">{getPercentage(resources.teams.available, resources.teams.total)}%</span>
            </div>
            <div className="w-full bg-slate-700/50 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${getStatusColor(resources.teams.available, resources.teams.total).bg}`}
                style={{ width: `${getPercentage(resources.teams.available, resources.teams.total)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs mt-2">
              <span className="text-slate-600">Deployed</span>
              <span className="text-red-400 font-semibold">{resources.teams.deployed}</span>
            </div>
          </div>
        </div>

        {/* Personnel */}
        <div className="p-4 rounded-lg bg-slate-800/40 border-l-4 border-l-purple-500">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <User className="h-5 w-5 text-purple-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-500 uppercase tracking-wider">Personnel</p>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-white">{resources.personnel.available}</span>
                <span className="text-sm text-slate-400">/ {resources.personnel.total}</span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Available</span>
              <span className="text-slate-400">{getPercentage(resources.personnel.available, resources.personnel.total)}%</span>
            </div>
            <div className="w-full bg-slate-700/50 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${getStatusColor(resources.personnel.available, resources.personnel.total).bg}`}
                style={{ width: `${getPercentage(resources.personnel.available, resources.personnel.total)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs mt-2">
              <span className="text-slate-600">Deployed</span>
              <span className="text-red-400 font-semibold">{resources.personnel.deployed}</span>
            </div>
          </div>
        </div>

        {/* Ambulances */}
        <div className="p-4 rounded-lg bg-slate-800/40 border-l-4 border-l-red-500">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-red-500/20 rounded-lg">
              <Ambulance className="h-5 w-5 text-red-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-500 uppercase tracking-wider">Ambulances</p>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-white">{resources.ambulances.total}</span>
                <span className="text-sm text-slate-400">Total</span>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-slate-500">
              Available across {resources.ambulances.total} hospitals
            </p>
            <div className="flex items-center gap-2 mt-2">
              <div className={`w-full bg-green-500/20 rounded-full h-2`}>
                <div className="h-2 rounded-full bg-green-500" style={{ width: '100%' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Hospital Beds */}
        <div className="p-4 rounded-lg bg-slate-800/40 border-l-4 border-l-green-500">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <BedDouble className="h-5 w-5 text-green-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-500 uppercase tracking-wider">Hospital Beds</p>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-white">{resources.beds.available}</span>
                <span className="text-sm text-slate-400">/ {resources.beds.total}</span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Available</span>
              <span className="text-slate-400">{getPercentage(resources.beds.available, resources.beds.total)}%</span>
            </div>
            <div className="w-full bg-slate-700/50 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${getStatusColor(resources.beds.available, resources.beds.total).bg}`}
                style={{ width: `${getPercentage(resources.beds.available, resources.beds.total)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs mt-2">
              <span className="text-slate-600">Occupied</span>
              <span className="text-orange-400 font-semibold">{resources.beds.occupied}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Resource Alerts */}
      <div className="mt-4 space-y-2">
        {resources.teams.available === 0 && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-red-400" />
            <span className="text-sm text-red-400 font-semibold">⚠️ No teams available - All deployed</span>
          </div>
        )}
        {resources.teams.available <= 1 && resources.teams.available > 0 && (
          <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-yellow-400" />
            <span className="text-sm text-yellow-400 font-semibold">⚠️ Low team availability - Only {resources.teams.available} team on standby</span>
          </div>
        )}
        {resources.beds.available < 100 && (
          <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/30 flex items-center gap-2">
            <BedDouble className="h-4 w-4 text-orange-400" />
            <span className="text-sm text-orange-400 font-semibold">⚠️ Hospital capacity low - Only {resources.beds.available} beds available</span>
          </div>
        )}
        {resources.teams.available >= 3 && resources.beds.available > 200 && (
          <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-400" />
            <span className="text-sm text-green-400 font-semibold">✓ All resources at good capacity</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default ResourceTracker;
