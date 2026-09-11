import { useApp } from '../context/AppContext';
import { X, AlertTriangle, CheckCircle, Info, Users } from 'lucide-react';

const severityConfig = {
  critical: { bg: 'bg-red-500/20', border: 'border-l-red-500', icon: AlertTriangle, iconColor: 'text-red-400' },
  high: { bg: 'bg-orange-500/20', border: 'border-l-orange-500', icon: AlertTriangle, iconColor: 'text-orange-400' },
  medium: { bg: 'bg-yellow-500/20', border: 'border-l-yellow-500', icon: Info, iconColor: 'text-yellow-400' },
  low: { bg: 'bg-blue-500/20', border: 'border-l-blue-500', icon: Info, iconColor: 'text-blue-400' },
  team: { bg: 'bg-green-500/20', border: 'border-l-green-500', icon: Users, iconColor: 'text-green-400' },
};

function Notifications() {
  const { notifications, removeNotification } = useApp();

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-20 right-6 z-50 space-y-3 max-w-md">
      {notifications.map((notification) => {
        const config = severityConfig[notification.severity] || severityConfig.medium;
        const Icon = config.icon;

        return (
          <div
            key={notification.id}
            className={`glass-card p-4 border-l-4 ${config.border} ${config.bg} shadow-xl animate-slide-in`}
          >
            <div className="flex items-start gap-3">
              <Icon className={`h-5 w-5 ${config.iconColor} flex-shrink-0 mt-0.5`} />
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-white mb-1">{notification.title}</h4>
                <p className="text-xs text-slate-300">{notification.message}</p>
              </div>
              <button
                onClick={() => removeNotification(notification.id)}
                className="p-1 hover:bg-white/10 rounded transition-colors flex-shrink-0"
              >
                <X className="h-4 w-4 text-slate-400" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default Notifications;
