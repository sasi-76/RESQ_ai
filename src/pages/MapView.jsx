import { useEffect, useState } from 'react';
import { Map, MapPin, AlertCircle } from 'lucide-react';
import { monitoredAreas } from '../data/mockData';

const priorityColors = { P1: '#ef4444', P2: '#f97316', P3: '#eab308', P4: '#22c55e' };

function MapView() {
  const [map, setMap] = useState(null);
  const [selectedArea, setSelectedArea] = useState(null);

  useEffect(() => {
    // Dynamically import Leaflet to avoid SSR issues
    if (typeof window !== 'undefined') {
      import('leaflet').then((L) => {
        // Initialize map centered on Cuddalore region
        const mapInstance = L.map('map-container').setView([11.75, 79.77], 9);

        // Add OpenStreetMap tiles with dark theme
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19,
        }).addTo(mapInstance);

        // Add a dark filter overlay
        const darkPane = mapInstance.createPane('darkPane');
        darkPane.style.zIndex = 250;
        darkPane.style.pointerEvents = 'none';

        // Add 100km radius circle
        L.circle([11.75, 79.77], {
          color: '#3b82f6',
          fillColor: '#3b82f6',
          fillOpacity: 0.05,
          radius: 100000, // 100km in meters
          weight: 2,
          dashArray: '10, 10',
        }).addTo(mapInstance).bindPopup('100 km Monitoring Radius');

        // Add markers for each monitored area
        monitoredAreas.forEach((area) => {
          const color = priorityColors[area.priority];
          const radius = 5000 + (area.riskPercent / 100) * 15000; // Size based on risk

          // Create custom icon
          const icon = L.divIcon({
            className: 'custom-marker',
            html: `
              <div style="position: relative;">
                <div style="
                  width: ${20 + area.riskPercent / 5}px;
                  height: ${20 + area.riskPercent / 5}px;
                  background: ${color};
                  border: 3px solid white;
                  border-radius: 50%;
                  box-shadow: 0 0 10px rgba(0,0,0,0.5), 0 0 20px ${color}80;
                  animation: ${area.priority === 'P1' ? 'pulse 2s infinite' : 'none'};
                "></div>
              </div>
            `,
            iconSize: [30, 30],
            iconAnchor: [15, 15],
          });

          // Add marker
          const marker = L.marker([area.lat, area.lng], { icon })
            .addTo(mapInstance)
            .bindPopup(
              `
              <div style="font-family: Inter, sans-serif; min-width: 200px;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                  <strong style="font-size: 14px; color: #1e293b;">${area.name}</strong>
                  <span style="background: ${color}30; color: ${color}; padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: bold;">${area.priority}</span>
                </div>
                <div style="color: #64748b; font-size: 12px; line-height: 1.6;">
                  <div><strong>Risk:</strong> <span style="color: ${color}; font-weight: bold;">${area.riskPercent}%</span></div>
                  <div><strong>Population:</strong> ${area.population.toLocaleString()}</div>
                  <div><strong>Primary Hazard:</strong> Flood (${area.hazards.flood}%)</div>
                  <div><strong>Status:</strong> ${area.status}</div>
                </div>
              </div>
            `
            );

          // Add circle overlay for risk visualization
          L.circle([area.lat, area.lng], {
            color: color,
            fillColor: color,
            fillOpacity: 0.15,
            radius: radius,
            weight: 2,
          }).addTo(mapInstance);

          // Add click event
          marker.on('click', () => {
            setSelectedArea(area);
          });
        });

        // Add controller location marker
        L.marker([11.75, 79.77], {
          icon: L.divIcon({
            className: 'controller-marker',
            html: `
              <div style="
                width: 16px;
                height: 16px;
                background: #3b82f6;
                border: 3px solid white;
                border-radius: 50%;
                box-shadow: 0 0 10px rgba(59, 130, 246, 0.8);
              "></div>
            `,
            iconSize: [16, 16],
            iconAnchor: [8, 8],
          }),
        })
          .addTo(mapInstance)
          .bindPopup('<strong>Controller Location</strong><br/>Emergency Operations Center');

        setMap(mapInstance);

        // Cleanup
        return () => {
          mapInstance.remove();
        };
      });
    }
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <Map className="h-7 w-7 text-blue-400" />
          Area Analysis & Prioritization
        </h2>
        <p className="text-sm text-slate-400 mt-1">Within 100 km Radius - Live Map View</p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Map Container */}
        <div className="lg:col-span-3 glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Interactive Map</h3>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
              </span>
              <span className="text-[10px] text-green-400 font-medium">LIVE</span>
            </div>
          </div>

          {/* Map */}
          <div
            id="map-container"
            className="w-full h-[500px] rounded-xl overflow-hidden border-2 border-slate-700/50 relative"
            style={{ zIndex: 1 }}
          />

          {/* Legend */}
          <div className="mt-4 flex items-center justify-center gap-6 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500 shadow-lg shadow-red-500/50" />
              <span className="text-xs text-slate-400">Critical (P1)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500 shadow-lg shadow-orange-500/50" />
              <span className="text-xs text-slate-400">High (P2)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500 shadow-lg shadow-yellow-500/50" />
              <span className="text-xs text-slate-400">Medium (P3)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500 shadow-lg shadow-green-500/50" />
              <span className="text-xs text-slate-400">Low (P4)</span>
            </div>
          </div>

          <div className="mt-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
            <p className="text-xs text-blue-400 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Click on any marker to see detailed area information
            </p>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-2 space-y-4">
          {/* Info Box */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">Map Features</h3>
            <div className="space-y-2 text-xs text-slate-400">
              <div className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">•</span>
                <span>Interactive map with zoom and pan</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">•</span>
                <span>100 km monitoring radius (blue circle)</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">•</span>
                <span>Color-coded risk zones by priority</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">•</span>
                <span>Marker size represents risk percentage</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">•</span>
                <span>Pulse animation on critical (P1) areas</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">•</span>
                <span>Click markers for detailed information</span>
              </div>
            </div>
          </div>

          {/* Selected Area Details */}
          {selectedArea && (
            <div className="glass-card p-5 border-l-4 animate-slide-up" style={{ borderLeftColor: priorityColors[selectedArea.priority] }}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-bold text-white">{selectedArea.name}</h3>
                <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ background: `${priorityColors[selectedArea.priority]}20`, color: priorityColors[selectedArea.priority] }}>
                  {selectedArea.priority}
                </span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Risk Level:</span>
                  <span className="font-bold" style={{ color: priorityColors[selectedArea.priority] }}>{selectedArea.riskPercent}%</span>
                </div>
                <div className="w-full bg-slate-700/50 rounded-full h-2">
                  <div className="h-2 rounded-full transition-all duration-500" style={{ width: `${selectedArea.riskPercent}%`, background: priorityColors[selectedArea.priority] }} />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Population:</span>
                  <span className="text-white font-medium">{selectedArea.population.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Primary Hazard:</span>
                  <span className="text-blue-400 font-semibold">Flood ({selectedArea.hazards.flood}%)</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Status:</span>
                  <span className="text-yellow-400 font-medium capitalize">{selectedArea.status}</span>
                </div>
              </div>
            </div>
          )}

          {/* Area List */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">Monitored Areas ({monitoredAreas.length})</h3>
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
              {monitoredAreas.map((area) => (
                <button
                  key={area.id}
                  onClick={() => {
                    setSelectedArea(area);
                    if (map) {
                      map.setView([area.lat, area.lng], 11);
                    }
                  }}
                  className="w-full p-3 rounded-lg bg-slate-800/40 hover:bg-slate-800/60 transition-colors border border-slate-700/30 hover:border-slate-600/50 text-left"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" style={{ color: priorityColors[area.priority] }} />
                      <span className="text-sm font-semibold text-white">{area.name}</span>
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: `${priorityColors[area.priority]}20`, color: priorityColors[area.priority] }}>
                      {area.priority}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Risk: </span>
                    <span className="font-bold" style={{ color: priorityColors[area.priority] }}>{area.riskPercent}%</span>
                  </div>
                  <div className="w-full bg-slate-700/50 rounded-full h-1.5 mt-2">
                    <div className="h-1.5 rounded-full transition-all duration-500" style={{ width: `${area.riskPercent}%`, background: priorityColors[area.priority] }} />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CSS for pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.7; }
        }

        .leaflet-popup-content-wrapper {
          background: white;
          border-radius: 12px;
          box-shadow: 0 3px 14px rgba(0,0,0,0.4);
        }

        .leaflet-popup-tip {
          background: white;
        }

        #map-container .leaflet-tile-pane {
          filter: brightness(0.7) contrast(1.1);
        }
      `}</style>
    </div>
  );
}

export default MapView;
