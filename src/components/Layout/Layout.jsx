import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import Notifications from '../Notifications';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard,
  Bell,
  Map,
  Building2,
  Users,
  ClipboardList,
  ShieldAlert,
  Shield,
  Zap,
  Award,
  CheckSquare,
  FileText,
  RotateCcw,
  Radio,
  Droplets,
} from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/alerts', icon: Bell, label: 'Alerts' },
  { to: '/map', icon: Map, label: 'Map' },
  { to: '/hospitals', icon: Building2, label: 'Hospitals' },
  { to: '/teams', icon: Users, label: 'Teams' },
  { to: '/tasks', icon: CheckSquare, label: 'Operations' },
  { to: '/dams', icon: Droplets, label: 'Dams' },
  { to: '/reports', icon: FileText, label: 'EOC Reports' },
  { to: '/admin', icon: Shield, label: 'AI Admin' },
  { to: '/demo', icon: Zap, label: 'Demo Controls' },
];

const hazardTypeConfig = {
  flood: { label: 'Flood', color: 'from-blue-500 to-blue-700' },
  cyclone: { label: 'Cyclone', color: 'from-cyan-500 to-teal-600' },
  earthquake: { label: 'Earthquake', color: 'from-amber-500 to-orange-600' },
  'volcanic-eruption': { label: 'Volcanic Eruption', color: 'from-red-500 to-rose-700' },
  wildfire: { label: 'Wildfire', color: 'from-orange-500 to-red-600' },
  landslide: { label: 'Landslide', color: 'from-yellow-600 to-orange-600' },
};

function Layout({ children }) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const location = useLocation();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedTime = currentTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  const formattedDate = currentTime.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const { resetToDefaults, getStats, disasters } = useApp();
  const stats = getStats();

  // Get unique active disaster types
  const activeHazardTypes = [...new Set(disasters.filter(d => d.status !== 'completed').map(d => d.type))];
  const hazardBadges = activeHazardTypes
    .map(type => hazardTypeConfig[type])
    .filter(Boolean);

  return (
    <div className="flex h-screen w-screen overflow-hidden" style={{background: '#0f172a', color: '#f1f5f9'}}>
      {/* Global Notifications */}
      <Notifications />

      {/* Sidebar */}
      <aside className="flex h-full w-[72px] flex-col items-center py-4 gap-1 shrink-0" style={{backgroundColor: '#1e293b', borderRight: '1px solid #334155'}}>
        {/* Logo */}
        <div className="mb-4 flex flex-col items-center justify-center gap-1">
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: '#06b6d4',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <ShieldAlert className="h-6 w-6 text-white" />
          </div>
        </div>

        <div className="w-10 border-t border-gray-200 mb-2" />

        {/* Nav Items */}
        <nav className="flex flex-col items-center gap-1 flex-1">
          {navItems.map(({ to, icon: Icon, label }) => {
            const isActive =
              to === '/'
                ? location.pathname === '/' || location.pathname === '/dashboard'
                : location.pathname.startsWith(to);

            return (
              <NavLink
                key={to}
                to={to}
                end
                className="group relative"
                aria-label={label}
              >
                <div
                  style={{
                    display: 'flex',
                    height: '44px',
                    width: '44px',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '12px',
                    transition: 'all 0.2s ease',
                    backgroundColor: isActive ? '#06b6d4' : 'transparent',
                    color: isActive ? '#ffffff' : '#94a3b8'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = '#334155';
                      e.currentTarget.style.color = '#f1f5f9';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#94a3b8';
                    }
                  }}
                >
                  <Icon className="h-5 w-5" />
                </div>

                {/* Tooltip */}
                <div className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 rounded-md bg-gray-800 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-xl transition-opacity duration-200 group-hover:opacity-100 whitespace-nowrap">
                  {label}
                  <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-800" />
                </div>
              </NavLink>
            );
          })}
        </nav>
      </aside>

      {/* Main Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <header className="flex h-14 items-center justify-between px-6 shrink-0" style={{backgroundColor: '#1e293b', borderBottom: '1px solid #334155'}}>
            {/* Left: Branding */}
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold">
                <span style={{color: '#06b6d4'}}>
                  ResQ AI
                </span>
              </h1>
              <span className="hidden sm:inline-block h-4 w-px" style={{backgroundColor: '#334155'}} />
              <span className="hidden sm:inline-block text-sm font-medium" style={{color: '#cbd5e1'}}>
                Emergency Operations Center
              </span>
            </div>

            {/* Center: Active Hazard Badges - Only show when disasters exist */}
            {hazardBadges.length > 0 && (
              <div className="hidden lg:flex items-center gap-2">
                {hazardBadges.map(({ label, color }) => (
                  <span
                    key={label}
                    className={`inline-flex items-center rounded-full bg-gradient-to-r ${color} px-3 py-0.5 text-[10px] font-semibold tracking-wide text-white uppercase shadow-sm animate-pulse`}
                    title={`Active ${label} Disaster`}
                  >
                    {label}
                  </span>
                ))}
              </div>
            )}

            {/* No Active Disasters - Show Safe Status */}
            {hazardBadges.length === 0 && (
              <div className="hidden lg:flex items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500/50 px-4 py-1 text-xs font-bold tracking-wide uppercase shadow-lg">
                  ✓ All Clear
                </span>
              </div>
            )}

            {/* Right: Status + Clock */}
            <div className="flex items-center gap-3">
              {/* SOS Alert Badge */}
              {stats.pendingSosCount > 0 && (
                <NavLink
                  to="/reports"
                  className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 border border-red-200 text-red-700 text-xs font-bold hover:bg-red-100 transition-colors"
                  title={`${stats.pendingSosCount} pending civilian distress signals`}
                >
                  <Radio className="h-3.5 w-3.5 text-red-600" />
                  <span>{stats.pendingSosCount} SOS</span>
                </NavLink>
              )}

              {/* Quick Reset Button */}
              <button
                onClick={() => {
                  if (window.confirm('Reset all demo disasters, deployments, and storage to factory defaults?')) {
                    resetToDefaults();
                  }
                }}
                title="Reset state to initial defaults"
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition-colors"
              >
                <RotateCcw className="h-4 w-4" />
              </button>

              <div className="hidden md:flex items-center gap-2.5 bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                </span>
                <span className="text-xs text-emerald-400 font-bold tracking-wide uppercase">
                  24/7 Monitoring
                </span>
              </div>
              <div className="flex flex-col items-end leading-none bg-slate-800/50 px-3 py-2 rounded-lg border border-slate-700">
                <span className="text-base font-mono font-bold text-white tabular-nums">
                  {formattedTime}
                </span>
                <span className="text-[11px] text-slate-400 font-semibold">
                  {formattedDate}
                </span>
              </div>
            </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6" style={{backgroundColor: '#0f172a'}}>
          {children}
        </main>
      </div>
    </div>
  );
}

export default Layout;
