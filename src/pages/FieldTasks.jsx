import { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  MapPin,
  Users,
  Shield,
  Search,
  Filter,
  CheckSquare,
  ArrowRight,
  Sparkles,
  FileText,
  RotateCcw,
  Send,
  X,
  AlertTriangle,
  Radio,
  Truck,
  HeartPulse,
  Activity,
  Layers,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const categoryIconMap = {
  Evacuation: Users,
  Relief: Truck,
  Infrastructure: Shield,
  Communication: Radio,
  Medical: HeartPulse,
  Reconnaissance: Activity,
};

const categoryColorMap = {
  Evacuation: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  Relief: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  Infrastructure: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  Communication: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  Medical: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  Reconnaissance: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
};

const priorityStyles = {
  immediate: 'bg-red-500/20 text-red-400 border border-red-500/30',
  high: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
  medium: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
};

export default function FieldTasks() {
  const { tasks, updateTaskStatus, completeTask, getTaskStats } = useApp();
  const stats = getTaskStats();

  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeModalTask, setActiveModalTask] = useState(null);
  const [responderName, setResponderName] = useState('');
  const [completionNotes, setCompletionNotes] = useState('');

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchLoc = t.location.toLowerCase().includes(q);
      const matchTeam = t.assignedTeam.toLowerCase().includes(q);
      const matchLeader = t.assignedLeader?.toLowerCase().includes(q);
      if (!matchTitle && !matchLoc && !matchTeam && !matchLeader) return false;
    }
    return true;
  });

  const handleOpenCompleteModal = (task) => {
    setActiveModalTask(task);
    setResponderName(task.assignedLeader || '');
    setCompletionNotes('');
  };

  const handleConfirmComplete = () => {
    if (!activeModalTask) return;
    completeTask(activeModalTask.id, {
      notes: completionNotes.trim(),
      completedBy: responderName.trim() || 'Field Officer',
    });
    setActiveModalTask(null);
    setCompletionNotes('');
    setResponderName('');
  };

  const handleQuickStatusToggle = (task, newStatus) => {
    if (newStatus === 'completed') {
      handleOpenCompleteModal(task);
    } else {
      updateTaskStatus(task.id, newStatus);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Live Field Synchronization
            </span>
            <span className="text-xs text-slate-400">Direct Dashboard Link</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <CheckSquare className="h-7 w-7 text-emerald-400" />
            Field Operations & Task Completion
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Assigned missions for response teams. Marking tasks completed immediately reflects across command centers and the main Dashboard.
          </p>
        </div>

        {/* Global Task Completion Pill */}
        <div className="flex items-center gap-3 bg-slate-800/80 border border-slate-700/60 rounded-xl px-4 py-2.5 shadow-lg">
          <div className="text-right">
            <p className="text-xs text-slate-400 font-medium">Overall Progress</p>
            <p className="text-lg font-bold text-emerald-400">{stats.percentCompleted}% Completed</p>
          </div>
          <div className="w-12 h-12 rounded-full border-4 border-slate-700 flex items-center justify-center relative">
            <svg className="w-12 h-12 transform -rotate-90">
              <circle
                cx="24"
                cy="24"
                r="18"
                stroke="currentColor"
                strokeWidth="4"
                className="text-slate-700"
                fill="transparent"
              />
              <circle
                cx="24"
                cy="24"
                r="18"
                stroke="currentColor"
                strokeWidth="4"
                strokeDasharray={113}
                strokeDashoffset={113 - (113 * stats.percentCompleted) / 100}
                className="text-emerald-500 transition-all duration-700"
                fill="transparent"
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute text-[11px] font-bold text-white">{stats.percentCompleted}%</span>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Tasks */}
        <div className="glass-card p-4 rounded-xl border border-slate-700/50 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Layers className="h-6 w-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white tabular-nums">{stats.total}</p>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Total Assigned</p>
          </div>
        </div>

        {/* In Progress */}
        <div className="glass-card p-4 rounded-xl border border-slate-700/50 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-amber-400 tabular-nums">{stats.inProgress}</p>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">In Progress</p>
          </div>
        </div>

        {/* Completed */}
        <div className="glass-card p-4 rounded-xl border border-slate-700/50 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-emerald-400 tabular-nums">{stats.completed}</p>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Completed Tasks</p>
          </div>
        </div>

        {/* Pending */}
        <div className="glass-card p-4 rounded-xl border border-slate-700/50 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-slate-700/40 text-slate-300 border border-slate-600/30">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white tabular-nums">{stats.pending}</p>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Awaiting Action</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card p-4 rounded-xl border border-slate-700/50 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search tasks by title, team, responder, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-slate-800/80 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: 'all', label: 'All' },
            { id: 'in-progress', label: 'In Progress' },
            { id: 'completed', label: 'Completed' },
            { id: 'pending', label: 'Pending' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === tab.id
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Priority Filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-xs text-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Priorities</option>
            <option value="immediate">Immediate</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
          </select>
        </div>
      </div>

      {/* Task List Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredTasks.length === 0 ? (
          <div className="col-span-full glass-card p-12 text-center rounded-xl border border-slate-700/40">
            <CheckCircle2 className="h-12 w-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-300 font-semibold text-base">No tasks match your filter criteria</p>
            <p className="text-slate-500 text-xs mt-1">Try resetting the status or search keywords</p>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const CatIcon = categoryIconMap[task.category] || Layers;
            const catColors = categoryColorMap[task.category] || 'text-slate-400 bg-slate-700/20';
            const isCompleted = task.status === 'completed';
            const isInProgress = task.status === 'in-progress';

            return (
              <div
                key={task.id}
                className={`glass-card p-5 rounded-xl border transition-all duration-300 flex flex-col justify-between ${
                  isCompleted
                    ? 'border-emerald-500/40 bg-emerald-950/10 shadow-emerald-500/5'
                    : isInProgress
                    ? 'border-amber-500/40 bg-amber-950/10 shadow-amber-500/5'
                    : 'border-slate-700/40 hover:border-slate-600'
                }`}
              >
                {/* Header */}
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                        {task.id}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${priorityStyles[task.priority] || ''}`}>
                        {task.priority}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border flex items-center gap-1 ${catColors}`}>
                        <CatIcon className="h-3 w-3" />
                        {task.category}
                      </span>
                    </div>

                    {/* Status Badge */}
                    <div>
                      {isCompleted ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          COMPLETED
                        </span>
                      ) : isInProgress ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                          </span>
                          IN PROGRESS
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-700/40 text-slate-300 border border-slate-600/30">
                          <Clock className="h-3.5 w-3.5" />
                          PENDING
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-base font-bold text-white mb-1.5 leading-snug">{task.title}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed mb-3">{task.description}</p>

                  {/* Assignment Meta Details */}
                  <div className="grid grid-cols-2 gap-2 text-xs bg-slate-800/50 p-2.5 rounded-lg border border-slate-700/30 mb-3">
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <Users className="h-3.5 w-3.5 text-blue-400 flex-shrink-0" />
                      <span className="truncate">
                        <strong className="text-slate-400 font-normal">Team:</strong> {task.assignedTeam}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <MapPin className="h-3.5 w-3.5 text-purple-400 flex-shrink-0" />
                      <span className="truncate">
                        <strong className="text-slate-400 font-normal">Loc:</strong> {task.location}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <Shield className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
                      <span className="truncate">
                        <strong className="text-slate-400 font-normal">Lead:</strong> {task.assignedLeader}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <Clock className="h-3.5 w-3.5 text-amber-400 flex-shrink-0" />
                      <span className="truncate">
                        <strong className="text-slate-400 font-normal">Target:</strong> {task.dueDate}
                      </span>
                    </div>
                  </div>

                  {/* Notes / Field Verification */}
                  {task.notes && (
                    <div className="text-xs bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 text-slate-400 mb-3">
                      <div className="flex items-center gap-1.5 text-slate-300 font-semibold mb-1">
                        <FileText className="h-3 w-3 text-cyan-400" />
                        <span>Field Log & Updates:</span>
                      </div>
                      <p className="text-slate-300 italic">{task.notes}</p>
                      {isCompleted && task.completedBy && (
                        <p className="mt-1 text-[11px] text-emerald-400 font-medium">
                          ✓ Signed off by: <span className="text-white">{task.completedBy}</span> on{' '}
                          {new Date(task.completedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                      <span>Execution Progress</span>
                      <span className="font-bold text-white">{task.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-700/40 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          isCompleted ? 'bg-emerald-500' : isInProgress ? 'bg-amber-500' : 'bg-slate-600'
                        }`}
                        style={{ width: `${task.progress}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Footer Action Controls */}
                <div className="pt-3 border-t border-slate-700/40 flex items-center justify-between gap-2">
                  {/* Status Dropdown Quick Switch */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-slate-500 font-medium">Change status:</span>
                    <select
                      value={task.status}
                      onChange={(e) => handleQuickStatusToggle(task, e.target.value)}
                      className="bg-slate-800 border border-slate-700 rounded text-xs text-slate-300 px-2 py-1 focus:outline-none focus:border-emerald-500"
                    >
                      <option value="pending">Pending</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>

                  {/* Primary Action Button */}
                  <div>
                    {!isCompleted ? (
                      <button
                        onClick={() => handleOpenCompleteModal(task)}
                        className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all hover:scale-105 active:scale-95"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Mark Completed
                      </button>
                    ) : (
                      <button
                        onClick={() => updateTaskStatus(task.id, 'in-progress')}
                        className="px-3 py-1.5 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-all hover:text-white"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Reopen Task
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Task Completion Modal */}
      {activeModalTask && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setActiveModalTask(null)}
        >
          <div
            className="glass-card max-w-lg w-full rounded-2xl border border-emerald-500/40 shadow-2xl p-6 bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Complete Field Task</h3>
                  <p className="text-xs text-slate-400">{activeModalTask.id} • {activeModalTask.assignedTeam}</p>
                </div>
              </div>
              <button
                onClick={() => setActiveModalTask(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="py-4 space-y-4">
              {/* Task Title preview */}
              <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/50">
                <p className="text-xs text-slate-400 mb-0.5">Task Objective</p>
                <p className="text-sm font-semibold text-white">{activeModalTask.title}</p>
                <p className="text-xs text-purple-400 flex items-center gap-1 mt-1">
                  <MapPin className="h-3 w-3" />
                  {activeModalTask.location}
                </p>
              </div>

              {/* Responder Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Sign-off Responder / Field Leader Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={responderName}
                  onChange={(e) => setResponderName(e.target.value)}
                  placeholder="e.g., Inspector R. Rajesh"
                  className="w-full px-3.5 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Completion Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Field Completion Report / Verification Notes
                </label>
                <textarea
                  rows={3}
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  placeholder="e.g., All 350 residents relocated to Municipal Relief Camp 2. Buses returned to depot. Area secured."
                  className="w-full px-3.5 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              {/* Notice */}
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-2.5">
                <Sparkles className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-emerald-300">
                  Submitting will mark this task as <strong>100% Completed</strong> and immediately sync to the main command Dashboard and incident logs.
                </p>
              </div>
            </div>

            {/* Modal Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setActiveModalTask(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmComplete}
                className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all hover:scale-105 active:scale-95"
              >
                <CheckCircle2 className="h-4 w-4" />
                Confirm & Sync Completion
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
