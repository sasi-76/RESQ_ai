import { useState, useEffect } from 'react';
import { Server, Wifi, WifiOff, RefreshCw } from 'lucide-react';

export default function ControllerStatus() {
  const [controllers, setControllers] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchStatuses = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/heartbeat/status');
      const json = await res.json();
      if (json.success) setControllers(json.data);
    } catch (err) {
      console.warn('[Controllers] Fetch failed:', err.message);
    }
  };

  useEffect(() => {
    fetchStatuses();
    const interval = setInterval(fetchStatuses, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleSimulateDisconnect = async (controllerId) => {
    setLoading(true);
    try {
      await fetch('http://localhost:5000/api/heartbeat/simulate-disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ controllerId }),
      });
      setTimeout(fetchStatuses, 1000);
    } catch (err) {
      console.warn(err);
    }
    setLoading(false);
  };

  const handleSimulateReconnect = async (controllerId) => {
    setLoading(true);
    try {
      await fetch('http://localhost:5000/api/heartbeat/simulate-reconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ controllerId }),
      });
      setTimeout(fetchStatuses, 1000);
    } catch (err) {
      console.warn(err);
    }
    setLoading(false);
  };

  if (!controllers.length) return null;

  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Server className="h-4 w-4 text-cyan-400" />
          Regional Controller Network
        </h3>
        <button onClick={fetchStatuses} className="p-1.5 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors">
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {controllers.map((ctrl) => {
          const isOnline = ctrl.status === 'online';
          return (
            <div
              key={ctrl.id}
              className={`p-3 rounded-lg border transition-all ${
                isOnline
                  ? 'bg-slate-800/50 border-slate-700/50'
                  : 'bg-red-500/10 border-red-500/30 animate-pulse'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    {!isOnline && (
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    )}
                    <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isOnline ? 'bg-emerald-400' : 'bg-red-500'}`}></span>
                  </span>
                  <span className="text-xs font-semibold text-white">{ctrl.region}</span>
                </div>
                {isOnline ? (
                  <Wifi className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <WifiOff className="h-3.5 w-3.5 text-red-400" />
                )}
              </div>

              <p className="text-[10px] text-slate-500 mb-2 truncate">{ctrl.district}</p>

              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-mono ${isOnline ? 'text-emerald-400' : 'text-red-400'}`}>
                  {isOnline ? 'ONLINE' : 'UNREACHABLE'}
                </span>
                {isOnline ? (
                  <button
                    onClick={() => handleSimulateDisconnect(ctrl.id)}
                    disabled={loading}
                    className="text-[10px] px-2 py-0.5 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors border border-red-500/30"
                  >
                    Simulate Down
                  </button>
                ) : (
                  <button
                    onClick={() => handleSimulateReconnect(ctrl.id)}
                    disabled={loading}
                    className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors border border-emerald-500/30"
                  >
                    Reconnect
                  </button>
                )}
              </div>

              {ctrl.lastSeenAgo != null && (
                <p className="text-[10px] text-slate-600 mt-1">
                  Last seen: {ctrl.lastSeenAgo < 60 ? `${ctrl.lastSeenAgo}s ago` : `${Math.floor(ctrl.lastSeenAgo / 60)}m ago`}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-[10px] text-slate-600 mt-2 text-center">
        Heartbeat interval: 60s · Timeout threshold: 5 min
      </p>
    </div>
  );
}
