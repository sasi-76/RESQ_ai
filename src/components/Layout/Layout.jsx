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
  Waves,
} from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/alerts', icon: Bell, label: 'Alerts' },
  { to: '/map', icon: Map, label: 'Map' },
  { to: '/dams', icon: Waves, label: 'Dams & Reservoirs' },
  { to: '/hospitals', icon: Building2, label: 'Hospitals' },
  { to: '/teams', icon: Users, label: 'Teams' },
  { to: '/tasks', icon: CheckSquare, label: 'Field Tasks' },
  { to: '/missions', icon: Award, label: 'Missions' },
  { to: '/recommendations', icon: ClipboardList, label: 'Recommendations' },
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
  const activeHazardTypes = [...new Set(disasters.map(d => d.type))];
  const hazardBadges = activeHazardTypes
    .map(type => hazardTypeConfig[type])
    .filter(Boolean);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-900 text-slate-100">
      {/* Global Notifications */}
      <Notifications />

      {/* Sidebar */}
      <aside className="flex h-full w-[72px] flex-col items-center bg-slate-950 border-r border-slate-800/60 py-4 gap-1 shrink-0">
        {/* Logo */}
        <div className="mb-4 flex flex-col items-center justify-center gap-0.5">
          <ShieldAlert className="h-8 w-8 text-blue-400" />
          <span className="text-[9px] font-bold tracking-widest text-blue-400 uppercase">
            ResQ
          </span>
        </div>

        <div className="w-10 border-t border-slate-700/50 mb-2" />

        {/* Nav Items */}
        <nav className="flex flex-col items-center gap-1 flex-1 overflow-y-auto overflow-x-hidden scrollbar-none py-0.5">
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
                  className={`flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/20'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>

                {/* Tooltip */}
                <div className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 rounded-md bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-slate-100 opacity-0 shadow-xl transition-opacity duration-200 group-hover:opacity-100 whitespace-nowrap border border-slate-700/50">
                  {label}
                  <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-800" />
                </div>
              </NavLink>
            );
          })}
        </nav>
      </aside>

      {/* Main Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <header className="flex h-14 items-center justify-between border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-sm px-6 shrink-0">
            {/* Left: Branding */}
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-bold tracking-wide">
                <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  RESQAI
                </span>
              </h1>
              <span className="hidden sm:inline-block h-4 w-px bg-slate-700" />
              <span className="hidden sm:inline-block text-[11px] text-slate-500 font-medium tracking-wide uppercase">
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
                <span className="inline-flex items-center rounded-full bg-gradient-to-r from-green-500 to-emerald-600 px-3 py-0.5 text-[10px] font-semibold tracking-wide text-white uppercase shadow-sm">
                  All Clear
                </span>
              </div>
            )}

            {/* Right: Status + Clock */}
            <div className="flex items-center gap-3">
              {/* SOS Alert Badge */}
              {stats.pendingSosCount > 0 && (
                <NavLink
                  to="/reports"
                  className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-bold animate-pulse hover:bg-red-500/30 transition-colors"
                  title={`${stats.pendingSosCount} pending civilian distress signals`}
                >
                  <Radio className="h-3.5 w-3.5 text-red-400" />
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
                className="p-1.5 text-slate-500 hover:text-slate-300 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>

              <div className="hidden md:flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
                </span>
                <span className="text-[11px] text-slate-400 font-medium tracking-wide uppercase">
                  24/7 Monitoring
                </span>
              </div>
              <div className="flex flex-col items-end leading-none">
                <span className="text-sm font-mono font-semibold text-slate-200 tabular-nums">
                  {formattedTime}
                </span>
                <span className="text-[10px] text-slate-500 font-medium">
                  {formattedDate}
                </span>
              </div>
            </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

export default Layout;
