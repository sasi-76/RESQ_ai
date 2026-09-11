import { useState } from 'react';
import { Shield, Brain, Activity, Database, AlertTriangle, CheckCircle2, XCircle, Clock, TrendingUp, Settings, Eye, FileText, ChevronRight, BarChart3 } from 'lucide-react';
import { useApp } from '../context/AppContext';

// Mock AI Decision Logs
const aiDecisionLogs = [
  {
    id: 1,
    timestamp: '2026-09-11T12:45:23',
    module: 'Hazard Detection Engine',
    decision: 'Risk Increase Detected',
    area: 'Cuddalore',
    previousRisk: 58,
    newRisk: 76,
    confidence: 94,
    dataPoints: 156,
    algorithm: 'Multi-Hazard Risk Assessment v2.3',
    reasoning: 'Rainfall exceeded 145mm threshold, water level rising 15% above normal, wind speed 65km/h',
    status: 'approved',
    approvedBy: 'Controller-01',
    approvedAt: '2026-09-11T12:46:10',
  },
  {
    id: 2,
    timestamp: '2026-09-11T11:30:15',
    module: 'Alert Generation System',
    decision: 'Generate Critical Alert',
    area: 'Cuddalore',
    alertType: 'Flood Warning',
    confidence: 89,
    dataPoints: 89,
    algorithm: 'Alert Priority Classifier v1.8',
    reasoning: 'Risk level P1, population 173K+ affected, 3+ hazard indicators active',
    status: 'approved',
    approvedBy: 'Controller-01',
    approvedAt: '2026-09-11T11:31:00',
  },
  {
    id: 3,
    timestamp: '2026-09-11T10:15:42',
    module: 'Team Deployment Optimizer',
    decision: 'Deploy RESQ-03 Charlie to Cuddalore',
    area: 'Cuddalore',
    teamId: 'RESQ-03',
    confidence: 92,
    dataPoints: 45,
    algorithm: 'Resource Allocation Optimizer v3.1',
    reasoning: 'Nearest available search & rescue unit, equipped for flood response, 15min ETA',
    status: 'approved',
    approvedBy: 'Controller-02',
    approvedAt: '2026-09-11T10:16:05',
  },
  {
    id: 4,
    timestamp: '2026-09-11T09:22:18',
    module: 'Change Detection AI',
    decision: 'Cyclone Risk Elevated',
    area: 'Chidambaram',
    previousRisk: 20,
    newRisk: 28,
    confidence: 78,
    dataPoints: 67,
    algorithm: 'Weather Pattern Analyzer v2.0',
    reasoning: 'Wind pattern shift detected, pressure drop 2mb, satellite imagery shows cloud formation',
    status: 'pending',
    approvedBy: null,
    approvedAt: null,
  },
  {
    id: 5,
    timestamp: '2026-09-11T08:45:30',
    module: 'Hospital Capacity Predictor',
    decision: 'Alert Cuddalore Govt Hospital',
    area: 'Cuddalore',
    hospitalId: 'H-001',
    confidence: 85,
    dataPoints: 34,
    algorithm: 'Capacity Forecasting Model v1.5',
    reasoning: 'Estimated 200+ casualties, current 85 free beds, recommend prepare ICU',
    status: 'approved',
    approvedBy: 'Controller-01',
    approvedAt: '2026-09-11T08:46:12',
  },
];

// AI Workflow Steps
const workflowSteps = [
  {
    step: 1,
    name: 'Data Collection',
    status: 'active',
    sources: 6,
    lastUpdate: '30 sec ago',
    description: 'Collecting real-time data from sensors, satellites, and APIs',
  },
  {
    step: 2,
    name: 'Data Processing',
    status: 'active',
    processed: 1247,
    lastUpdate: '5 sec ago',
    description: 'Cleaning, normalizing, and standardizing incoming data',
  },
  {
    step: 3,
    name: 'Hazard Detection',
    status: 'active',
    detected: 4,
    lastUpdate: '2 min ago',
    description: 'AI models analyzing data for hazard patterns and anomalies',
  },
  {
    step: 4,
    name: 'Risk Assessment',
    status: 'active',
    calculated: 6,
    lastUpdate: '3 min ago',
    description: 'Calculating risk percentages and priority levels for each area',
  },
  {
    step: 5,
    name: 'Change Detection',
    status: 'active',
    changes: 2,
    lastUpdate: '5 min ago',
    description: 'Comparing current vs historical data to detect significant changes',
  },
  {
    step: 6,
    name: 'Alert Generation',
    status: 'active',
    generated: 4,
    lastUpdate: '10 min ago',
    description: 'Creating alerts based on risk thresholds and priority rules',
  },
  {
    step: 7,
    name: 'Resource Optimization',
    status: 'active',
    recommendations: 6,
    lastUpdate: '15 min ago',
    description: 'Recommending team deployments and resource allocation',
  },
  {
    step: 8,
    name: 'Controller Review',
    status: 'waiting',
    pending: 1,
    lastUpdate: 'Now',
    description: 'Awaiting human approval for AI-generated decisions',
  },
];

// Data Sources
const dataSources = [
  { name: 'IMD Weather API', status: 'active', uptime: 99.8, latency: 45 },
  { name: 'Seismology Network', status: 'active', uptime: 99.2, latency: 67 },
  { name: 'Satellite Imagery', status: 'active', uptime: 98.5, latency: 120 },
  { name: 'River Gauge Sensors', status: 'active', uptime: 97.8, latency: 32 },
  { name: 'Weather Radar', status: 'active', uptime: 99.9, latency: 28 },
  { name: 'Disaster Authority DB', status: 'warning', uptime: 95.2, latency: 180 },
];

// AI Model Performance
const modelPerformance = [
  { model: 'Flood Risk Predictor', accuracy: 94.2, precision: 92.8, recall: 91.5, f1Score: 92.1 },
  { model: 'Cyclone Detector', accuracy: 89.7, precision: 88.3, recall: 87.9, f1Score: 88.1 },
  { model: 'Earthquake Analyzer', accuracy: 91.5, precision: 90.2, recall: 89.8, f1Score: 90.0 },
  { model: 'Change Detection AI', accuracy: 93.8, precision: 92.1, recall: 91.3, f1Score: 91.7 },
];

function AdminDashboard() {
  const { aiDecisions, updateAiDecision, aiFilter, setAiFilter } = useApp();
  const [selectedLog, setSelectedLog] = useState(null);

  // Use global AI decisions, fallback to mock if empty
  const allDecisions = aiDecisions.length > 0 ? aiDecisions : aiDecisionLogs;

  const filteredLogs = allDecisions.filter(log => {
    if (aiFilter === 'all') return true;
    return log.status === aiFilter;
  });

  const handleApprove = (decisionId) => {
    console.log('✅ Approving AI decision:', decisionId);
    updateAiDecision(decisionId, 'approved', 'Approved by controller');
  };

  const handleReject = (decisionId) => {
    console.log('❌ Rejecting AI decision:', decisionId);
    const reason = prompt('Reason for rejection (optional):');
    updateAiDecision(decisionId, 'rejected', reason || 'Rejected by controller');
  };

  const getStatusColor = (status) => {
    if (status === 'approved') return { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30' };
    if (status === 'pending') return { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30' };
    if (status === 'rejected') return { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' };
    return { bg: 'bg-slate-500/20', text: 'text-slate-400', border: 'border-slate-500/30' };
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <Shield className="h-7 w-7 text-purple-400" />
          AI Agent Workflow & Admin Dashboard
        </h2>
        <p className="text-sm text-slate-400 mt-1">Monitor AI decisions, review workflow, and manage system</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 flex items-center gap-4">
          <div className="bg-purple-500/10 rounded-xl p-3">
            <Brain className="h-6 w-6 text-purple-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{allDecisions.length}</p>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">AI Decisions (24h)</p>
          </div>
        </div>

        <div className="glass-card p-5 flex items-center gap-4">
          <div className="bg-green-500/10 rounded-xl p-3">
            <CheckCircle2 className="h-6 w-6 text-green-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{allDecisions.filter(l => l.status === 'approved').length}</p>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Approved</p>
          </div>
        </div>

        <div className="glass-card p-5 flex items-center gap-4">
          <div className="bg-yellow-500/10 rounded-xl p-3">
            <Clock className="h-6 w-6 text-yellow-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{allDecisions.filter(l => l.status === 'pending').length}</p>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Pending Review</p>
          </div>
        </div>

        <div className="glass-card p-5 flex items-center gap-4">
          <div className="bg-blue-500/10 rounded-xl p-3">
            <BarChart3 className="h-6 w-6 text-blue-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">
              {allDecisions.length > 0 ? Math.round(allDecisions.reduce((sum, d) => sum + (d.confidence || 90), 0) / allDecisions.length) : 92}%
            </p>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Avg Confidence</p>
          </div>
        </div>
      </div>

      {/* AI Workflow Visualization */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">AI Workflow Pipeline (Real-time)</h3>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
            </span>
            <span className="text-[10px] text-green-400 font-medium">ALL SYSTEMS OPERATIONAL</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {workflowSteps.map((step, idx) => (
            <div key={step.step} className="relative">
              <div className={`p-4 rounded-xl border-2 transition-all ${step.status === 'active' ? 'border-blue-500/50 bg-blue-500/5' : step.status === 'waiting' ? 'border-yellow-500/50 bg-yellow-500/5' : 'border-slate-700/50 bg-slate-800/30'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${step.status === 'active' ? 'bg-blue-500/20 text-blue-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                    Step {step.step}
                  </span>
                  {step.status === 'active' && <Activity className="h-4 w-4 text-blue-400 animate-pulse" />}
                  {step.status === 'waiting' && <Clock className="h-4 w-4 text-yellow-400" />}
                </div>
                <h4 className="text-sm font-bold text-white mb-2">{step.name}</h4>
                <p className="text-[10px] text-slate-400 mb-3 leading-relaxed">{step.description}</p>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-500">
                    {step.sources && `${step.sources} sources`}
                    {step.processed && `${step.processed} records`}
                    {step.detected && `${step.detected} detected`}
                    {step.calculated && `${step.calculated} areas`}
                    {step.changes && `${step.changes} changes`}
                    {step.generated && `${step.generated} alerts`}
                    {step.recommendations && `${step.recommendations} actions`}
                    {step.pending && `${step.pending} pending`}
                  </span>
                  <span className="text-blue-400 font-medium">{step.lastUpdate}</span>
                </div>
              </div>
              {idx < workflowSteps.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-2 transform -translate-y-1/2 z-10">
                  <ChevronRight className="h-4 w-4 text-slate-600" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AI Decision Logs */}
        <div className="lg:col-span-2 space-y-4">
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">AI Decision Log</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setAiFilter('all')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all hover:scale-105 ${aiFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'}`}
                >
                  All ({allDecisions.length})
                </button>
                <button
                  onClick={() => setAiFilter('approved')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all hover:scale-105 ${aiFilter === 'approved' ? 'bg-green-600 text-white' : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'}`}
                >
                  Approved ({allDecisions.filter(l => l.status === 'approved').length})
                </button>
                <button
                  onClick={() => setAiFilter('pending')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all hover:scale-105 ${aiFilter === 'pending' ? 'bg-yellow-600 text-white' : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'}`}
                >
                  Pending ({allDecisions.filter(l => l.status === 'pending').length})
                </button>
              </div>
            </div>

            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
              {filteredLogs.map(log => {
                const statusColors = getStatusColor(log.status);
                return (
                  <div key={log.id} onClick={() => setSelectedLog(log)} className={`p-4 rounded-xl border cursor-pointer hover:shadow-lg transition-all ${statusColors.bg} ${statusColors.border} ${selectedLog?.id === log.id ? 'ring-2 ring-blue-500' : ''}`}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Brain className="h-4 w-4 text-purple-400" />
                          <span className="text-xs font-bold text-slate-400">{log.module}</span>
                        </div>
                        <h4 className="text-sm font-bold text-white mb-1">{log.decision}</h4>
                        <p className="text-xs text-slate-400">Area: {log.area}</p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-block px-2 py-1 rounded-full text-[10px] font-bold uppercase ${statusColors.bg} ${statusColors.text} mb-1`}>
                          {log.status}
                        </span>
                        <p className="text-[10px] text-slate-500">{new Date(log.timestamp).toLocaleTimeString()}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-700/50">
                      <div className="flex items-center gap-1.5">
                        <TrendingUp className="h-3 w-3 text-green-400" />
                        <span className="text-xs text-slate-400">Confidence: <span className="font-bold text-green-400">{log.confidence}%</span></span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Database className="h-3 w-3 text-blue-400" />
                        <span className="text-xs text-slate-400">{log.dataPoints} data points</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-4">
          {/* Selected Decision Details */}
          {selectedLog && (
            <div className="glass-card p-5 animate-slide-up">
              <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Decision Details
              </h3>

              <div className="space-y-3">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Algorithm Used</p>
                  <p className="text-xs text-white font-medium">{selectedLog.algorithm}</p>
                </div>

                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">AI Reasoning</p>
                  <p className="text-xs text-slate-300 leading-relaxed">{selectedLog.reasoning}</p>
                </div>

                {selectedLog.previousRisk !== undefined && (
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Risk Change</p>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-400">{selectedLog.previousRisk}%</span>
                      <ChevronRight className="h-4 w-4 text-red-400" />
                      <span className="text-sm font-bold text-red-400">{selectedLog.newRisk}%</span>
                      <span className="text-xs text-red-400">(+{selectedLog.newRisk - selectedLog.previousRisk}%)</span>
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Status</p>
                  {selectedLog.status === 'approved' ? (
                    <div className="text-xs">
                      <p className="text-green-400 font-semibold mb-1">✓ Approved by {selectedLog.approvedBy}</p>
                      <p className="text-slate-500">{new Date(selectedLog.approvedAt).toLocaleString()}</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-yellow-400 font-semibold text-xs mb-2">⏳ Awaiting Review</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            handleApprove(selectedLog.id);
                            setSelectedLog(null);
                          }}
                          className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg transition-all hover:scale-105 active:scale-95"
                        >
                          ✓ Approve
                        </button>
                        <button
                          onClick={() => {
                            handleReject(selectedLog.id);
                            setSelectedLog(null);
                          }}
                          className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition-all hover:scale-105 active:scale-95"
                        >
                          ✗ Reject
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Data Sources Status */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Database className="h-4 w-4" />
              Data Sources
            </h3>
            <div className="space-y-2">
              {dataSources.map((source, idx) => (
                <div key={idx} className="p-2 rounded-lg bg-slate-800/40">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-white font-medium">{source.name}</span>
                    <span className={`text-[10px] font-bold ${source.status === 'active' ? 'text-green-400' : 'text-yellow-400'}`}>
                      {source.status === 'active' ? '● ACTIVE' : '● WARNING'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span>Uptime: {source.uptime}%</span>
                    <span>Latency: {source.latency}ms</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Model Performance */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Model Performance
            </h3>
            <div className="space-y-3">
              {modelPerformance.map((model, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-slate-800/40">
                  <p className="text-xs text-white font-semibold mb-2">{model.model}</p>
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div>
                      <span className="text-slate-500">Accuracy:</span>
                      <span className="text-green-400 font-bold ml-1">{model.accuracy}%</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Precision:</span>
                      <span className="text-blue-400 font-bold ml-1">{model.precision}%</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Recall:</span>
                      <span className="text-purple-400 font-bold ml-1">{model.recall}%</span>
                    </div>
                    <div>
                      <span className="text-slate-500">F1-Score:</span>
                      <span className="text-orange-400 font-bold ml-1">{model.f1Score}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
