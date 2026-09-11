/**
 * EXAMPLE: Dashboard Component with Real-Time Data Integration
 *
 * This shows how to replace mock data with live API data
 * Copy this code to src/pages/Dashboard.jsx when ready for production
 */

import { useState, useEffect } from 'react';
import { DataPollingService, fetchAllAreasData } from '../services/dataIntegration';
import { monitoredAreas } from '../data/mockData';

function DashboardWithRealData() {
  // State for real-time data
  const [liveData, setLiveData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [dataSource, setDataSource] = useState('mock'); // 'mock' or 'live'

  // Option 1: Manual Fetch (one-time)
  const fetchDataManually = async () => {
    setIsLoading(true);
    try {
      const data = await fetchAllAreasData(monitoredAreas);
      console.log('📊 Fetched real-time data:', data);
      setLiveData(data);
      setLastUpdate(new Date());
      setDataSource('live');
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Option 2: Polling Service (continuous updates)
  useEffect(() => {
    // Only start if user enables live data
    if (dataSource !== 'live') return;

    console.log('🚀 Starting real-time data polling...');

    const pollingService = new DataPollingService(
      monitoredAreas,
      30000 // Poll every 30 seconds
    );

    pollingService.start((data) => {
      console.log('📡 Real-time update received:', data);
      setLiveData(data);
      setLastUpdate(new Date());
      setIsLoading(false);
    });

    // Cleanup on unmount
    return () => {
      console.log('🛑 Stopping data polling');
      pollingService.stop();
    };
  }, [dataSource]);

  return (
    <div className="space-y-6">
      {/* Data Source Toggle */}
      <div className="glass-card p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-slate-300">Data Source:</span>
          <div className="flex gap-2">
            <button
              onClick={() => setDataSource('mock')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                dataSource === 'mock'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'
              }`}
            >
              Mock Data
            </button>
            <button
              onClick={() => {
                setDataSource('live');
                fetchDataManually();
              }}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                dataSource === 'live'
                  ? 'bg-green-600 text-white'
                  : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'
              }`}
            >
              🔴 Live Data (API)
            </button>
          </div>
        </div>

        {lastUpdate && (
          <div className="text-xs text-slate-400">
            Last update: {lastUpdate.toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* Loading State */}
      {isLoading && dataSource === 'live' && (
        <div className="glass-card p-8 text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-slate-300">Fetching real-time disaster data...</p>
          <p className="text-xs text-slate-500 mt-2">
            Connecting to: Weather API, Earthquake API, River Gauges
          </p>
        </div>
      )}

      {/* Real-Time Data Display */}
      {!isLoading && dataSource === 'live' && liveData.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-white">Real-Time Data from Live APIs</h3>

          {liveData.map((area) => (
            <div key={area.areaId} className="glass-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-base font-bold text-white">{area.areaName}</h4>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    area.risk?.riskPercent >= 70
                      ? 'bg-red-500/20 text-red-400'
                      : area.risk?.riskPercent >= 40
                      ? 'bg-orange-500/20 text-orange-400'
                      : 'bg-green-500/20 text-green-400'
                  }`}
                >
                  Risk: {area.risk?.riskPercent || 0}%
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Weather Data */}
                <div className="p-3 rounded-lg bg-slate-800/40">
                  <p className="text-xs text-slate-500 mb-1">Temperature</p>
                  <p className="text-lg font-bold text-white">
                    {area.weather?.temperature?.toFixed(1) || 'N/A'}°C
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-800/40">
                  <p className="text-xs text-slate-500 mb-1">Rainfall</p>
                  <p className="text-lg font-bold text-blue-400">
                    {area.rainfall?.rainfall1h?.toFixed(1) || 0} mm
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-800/40">
                  <p className="text-xs text-slate-500 mb-1">Wind Speed</p>
                  <p className="text-lg font-bold text-purple-400">
                    {area.weather?.windSpeed?.toFixed(1) || 0} km/h
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-800/40">
                  <p className="text-xs text-slate-500 mb-1">Earthquakes</p>
                  <p className="text-lg font-bold text-orange-400">
                    {area.earthquakes?.length || 0} recent
                  </p>
                </div>
              </div>

              {/* Risk Contributors */}
              <div className="mt-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                <p className="text-xs font-semibold text-blue-400 mb-2">Risk Factors:</p>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
                  <div>
                    🌧️ Rainfall: {area.risk?.contributors?.rainfall?.toFixed(1) || 0}mm
                  </div>
                  <div>
                    🌊 Water Level: {area.risk?.contributors?.waterLevel?.toFixed(1) || 0}m
                  </div>
                  <div>
                    💨 Wind: {area.risk?.contributors?.windSpeed?.toFixed(1) || 0}km/h
                  </div>
                  <div>
                    📊 Pressure: {area.risk?.contributors?.pressure || 'N/A'}mb
                  </div>
                </div>
              </div>

              {/* Data Source Info */}
              <div className="mt-3 text-xs text-slate-500">
                Data from: OpenWeatherMap, USGS Earthquake API | Updated: {new Date(area.timestamp).toLocaleTimeString()}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Mock Data Display */}
      {dataSource === 'mock' && (
        <div className="glass-card p-5">
          <p className="text-sm text-slate-400">
            Currently showing <span className="font-bold text-blue-400">mock/demo data</span>.
            Click "🔴 Live Data (API)" above to fetch real-time disaster data from APIs.
          </p>
          <p className="text-xs text-slate-500 mt-2">
            Note: You need API keys in .env file to fetch live data. See REAL_TIME_DATA_INTEGRATION.md for setup.
          </p>
        </div>
      )}

      {/* API Status */}
      <div className="glass-card p-4">
        <h4 className="text-sm font-semibold text-slate-300 mb-3">API Status</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-slate-400">USGS Earthquake</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className={`w-2 h-2 rounded-full ${import.meta.env.VITE_OPENWEATHER_API_KEY ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-slate-400">OpenWeatherMap</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className={`w-2 h-2 rounded-full ${import.meta.env.VITE_IMD_API_KEY ? 'bg-green-500' : 'bg-yellow-500'}`} />
            <span className="text-slate-400">IMD Weather</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardWithRealData;
