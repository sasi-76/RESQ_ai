import { useState } from 'react';
import { ClipboardList, CheckCircle2, Circle, AlertCircle, Phone, ChevronDown, ChevronUp } from 'lucide-react';
import { recommendations as initialRecs, emergencyContacts } from '../data/mockData';

const loopSteps = [
  { label: 'Monitor', color: '#3b82f6' },
  { label: 'Detect Change', color: '#8b5cf6' },
  { label: 'Analyse', color: '#22c55e' },
  { label: 'Alert', color: '#ef4444' },
  { label: 'Prioritize', color: '#f59e0b' },
  { label: 'Deploy', color: '#8b5cf6' },
  { label: 'Rescue', color: '#06b6d4' },
  { label: 'Update', color: '#d946ef' },
];

function Recommendations() {
  const [recs, setRecs] = useState(initialRecs);
  const [expanded, setExpanded] = useState({});

  const handleToggle = (id) => {
    setRecs(prev => prev.map(r => r.id === id ? { ...r, status: r.status === 'completed' ? 'pending' : 'completed' } : r));
  };

  const toggleExpand = (id) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const priorityConfig = {
    immediate: { color: '#ef4444', bg: 'bg-red-500/20', text: 'text-red-400', label: 'IMMEDIATE' },
    high: { color: '#f97316', bg: 'bg-orange-500/20', text: 'text-orange-400', label: 'HIGH' },
    ongoing: { color: '#3b82f6', bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'ONGOING' },
  };

  const statusConfig = {
    pending: { color: '#ef4444', icon: Circle, label: 'Pending' },
    'in-progress': { color: '#eab308', icon: AlertCircle, label: 'In Progress' },
    completed: { color: '#22c55e', icon: CheckCircle2, label: 'Completed' },
    active: { color: '#3b82f6', icon: CheckCircle2, label: 'Active' },
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <ClipboardList className="h-7 w-7 text-blue-400" />
          Measures & Recommendations
        </h2>
        <p className="text-sm text-slate-400 mt-1">For Authorities</p>
      </div>

      {/* Info Box */}
      <div className="glass-card p-5 border-l-4 border-l-blue-500 bg-blue-500/5">
        <h3 className="text-sm font-semibold text-blue-400 mb-2">What should authorities do right now, and with what?</h3>
        <p className="text-xs text-slate-400">This dashboard provides real-time actionable recommendations based on AI analysis of current hazard conditions, resource availability, and affected areas.</p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recommendations List */}
        <div className="lg:col-span-2 space-y-4">
          {recs.map(rec => {
            const pConfig = priorityConfig[rec.priority];
            const sConfig = statusConfig[rec.status];
            const StatusIcon = sConfig.icon;
            const isExpanded = expanded[rec.id];
            const isCompleted = rec.status === 'completed';

            return (
              <div key={rec.id} className={`glass-card p-5 border-l-4 transition-all ${isCompleted ? 'border-l-green-500 bg-green-500/5 opacity-75' : `border-l-[${pConfig.color}]`}`} style={{ borderLeftColor: isCompleted ? '#22c55e' : pConfig.color }}>
                <div className="flex items-start gap-4">
                  {/* Checkbox */}
                  <button onClick={() => handleToggle(rec.id)} className="mt-1 shrink-0">
                    {isCompleted ? (
                      <CheckCircle2 className="h-6 w-6 text-green-400" />
                    ) : (
                      <Circle className="h-6 w-6 text-slate-500 hover:text-slate-300 transition-colors" />
                    )}
                  </button>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-1 rounded-md bg-purple-500/20 text-purple-300 text-[10px] font-bold uppercase tracking-wider">
                            {rec.category}
                          </span>
                        </div>
                        <h4 className={`text-base font-semibold mb-2 ${isCompleted ? 'text-slate-500 line-through' : 'text-white'}`}>
                          {rec.action}
                        </h4>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={`px-2 py-1 rounded-full ${pConfig.bg} ${pConfig.text} text-[10px] font-bold uppercase tracking-wider`}>
                          {pConfig.label}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <StatusIcon className="h-3 w-3" style={{ color: sConfig.color }} />
                          <span className="text-[10px] font-medium" style={{ color: sConfig.color }}>
                            {sConfig.label}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Details Toggle */}
                    <button onClick={() => toggleExpand(rec.id)} className="flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300 transition-colors mb-2">
                      {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      <span>{isExpanded ? 'Hide' : 'Show'} Details</span>
                    </button>

                    {isExpanded && (
                      <div className="p-3 rounded-lg bg-slate-800/40 text-xs text-slate-300 leading-relaxed animate-slide-up">
                        {rec.details}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Emergency Contacts */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">Emergency Contacts</h3>
            <div className="space-y-3">
              {emergencyContacts.map((contact, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/40 hover:bg-slate-800/60 transition-colors">
                  <div className="p-2 rounded-full bg-green-500/20">
                    <Phone className="h-4 w-4 text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{contact.number}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wide">{contact.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Progress Summary */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">Action Summary</h3>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-400">Completed</span>
                  <span className="text-xs font-bold text-green-400">{recs.filter(r => r.status === 'completed').length}/{recs.length}</span>
                </div>
                <div className="w-full bg-slate-700/50 rounded-full h-2">
                  <div className="h-2 rounded-full bg-green-500 transition-all duration-500" style={{ width: `${(recs.filter(r => r.status === 'completed').length / recs.length) * 100}%` }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-400">In Progress</span>
                  <span className="text-xs font-bold text-yellow-400">{recs.filter(r => r.status === 'in-progress').length}/{recs.length}</span>
                </div>
                <div className="w-full bg-slate-700/50 rounded-full h-2">
                  <div className="h-2 rounded-full bg-yellow-500 transition-all duration-500" style={{ width: `${(recs.filter(r => r.status === 'in-progress').length / recs.length) * 100}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Continuous Loop Visualization */}
      <div className="glass-card p-6">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-6 text-center">Continuous Loop</h3>
        <p className="text-xs text-slate-500 text-center mb-6">The system keeps monitoring 24/7 and updates when there is a hazard risk or change detected</p>

        <div className="flex items-center justify-center gap-3 flex-wrap">
          {loopSteps.map((step, idx) => (
            <div key={idx} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className="flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all" style={{ borderColor: step.color, backgroundColor: `${step.color}20` }}>
                  <span className="text-xs font-bold" style={{ color: step.color }}>{idx + 1}</span>
                </div>
                <span className="text-[9px] font-semibold text-slate-400 mt-1.5 uppercase tracking-wider whitespace-nowrap">
                  {step.label}
                </span>
              </div>
              {idx < loopSteps.length - 1 && (
                <div className="w-8 h-0.5 mx-2 bg-gradient-to-r from-slate-600 to-slate-700 relative">
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0 border-t-4 border-t-transparent border-b-4 border-b-transparent border-l-4 border-l-slate-700" />
                </div>
              )}
            </div>
          ))}
          {/* Arrow back to start */}
          <div className="w-8 h-0.5 mx-2 bg-gradient-to-r from-slate-600 to-blue-500 relative">
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0 border-t-4 border-t-transparent border-b-4 border-b-transparent border-l-4 border-l-blue-500" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Recommendations;
