import { Users, MapPin, User, Package, Truck, Clock, ChevronRight } from 'lucide-react';
import { useApp } from '../context/AppContext';

function Teams() {
  const { teams, deployTeam, recallTeam } = useApp();

  const deployedTeams = teams.filter(t => t.status === 'deployed').length;
  const standbyTeams = teams.filter(t => t.status === 'standby').length;
  const totalPersonnel = teams.reduce((sum, t) => sum + t.members, 0);
  const areasCovered = new Set(teams.filter(t => t.assignedArea).map(t => t.assignedArea)).size;

  // Handler for deploying a team
  const handleDeploy = (team) => {
    console.log('🚁 Deploying team:', team.name);
    const location = prompt('Deploy to which location?', 'Cuddalore');
    if (!location) return;

    const mission = prompt('Mission description (optional):', 'Emergency response');
    deployTeam(team.id, location, mission || 'Emergency response');
  };

  // Handler for reassigning a team
  const handleReassign = (team) => {
    console.log('🔄 Reassigning team:', team.name);
    const newLocation = prompt('Reassign to which location?', team.assignedArea || team.location);
    if (!newLocation) return;

    deployTeam(team.id, newLocation, team.mission || 'Reassigned mission');
  };

  // Handler for recalling a team
  const handleRecall = (team) => {
    console.log('🏠 Recalling team:', team.name);
    if (confirm(`Recall ${team.name} from ${team.location}?`)) {
      recallTeam(team.id);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <Users className="h-7 w-7 text-blue-400" />
          ResQ Team Deployment
        </h2>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Workflow:</span>
          <div className="flex items-center gap-1.5">
            <span className="px-2 py-1 rounded-md bg-blue-500/20 text-blue-400 text-xs font-medium">Controller</span>
            <ChevronRight className="h-3 w-3 text-slate-600" />
            <span className="px-2 py-1 rounded-md bg-purple-500/20 text-purple-400 text-xs font-medium">Teams</span>
            <ChevronRight className="h-3 w-3 text-slate-600" />
            <span className="px-2 py-1 rounded-md bg-green-500/20 text-green-400 text-xs font-medium">Field</span>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 flex items-center gap-4">
          <div className="bg-green-500/10 rounded-xl p-3">
            <Users className="h-6 w-6 text-green-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{deployedTeams}</p>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Teams Deployed</p>
          </div>
        </div>

        <div className="glass-card p-5 flex items-center gap-4">
          <div className="bg-yellow-500/10 rounded-xl p-3">
            <Users className="h-6 w-6 text-yellow-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{standbyTeams}</p>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Teams Standby</p>
          </div>
        </div>

        <div className="glass-card p-5 flex items-center gap-4">
          <div className="bg-blue-500/10 rounded-xl p-3">
            <User className="h-6 w-6 text-blue-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{totalPersonnel}</p>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Total Personnel</p>
          </div>
        </div>

        <div className="glass-card p-5 flex items-center gap-4">
          <div className="bg-purple-500/10 rounded-xl p-3">
            <MapPin className="h-6 w-6 text-purple-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{areasCovered}</p>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Areas Covered</p>
          </div>
        </div>
      </div>

      {/* Team Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {teams.map(team => {
          const isDeployed = team.status === 'deployed';
          const statusColor = isDeployed ? 'green' : 'yellow';
          const statusBg = isDeployed ? 'bg-green-500/10' : 'bg-yellow-500/10';
          const statusText = isDeployed ? 'text-green-400' : 'text-yellow-400';

          return (
            <div key={team.id} className="glass-card p-6 hover:shadow-lg transition-all border border-slate-700/30 hover:border-slate-600/50">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <span className="inline-block px-2 py-1 rounded-md bg-blue-500/20 text-blue-400 text-xs font-bold tracking-wider mb-2">
                    {team.id}
                  </span>
                  <h3 className="text-lg font-bold text-white">{team.name}</h3>
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                    <User className="h-3 w-3" />
                    <span>{team.leader}</span>
                  </div>
                </div>
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${statusBg}`}>
                  <span className="relative flex h-2 w-2">
                    {isDeployed && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />}
                    <span className={`relative inline-flex h-2 w-2 rounded-full bg-${statusColor}-500`} />
                  </span>
                  <span className={`text-xs font-bold uppercase ${statusText}`}>{team.status}</span>
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-3 rounded-lg bg-slate-800/40">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Members</p>
                  <p className="text-lg font-bold text-white">{team.members}</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-800/40">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Assigned Area</p>
                  <p className="text-sm font-semibold text-white">{team.assignedArea || <span className="text-slate-500">Unassigned</span>}</p>
                </div>
              </div>

              {/* Equipment */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="h-4 w-4 text-purple-400" />
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Equipment</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {team.equipment.map((item, idx) => (
                    <span key={idx} className="px-2 py-1 rounded-md bg-purple-500/10 text-purple-300 text-[10px] font-medium">
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              {/* Vehicle */}
              <div className="mb-4">
                <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-800/40">
                  <Truck className="h-4 w-4 text-blue-400" />
                  <span className="text-xs text-slate-300">{team.vehicle}</span>
                </div>
              </div>

              {/* Deploy Time */}
              {team.deployedAt && (
                <div className="flex items-center gap-2 mb-4 p-2 rounded-lg bg-green-500/5 border border-green-500/20">
                  <Clock className="h-3 w-3 text-green-400" />
                  <span className="text-[10px] text-green-400 font-medium">
                    Deployed at {new Date(team.deployedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                {!isDeployed && (
                  <button
                    onClick={() => handleDeploy(team)}
                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg transition-all hover:scale-105 active:scale-95"
                  >
                    Deploy
                  </button>
                )}
                <button
                  onClick={() => handleReassign(team)}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-all hover:scale-105 active:scale-95"
                >
                  Reassign
                </button>
                {isDeployed && (
                  <button
                    onClick={() => handleRecall(team)}
                    className="px-4 py-2 border border-red-500/50 hover:bg-red-500/10 text-red-400 text-xs font-semibold rounded-lg transition-all hover:scale-105 active:scale-95"
                  >
                    Recall
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Deployment Workflow */}
      <div className="glass-card p-6">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">Deployment Workflow</h3>
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 rounded-full bg-blue-500/20">
              <span className="text-xl font-bold text-blue-400">1</span>
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-white mb-1">Authority Allocates Team</p>
              <p className="text-xs text-slate-400">Controller assigns RESQ team to affected area</p>
            </div>
          </div>

          <ChevronRight className="h-8 w-8 text-slate-600 shrink-0" />

          <div className="flex-1">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 rounded-full bg-purple-500/20">
              <span className="text-xl font-bold text-purple-400">2</span>
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-white mb-1">Team Receives Notification</p>
              <p className="text-xs text-slate-400">Team gets location, task details, and priority level</p>
            </div>
          </div>

          <ChevronRight className="h-8 w-8 text-slate-600 shrink-0" />

          <div className="flex-1">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 rounded-full bg-green-500/20">
              <span className="text-xl font-bold text-green-400">3</span>
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-white mb-1">Team Provides Rescue & Help</p>
              <p className="text-xs text-slate-400">Team reaches area and provides emergency assistance</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Teams;
