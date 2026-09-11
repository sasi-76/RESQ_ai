import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import Notifications from '../Notifications';
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
} from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/alerts', icon: Bell, label: 'Alerts' },
  { to: '/map', icon: Map, label: 'Map' },
  { to: '/hospitals', icon: Building2, label: 'Hospitals' },
  { to: '/teams', icon: Users, label: 'Teams' },
  { to: '/missions', icon: Award, label: 'Missions' },
  { to: '/recommendations', icon: ClipboardList, label: 'Recommendations' },
  { to: '/admin', icon: Shield, label: 'AI Admin' },
  { to: '/demo', icon: Zap, label: 'Demo Controls' },
];

const hazardBadges = [
  { label: 'Flood', color: 'from-blue-500 to-blue-700' },
  { label: 'Cyclone', color: 'from-cyan-500 to-teal-600' },
  { label: 'Earthquake', color: 'from-amber-500 to-orange-600' },
  { label: 'Volcanic Eruption', color: 'from-red-500 to-rose-700' },
];

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

          {/* Center: Hazard Badges */}
          <div className="hidden lg:flex items-center gap-2">
            {hazardBadges.map(({ label, color }) => (
              <span
                key={label}
                className={`inline-flex items-center rounded-full bg-gradient-to-r ${color} px-3 py-0.5 text-[10px] font-semibold tracking-wide text-white uppercase shadow-sm`}
              >
                {label}
              </span>
            ))}
          </div>

          {/* Right: Status + Clock */}
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
              </span>
              <span className="text-[11px] text-slate-400 font-medium tracking-wide uppercase">
                Controller Operated | 24/7 Monitoring
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
