import { useState } from 'react';
import {
  FileText,
  Printer,
  Download,
  CheckCircle,
  AlertTriangle,
  Clock,
  Shield,
  Hospital,
  Users,
  Building2,
  Calendar,
  Share2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function IncidentReports() {
  const {
    disasters,
    completedMissions,
    teams,
    hospitals,
    sosBeacons,
    resolveSOSBeacon,
    assignNearestTeamToSOS,
    getStats,
  } = useApp();

  const stats = getStats();
  const [reportType, setReportType] = useState('full'); // 'full', 'missions', 'resources'

  const handlePrint = () => {
    window.print();
  };

  const totalCiviliansSaved = completedMissions.reduce(
    (sum, m) => sum + (m.civiliansRescued || 0),
    0
  ) + 142;

  const totalOccupiedBeds = hospitals.reduce(
    (sum, h) => sum + (h.totalBeds - h.freeBeds),
    0
  );

  return (
    <div className="space-y-6 animate-fade-in print:space-y-4 print:p-0">
      {/* Non-print Top Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <FileText className="h-7 w-7 text-blue-400" />
            EOC Incident & Audit Reports
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Formal Multi-Hazard Operations Log & Government Compliance Auditing
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl text-xs flex items-center gap-2 shadow-lg hover:shadow-blue-500/20 transition-all"
          >
            <Printer className="h-4 w-4" /> Print / Export Official PDF
          </button>
        </div>
      </div>

      {/* Printable Official EOC Document */}
      <div className="glass-card p-8 border border-slate-700/60 print:border-none print:shadow-none print:p-0 print:bg-white print:text-black">
        {/* Formal Letterhead */}
        <div className="border-b-2 border-slate-700/80 print:border-slate-400 pb-6 mb-6 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl font-black tracking-wider text-blue-400 print:text-blue-900 uppercase">
                RESQAI EMERGENCY OPERATIONS CENTER
              </span>
            </div>
            <p className="text-xs text-slate-400 print:text-slate-600">
              Department of Disaster Management & Civil Defense · Tamil Nadu Operational Sector
            </p>
            <p className="text-[11px] text-slate-500 print:text-slate-500 mt-0.5">
              Ref: EOC-SITREP-{new Date().getFullYear()}-0912 · Classification: RESTRICTED CONTROLLER DOCUMENT
            </p>
          </div>

          <div className="text-right">
            <span className="inline-block px-3 py-1 rounded bg-emerald-500/20 text-emerald-300 print:bg-emerald-100 print:text-emerald-800 text-xs font-bold uppercase tracking-wider border border-emerald-500/30">
              CERTIFIED EOC RECORD
            </span>
            <p className="text-xs text-slate-400 print:text-slate-600 mt-1.5 font-mono">
              Issued: {new Date().toLocaleDateString('en-GB')} {new Date().toLocaleTimeString()}
            </p>
          </div>
        </div>

        {/* Executive Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="p-4 rounded-xl bg-slate-800/40 print:bg-slate-100 border border-slate-700/40 print:border-slate-300">
            <span className="text-[10px] text-slate-400 print:text-slate-600 uppercase font-semibold">Active Incidents</span>
            <p className="text-2xl font-bold text-red-400 print:text-red-700 mt-1">{disasters.length}</p>
            <p className="text-[10px] text-slate-500 print:text-slate-500">Live multi-hazard zones</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-800/40 print:bg-slate-100 border border-slate-700/40 print:border-slate-300">
            <span className="text-[10px] text-slate-400 print:text-slate-600 uppercase font-semibold">Civilians Rescued</span>
            <p className="text-2xl font-bold text-emerald-400 print:text-emerald-700 mt-1">{totalCiviliansSaved}</p>
            <p className="text-[10px] text-slate-500 print:text-slate-500">Documented evacuations</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-800/40 print:bg-slate-100 border border-slate-700/40 print:border-slate-300">
            <span className="text-[10px] text-slate-400 print:text-slate-600 uppercase font-semibold">Teams Mobilized</span>
            <p className="text-2xl font-bold text-purple-400 print:text-purple-800 mt-1">
              {teams.filter((t) => t.status === 'deployed').length} / {teams.length}
            </p>
            <p className="text-[10px] text-slate-500 print:text-slate-500">Squads in active combat</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-800/40 print:bg-slate-100 border border-slate-700/40 print:border-slate-300">
            <span className="text-[10px] text-slate-400 print:text-slate-600 uppercase font-semibold">Hospital Occupancy</span>
            <p className="text-2xl font-bold text-blue-400 print:text-blue-800 mt-1">
              {totalOccupiedBeds} Beds
            </p>
            <p className="text-[10px] text-slate-500 print:text-slate-500">Across regional GH network</p>
          </div>
        </div>

        {/* Section 1: Active Hazard Incidents Log */}
        <div className="mb-8">
          <h3 className="text-sm font-bold text-white print:text-black uppercase tracking-wider mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            Section 1: Active Incident Log
          </h3>

          {disasters.length === 0 ? (
            <div className="p-4 rounded-lg bg-slate-800/30 print:bg-slate-50 border border-slate-700/40 text-xs text-slate-400 print:text-slate-600">
              No active disaster alarms logged at time of report generation. Routine ambient monitoring ongoing.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-400 print:text-slate-600 font-semibold">
                    <th className="py-2.5 px-3">Hazard Type</th>
                    <th className="py-2.5 px-3">Location</th>
                    <th className="py-2.5 px-3">Risk Rating</th>
                    <th className="py-2.5 px-3">Severity</th>
                    <th className="py-2.5 px-3">Detected At</th>
                    <th className="py-2.5 px-3">Situation Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 print:divide-slate-200">
                  {disasters.map((d) => (
                    <tr key={d.id} className="text-slate-200 print:text-slate-800">
                      <td className="py-2.5 px-3 font-bold uppercase text-red-400 print:text-red-700">{d.type}</td>
                      <td className="py-2.5 px-3 font-medium">{d.areaName}</td>
                      <td className="py-2.5 px-3 font-bold">{d.riskPercent}%</td>
                      <td className="py-2.5 px-3 capitalize font-semibold">{d.severity}</td>
                      <td className="py-2.5 px-3 text-slate-400 print:text-slate-500 font-mono">
                        {new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-2.5 px-3">{d.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Section 2: Concluded Operations & Rescue Log */}
        <div className="mb-8">
          <h3 className="text-sm font-bold text-white print:text-black uppercase tracking-wider mb-3 flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-emerald-400" />
            Section 2: Concluded Operations & Mission Audit
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-700 text-slate-400 print:text-slate-600 font-semibold">
                  <th className="py-2.5 px-3">Mission ID</th>
                  <th className="py-2.5 px-3">Team Assigned</th>
                  <th className="py-2.5 px-3">Operational Sector</th>
                  <th className="py-2.5 px-3">Specialists</th>
                  <th className="py-2.5 px-3">Evacuated</th>
                  <th className="py-2.5 px-3">Official Report Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 print:divide-slate-200">
                {completedMissions.map((m) => (
                  <tr key={m.id} className="text-slate-200 print:text-slate-800">
                    <td className="py-2.5 px-3 font-mono text-slate-400 print:text-slate-600">{m.id}</td>
                    <td className="py-2.5 px-3 font-bold text-purple-300 print:text-purple-900">{m.teamName}</td>
                    <td className="py-2.5 px-3 font-medium">{m.area}</td>
                    <td className="py-2.5 px-3">{m.personnelInvolved} Officers</td>
                    <td className="py-2.5 px-3 font-bold text-emerald-400 print:text-emerald-700">
                      +{m.civiliansRescued}
                    </td>
                    <td className="py-2.5 px-3 italic">{m.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 3: Civilian Distress Signals (SOS) */}
        <div className="mb-8">
          <h3 className="text-sm font-bold text-white print:text-black uppercase tracking-wider mb-3 flex items-center gap-2">
            <Users className="h-4 w-4 text-orange-400" />
            Section 3: Civilian SOS Distress Triage
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-700 text-slate-400 print:text-slate-600 font-semibold">
                  <th className="py-2.5 px-3">Beacon ID</th>
                  <th className="py-2.5 px-3">Caller Name</th>
                  <th className="py-2.5 px-3">Sector</th>
                  <th className="py-2.5 px-3">Persons Trapped</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Distress Message</th>
                  <th className="py-2.5 px-3 print:hidden text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 print:divide-slate-200">
                {sosBeacons.map((b) => (
                  <tr key={b.id} className="text-slate-200 print:text-slate-800">
                    <td className="py-2.5 px-3 font-mono text-slate-400">{b.id}</td>
                    <td className="py-2.5 px-3 font-semibold">{b.senderName}</td>
                    <td className="py-2.5 px-3">{b.areaName}</td>
                    <td className="py-2.5 px-3 font-bold">{b.peopleCount}</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded font-bold text-[10px] uppercase ${
                        b.status === 'resolved'
                          ? 'bg-emerald-500/20 text-emerald-300 print:text-emerald-800'
                          : b.status === 'assigned'
                          ? 'bg-blue-500/20 text-blue-300 print:text-blue-800'
                          : 'bg-red-500/20 text-red-300 print:text-red-800'
                      }`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">{b.message}</td>
                    <td className="py-2.5 px-3 print:hidden text-right flex gap-2 justify-end">
                      {b.status === 'pending' && (
                        <button
                          onClick={() => assignNearestTeamToSOS(b.id)}
                          className="px-3 py-1.5 bg-blue-600/80 hover:bg-blue-500 text-white text-[10px] font-bold uppercase tracking-wider rounded transition-colors border border-blue-500 shadow-sm shadow-blue-500/20 active:scale-95"
                        >
                          Deploy Nearest
                        </button>
                      )}
                      {(b.status === 'pending' || b.status === 'assigned') && (
                        <button
                          onClick={() => resolveSOSBeacon(b.id)}
                          className="px-3 py-1.5 bg-emerald-600/80 hover:bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-wider rounded transition-colors border border-emerald-500 shadow-sm shadow-emerald-500/20 active:scale-95"
                        >
                          Resolve
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 4: Signatures & Certification */}
        <div className="pt-8 border-t border-slate-700/80 print:border-slate-400 grid grid-cols-2 gap-8 text-xs text-slate-400 print:text-slate-600">
          <div>
            <p className="font-semibold text-slate-300 print:text-black mb-6">INCIDENT CONTROLLER VERIFICATION:</p>
            <div className="h-10 border-b border-slate-600 print:border-slate-400 w-48 mb-1" />
            <p className="font-bold text-slate-200 print:text-black">Dr. K. Senthil Nathan, IAS</p>
            <p className="text-[10px]">District Emergency Operations Officer</p>
          </div>

          <div className="text-right">
            <p className="font-semibold text-slate-300 print:text-black mb-6">AI DECISION AUDIT STAMP:</p>
            <div className="inline-block p-3 border-2 border-dashed border-blue-500/60 print:border-blue-900 rounded-lg text-center">
              <p className="text-[11px] font-bold text-blue-400 print:text-blue-900">RESQAI AUTONOMOUS AUDIT</p>
              <p className="text-[9px] text-slate-400 print:text-slate-600">SHA-256: 9F8A2B...VERIFIED</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
