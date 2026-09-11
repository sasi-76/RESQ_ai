import { useState, useEffect } from 'react';
import { Cloud, Droplets, Wind, Activity, TrendingUp, MapPin, AlertCircle, RefreshCw } from 'lucide-react';
import { LiveDataPoller } from '../services/liveDataService';

function LiveDataDashboard() {
  const [liveData, setLiveData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [poller, setPoller] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    // Create and start poller
    const dataPoller = new LiveDataPoller((data) => {
      setLiveData(data);
      setLastUpdate(new Date());
      setLoading(false);
      console.log('📡 Live data updated:', data);
    }, 60); // Update every 60 seconds

    dataPoller.start();
    setPoller(dataPoller);

    // Cleanup on unmount
    return () => {
      if (dataPoller) {
        dataPoller.stop();
      }
    };
  }, []);

  const toggleAutoRefresh = () => {
    if (autoRefresh && poller) {
      poller.stop();
    } else if (!autoRefresh && poller) {
      poller.start();
    }
    setAutoRefresh(!autoRefresh);
  };

  const manualRefresh = () => {
    if (poller) {
      setLoading(true);
      poller.fetch();
    }
  };

  if (loading) {
    return (
      <div className="glass-card p-8 text-center">
        <RefreshCw className="h-8 w-8 text-blue-400 mx-auto mb-3 animate-spin" />
        <p className="text-sm text-slate-400">Loading live Tamil Nadu data...</p>
      </div>
    );
  }

  if (!liveData) {
    return (
      <div className="glass-card p-8 text-center">
        <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-3" />
        <p className="text-sm text-slate-400">Failed to load live data</p>
      </div>
    );
  }

  const { cities, earthquakes, highRiskAreas, overallRisk } = liveData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Activity className="h-5 w-5 text-green-400 animate-pulse" />
            Live Tamil Nadu Data
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            {lastUpdate && `Last updated: ${lastUpdate.toLocaleTimeString()}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleAutoRefresh}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              autoRefresh
                ? 'bg-green-600 text-white'
                : 'bg-slate-700 text-slate-400'
            }`}
          >
            {autoRefresh ? '🟢 Auto' : '⚫ Manual'}
          </button>
          <button
            onClick={manualRefresh}
            disabled={loading}
            className="p-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg transition-all disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 text-white ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Overall Risk */}
      <div className="glass-card p-4 border-l-4 border-l-blue-500">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 uppercase mb-1">Overall TN Risk</p>
            <p className="text-2xl font-bold text-white">{overallRisk}%</p>
          </div>
          <div className="w-20 h-20 rounded-full border-4 border-slate-700 flex items-center justify-center"
               style={{
                 borderColor: overallRisk >= 75 ? '#ef4444' : overallRisk >= 50 ? '#f97316' : overallRisk >= 25 ? '#eab308' : '#22c55e'
               }}>
            <span className="text-xl font-bold text-white">{overallRisk}</span>
          </div>
        </div>
      </div>

      {/* High Risk Areas */}
      {highRiskAreas.length > 0 && (
        <div className="glass-card p-4 border-l-4 border-l-red-500 bg-red-500/5">
          <h4 className="text-sm font-bold text-red-400 mb-3 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            High Risk Areas ({highRiskAreas.length})
          </h4>
          <div className="space-y-2">
            {highRiskAreas.slice(0, 3).map(area => (
              <div key={area.city} className="p-2 bg-slate-800/40 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-white">{area.city}</span>
                  <span className="text-sm font-bold text-red-400">{area.riskPercent}%</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {area.condition} • {area.rainfall.toFixed(1)}mm rain • {area.windSpeed}km/h wind
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* City Weather Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cities.slice(0, 8).map(city => (
          <div key={city.city} className="glass-card p-3">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h5 className="text-sm font-bold text-white">{city.city}</h5>
                <p className="text-xs text-slate-500">{city.condition}</p>
              </div>
              <span className={`text-lg font-bold ${
                city.riskPercent >= 75 ? 'text-red-400' :
                city.riskPercent >= 50 ? 'text-orange-400' :
                city.riskPercent >= 25 ? 'text-yellow-400' : 'text-green-400'
              }`}>
                {city.riskPercent}%
              </span>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs">
                <Cloud className="h-3 w-3 text-slate-500" />
                <span className="text-slate-300">{city.temp}°C</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Droplets className="h-3 w-3 text-blue-400" />
                <span className="text-slate-300">{city.rainfall.toFixed(1)}mm</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Wind className="h-3 w-3 text-cyan-400" />
                <span className="text-slate-300">{city.windSpeed}km/h</span>
              </div>
              {city.isMock && (
                <span className="text-[10px] text-slate-600 italic">Simulated</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Earthquakes */}
      {earthquakes.length > 0 && (
        <div className="glass-card p-4">
          <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <Activity className="h-4 w-4 text-orange-400" />
            Recent Earthquakes ({earthquakes.length})
          </h4>
          <div className="space-y-2">
            {earthquakes.slice(0, 5).map(eq => (
              <div key={eq.id} className="p-2 bg-slate-800/40 rounded-lg flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${
                      eq.magnitude >= 5 ? 'text-red-400' :
                      eq.magnitude >= 4 ? 'text-orange-400' :
                      eq.magnitude >= 3 ? 'text-yellow-400' : 'text-green-400'
                    }`}>
                      M{eq.magnitude.toFixed(1)}
                    </span>
                    <span className="text-xs text-slate-400">{eq.location}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {new Date(eq.timestamp).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <span className="text-[10px] text-slate-600">
                  {eq.depth.toFixed(1)}km deep
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default LiveDataDashboard;
