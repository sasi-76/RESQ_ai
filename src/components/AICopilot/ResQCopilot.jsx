import { useState, useEffect, useRef } from "react";
import {
  Bot, X, Send, Brain, Zap, CheckCircle,
  Users, Radio, ShieldAlert, Siren, MessageCircle,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { chatWithAIReasoning } from "../../services/llmIntegration";
import {
  buildGroupRecallLinks,
  buildWhatsAppUrl,
  buildRecallMessage,
  buildDeployMessage,
  openWhatsApp,
} from "../../services/whatsappService";
import { sendCommanderAlert, sendCitizenAlert } from "../../services/notificationService";

// ── Intent Detection ──────────────────────────────────────────────────────────
function detectIntent(message, { teams, disasters, sosBeacons, hospitals }) {
  const q = message.toLowerCase();

  if (q.includes("recall") || (q.includes("bring back") && q.includes("team"))) {
    const match = teams.find((t) => t.status === "deployed" && q.includes(t.name.toLowerCase()));
    if (match) return { type: "recall_team", teamId: match.id, label: "Recall " + match.name };
    const deployed = teams.filter((t) => t.status === "deployed");
    if (deployed.length) return { type: "recall_all_teams", teams: deployed, label: "Recall all " + deployed.length + " deployed teams" };
  }

  if (q.includes("deploy") || q.includes("dispatch team") || q.includes("send team")) {
    const toMatch = message.match(/\bto\s+([A-Za-z][a-zA-Z\s]+)/);
    const location = toMatch ? toMatch[1].trim() : (disasters[0] ? disasters[0].areaName : "Active Zone");
    const mission  = disasters[0] ? disasters[0].type + " response" : "Emergency deployment";
    const specific = teams.find((t) => t.status === "standby" && q.includes(t.name.toLowerCase()));
    const standby  = specific || teams.find((t) => t.status === "standby");
    if (standby) return { type: "deploy_team", teamId: standby.id, location, mission, label: "Deploy " + standby.name + " to " + location };
  }

  if (q.includes("resolve sos") || q.includes("clear sos") || q.includes("handle sos")) {
    const pending = sosBeacons.filter((b) => b.status === "pending" || b.status === "assigned");
    if (pending.length) {
      const specific = pending.find((b) => q.includes((b.senderName || "").toLowerCase()));
      const target = specific || pending[0];
      return { type: "resolve_sos", sosId: target.id, label: "Resolve SOS from " + target.senderName };
    }
  }

  if (q.includes("assign") && (q.includes("team") || q.includes("nearest")) && q.includes("sos")) {
    const pending = sosBeacons.filter((b) => b.status === "pending");
    if (pending.length) {
      const specific = pending.find((b) => q.includes(b.id.toLowerCase()) || q.includes((b.senderName || "").toLowerCase()));
      const target = specific || pending[0];
      return { type: "assign_nearest_team", sosId: target.id, label: "Assign nearest team to SOS from " + target.senderName };
    }
  }

  if (q.includes("clear disaster") || q.includes("remove disaster") || (q.includes("resolve") && q.includes("disaster"))) {
    const match = disasters.find((d) => q.includes((d.areaName || "").toLowerCase()) || q.includes((d.type || "").toLowerCase()));
    const target = match || disasters[0];
    if (target) return { type: "remove_disaster", disasterId: target.id, label: "Clear " + target.type + " in " + target.areaName };
  }

  if (q.includes("ambulance") && (q.includes("dispatch") || q.includes("send") || q.includes("deploy"))) {
    const hosp = hospitals.find((h) => h.ambulances > 0);
    const destM = message.match(/\bto\s+([A-Za-z][a-zA-Z\s]+)/);
    const dest  = destM ? destM[1].trim() : (disasters[0] ? disasters[0].areaName : "Emergency Site");
    if (hosp) return { type: "dispatch_ambulance", hospitalId: hosp.id, dest, label: "Dispatch ambulance from " + hosp.name };
  }

  if (q.includes("complete mission") || q.includes("mission done") || q.includes("end mission")) {
    const deployed = teams.find((t) => t.status === "deployed" && (q.includes(t.name.toLowerCase()) || q.includes("all")))
                  || teams.find((t) => t.status === "deployed");
    if (deployed) return { type: "complete_mission", teamId: deployed.id, label: "Complete mission for " + deployed.name };
  }

  if (q.includes("alert") || q.includes("notify") || q.includes("warn") || q.includes("broadcast")) {
    const match = disasters.find((d) => q.includes((d.areaName || "").toLowerCase()));
    const target = match || disasters[0];
    if (target) {
      return { type: "draft_citizen_alert", disaster: target, label: "Draft Public Alert for " + target.areaName };
    }
  }

  return null;
}

// ── Execute intent, returns { actionLabel, waLinks } ─────────────────────────
function executeIntent(intent, actions, allTeams) {
  const { deployTeam, recallTeam, resolveSOSBeacon, assignNearestTeamToSOS, removeDisaster, dispatchAmbulance, completeMission, showNotification, logAiAction } = actions;
  const ts = new Date().toISOString();

  switch (intent.type) {
    case "deploy_team": {
      deployTeam(intent.teamId, intent.location, intent.mission);
      const team = allTeams.find((t) => t.id === intent.teamId);
      if (team) {
        logAiAction('Team Deployment Optimizer', `Deploy ${team.name} to ${intent.location}`, `AI requested deployment for ${intent.mission}`);
      }
      const waLinks = team ? [{ team, url: buildWhatsAppUrl(team.phone, buildDeployMessage(team, intent.location, intent.mission)) }] : [];
      return { actionLabel: intent.label, waLinks };
    }
    case "recall_team": {
      recallTeam(intent.teamId);
      showNotification({ id: Date.now(), type: "team", title: "TEAM RECALLED", message: intent.label, severity: "info", timestamp: ts });
      const team = allTeams.find((t) => t.id === intent.teamId);
      if (team) {
        logAiAction('Team Deployment Optimizer', `Recall ${team.name}`, `AI commanded team recall to base`);
      }
      const waLinks = team ? [{ team, url: buildWhatsAppUrl(team.phone, buildRecallMessage(team)) }] : [];
      return { actionLabel: intent.label, waLinks };
    }
    case "recall_all_teams": {
      intent.teams.forEach((t) => recallTeam(t.id));
      showNotification({ id: Date.now(), type: "team", title: "ALL TEAMS RECALLED", message: intent.teams.length + " teams returned to base", severity: "info", timestamp: ts });
      logAiAction('Team Deployment Optimizer', `Recall all active teams`, `AI commanded bulk recall of ${intent.teams.length} teams`);
      const waLinks = buildGroupRecallLinks(intent.teams);
      return { actionLabel: intent.label, waLinks };
    }
    case "resolve_sos":
      resolveSOSBeacon(intent.sosId, "Resolved by ResQ Copilot command");
      logAiAction('Distress Response Engine', `Resolve SOS #${intent.sosId}`, `AI verified and resolved distress signal from user prompt`);
      return { actionLabel: intent.label, waLinks: [] };
    case "assign_nearest_team":
      assignNearestTeamToSOS(intent.sosId);
      logAiAction('Resource Allocation Optimizer', `Assign Nearest Team to SOS #${intent.sosId}`, `AI triangulated closest available team and dispatched automatically`);
      return { actionLabel: intent.label, waLinks: [] };
    case "remove_disaster":
      removeDisaster(intent.disasterId);
      showNotification({ id: Date.now(), type: "system", title: "DISASTER CLEARED", message: intent.label, severity: "info", timestamp: ts });
      logAiAction('Hazard State Manager', `Clear Disaster ${intent.disasterId}`, `AI evaluated disaster as resolved and cleared from active states`);
      return { actionLabel: intent.label, waLinks: [] };
    case "dispatch_ambulance":
      dispatchAmbulance(intent.hospitalId, intent.dest);
      logAiAction('Medical Response Optimizer', `Dispatch Ambulance to ${intent.dest}`, `AI confirmed emergency medical need and dispatched unit`);
      return { actionLabel: intent.label, waLinks: [] };
    case "complete_mission":
      completeMission(intent.teamId, "Mission completed via Copilot command", 0);
      logAiAction('Mission Control System', `Complete Mission for Team ${intent.teamId}`, `AI closed active mission loop upon commander request`);
      return { actionLabel: intent.label, waLinks: [] };
    case "draft_citizen_alert":
      // Prompt says: "the msg should always be sent to the controller" and "ask the controller before it send to the citizen"
      sendCommanderAlert(intent.disaster); // auto-send to commander immediately
      return { 
        actionLabel: "Commander Alert Sent. Approval required for Citizen Broadcast.", 
        waLinks: [], 
        requireApproval: true, 
        disaster: intent.disaster 
      };
    default:
      return { actionLabel: null, waLinks: [] };
  }
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function ResQCopilot() {
  const {
    disasters, teams, hospitals, sosBeacons, completedMissions, getStats,
    deployTeam, recallTeam, resolveSOSBeacon, assignNearestTeamToSOS, removeDisaster,
    dispatchAmbulance, completeMission, showNotification, logAiAction
  } = useApp();

  const stats = getStats();
  const [isOpen, setIsOpen]           = useState(false);
  const [inputQuery, setInputQuery]   = useState("");
  const [isTyping, setIsTyping]       = useState(false);
  const [isReasoning, setIsReasoning] = useState(false);
  const messagesEndRef = useRef(null);

  const [messages, setMessages] = useState([{
    id: 1, sender: "ai", source: "ai",
    text: "Hello, Commander. I am ResQ Copilot — GPT-OSS 120B reasoning with FULL PANEL CONTROL + WhatsApp dispatch.\n\nI can execute real actions AND send WhatsApp messages to team leaders:\n• \"Recall Alpha Squad\" → recalls team + sends WhatsApp\n• \"Deploy nearest team to Flood Zone\" → deploys + sends WhatsApp\n• \"Resolve pending SOS\"\n• \"Clear the flood disaster\"\n\nJust give the order!",
    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  }]);

  useEffect(() => {
    if (isOpen) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  const handleSend = async (textToSend) => {
    const text = (textToSend || inputQuery).trim();
    if (!text) return;
    setMessages((p) => [...p, { id: Date.now(), sender: "user", text, timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }]);
    setInputQuery("");
    setIsTyping(true);
    setIsReasoning(true);

    // 1. Detect & execute intent instantly
    const intent = detectIntent(text, { teams, disasters, sosBeacons, hospitals });
    let actionLabel = null;
    let waLinks = [];
    let requireApproval = false;
    let targetDisaster = null;
    if (intent) {
      setIsReasoning(false);
      const result = executeIntent(intent, { deployTeam, recallTeam, resolveSOSBeacon, assignNearestTeamToSOS, removeDisaster, dispatchAmbulance, completeMission, showNotification, logAiAction }, teams);
      actionLabel = result.actionLabel;
      waLinks = result.waLinks;
      requireApproval = result.requireApproval;
      targetDisaster = result.disaster;
    }

    // 2. Get AI reply
    try {
      const reply = await chatWithAIReasoning(text, { disasters, teams, hospitals, sosBeacons, stats, completedMissions });
      const msgs = [{ id: Date.now() + 1, sender: "ai", text: reply, source: "reasoning", timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }];
      if (actionLabel) msgs.push({ id: Date.now() + 2, sender: "action", intent, label: actionLabel, waLinks, requireApproval, targetDisaster, timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) });
      setMessages((p) => [...p, ...msgs]);
    } catch (err) {
      const msgs = [{ id: Date.now() + 1, sender: "ai", text: "⚠️ " + (err.message || "AI temporarily unavailable."), source: "error", timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }];
      if (actionLabel) msgs.push({ id: Date.now() + 2, sender: "action", intent, label: actionLabel, waLinks, requireApproval, targetDisaster, timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) });
      setMessages((p) => [...p, ...msgs]);
    } finally {
      setIsTyping(false);
      setIsReasoning(false);
    }
  };

  const handleApproveCitizenAlert = async (msgId, disaster) => {
    sendCitizenAlert(disaster);
    setMessages((prev) => prev.map(m => m.id === msgId ? { ...m, label: "Citizen Alert Broadcasted Successfully ✓", requireApproval: false } : m));
  };

  const quickPrompts = ["Recall all deployed teams", "Deploy nearest team", "Alert citizens about flood", "Resolve pending SOS", "Dispatch ambulance", "Generate situation report"];

  const intentIcon = {
    deploy_team:        <Users       className="h-3.5 w-3.5" />,
    recall_team:        <Radio       className="h-3.5 w-3.5" />,
    recall_all_teams:   <Radio       className="h-3.5 w-3.5" />,
    resolve_sos:        <Siren       className="h-3.5 w-3.5" />,
    remove_disaster:    <ShieldAlert className="h-3.5 w-3.5" />,
    dispatch_ambulance: <CheckCircle className="h-3.5 w-3.5" />,
    complete_mission:   <CheckCircle className="h-3.5 w-3.5" />,
  };

  return (
    <>
      {/* Launcher */}
      <button onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold shadow-2xl hover:shadow-blue-500/30 transition-all hover:scale-105 active:scale-95 border border-white/20"
        title="Open ResQ AI Copilot">
        <span className="relative flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-400" />
        </span>
        <Bot className="h-5 w-5" />
        <span className="text-sm tracking-wide">ResQ Copilot</span>
      </button>

      {/* Drawer */}
      {isOpen && (
        <div className="fixed bottom-20 right-6 z-50 w-[95vw] sm:w-[440px] h-[600px] rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 shadow-2xl flex flex-col overflow-hidden animate-slide-up">

          {/* Header */}
          <div className="px-4 py-3.5 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-md shadow-blue-500/30">
                <Brain className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  ResQ Emergency Copilot
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded font-mono">Active</span>
                  <span className="text-[10px] bg-orange-500/20 text-orange-400 border border-orange-500/30 px-1.5 py-0.5 rounded font-mono flex items-center gap-0.5">
                    <Zap className="h-2.5 w-2.5" /> Control
                  </span>
                  <span className="text-[10px] bg-green-500/20 text-green-400 border border-green-500/30 px-1.5 py-0.5 rounded font-mono flex items-center gap-0.5">
                    <MessageCircle className="h-2.5 w-2.5" /> WA
                  </span>
                </h3>
                <p className="text-[10px] text-slate-400 flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                  GPT-OSS 120B · Panel Control · WhatsApp Dispatch
                </p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Metrics bar */}
          <div className="grid grid-cols-4 gap-1 px-3 py-2 bg-slate-950/60 border-b border-slate-800/80 text-[11px]">
            <div className="text-center"><span className="text-slate-500">Hazards </span><span className="font-bold text-red-400">{disasters.length}</span></div>
            <div className="text-center border-x border-slate-800"><span className="text-slate-500">Deployed </span><span className="font-bold text-purple-400">{teams.filter(t => t.status === "deployed").length}</span></div>
            <div className="text-center border-r border-slate-800"><span className="text-slate-500">Standby </span><span className="font-bold text-emerald-400">{teams.filter(t => t.status === "standby").length}</span></div>
            <div className="text-center"><span className="text-slate-500">SOS </span><span className="font-bold text-yellow-400">{sosBeacons.filter(b => b.status === "pending").length}</span></div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
            {messages.map((msg) => {
              // ── Action + WhatsApp card ────────────────────────────────────
              if (msg.sender === "action") return (
                <div key={msg.id} className="flex justify-start">
                  <div className={`max-w-[92%] rounded-xl overflow-hidden border ${msg.requireApproval ? "border-orange-500/40" : "border-emerald-500/40"}`}>
                    
                    {/* Action header */}
                    <div className={`px-3.5 py-2 flex items-center gap-2 ${msg.requireApproval ? "bg-orange-900/50" : "bg-emerald-900/50"}`}>
                      {msg.requireApproval ? <AlertAlertsIcon /> : (intentIcon[msg.intent?.type] || <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />)}
                      <span className={`font-semibold text-[11px] ${msg.requireApproval ? "text-orange-400" : "text-emerald-400"}`}>
                        {msg.requireApproval ? "Authorization Required" : "Panel Action Executed"}
                      </span>
                    </div>

                    <div className={`px-3.5 py-3 ${msg.requireApproval ? "bg-orange-950/40" : "bg-emerald-950/40"}`}>
                      <div className={`text-[11px] mb-2 ${msg.requireApproval ? "text-orange-200" : "text-emerald-200"}`}>
                        {msg.label}
                      </div>

                      {/* Approval Button for Citizens */}
                      {msg.requireApproval && (
                        <div className="mt-3">
                          <button onClick={() => handleApproveCitizenAlert(msg.id, msg.targetDisaster)}
                            className="w-full py-2 bg-orange-600 hover:bg-orange-500 text-white text-[11px] font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg">
                            <Siren className="h-3.5 w-3.5" />
                            Approve Citizen Broadcast
                          </button>
                        </div>
                      )}

                      {/* WhatsApp buttons per team */}
                      {msg.waLinks && msg.waLinks.length > 0 && (
                        <div className="space-y-1.5">
                          <div className="text-[10px] text-emerald-500/80 flex items-center gap-1 mb-1">
                            <MessageCircle className="h-3 w-3" /> WhatsApp notifications ready:
                          </div>
                          {msg.waLinks.map(({ team, url }) => url && (
                            <a key={team.id} href={url} target="_blank" rel="noopener noreferrer"
                              className="flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 transition-colors group">
                              <div>
                                <div className="text-[10px] font-medium text-white">{team.name}</div>
                                <div className="text-[9px] text-slate-400">{team.leader}</div>
                              </div>
                              <div className="flex items-center gap-1 text-[#25D366] text-[10px] font-medium group-hover:scale-105 transition-transform">
                                <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                                </svg>
                                Open WhatsApp
                              </div>
                            </a>
                          ))}
                        </div>
                      )}
                      <div className="text-[9px] text-emerald-500/60 mt-1.5">{msg.timestamp}</div>
                    </div>
                  </div>
                </div>
              );

              // ── Normal message ────────────────────────────────────────────
              return (
                <div key={msg.id} className={`flex gap-2.5 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.sender === "ai" && (
                    <div className="w-7 h-7 rounded-lg bg-blue-600/30 border border-blue-500/40 flex items-center justify-center shrink-0 text-blue-400">
                      <Bot className="h-4 w-4" />
                    </div>
                  )}
                  <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 leading-relaxed ${
                    msg.sender === "user" ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-tr-none"
                    : msg.source === "error" ? "bg-red-900/30 border border-red-500/30 text-red-300 rounded-tl-none"
                    : "bg-slate-800/80 border border-slate-700/60 text-slate-200 rounded-tl-none whitespace-pre-line"
                  }`}>
                    <div>{msg.text}</div>
                    <div className="text-[9px] text-slate-400/80 mt-1 text-right">{msg.timestamp}</div>
                  </div>
                </div>
              );
            })}

            {/* Thinking indicator */}
            {isTyping && (
              <div className="flex items-start gap-2">
                <div className="w-7 h-7 rounded-lg bg-violet-600/30 border border-violet-500/40 flex items-center justify-center shrink-0 text-violet-400">
                  <Brain className="h-4 w-4 animate-pulse" />
                </div>
                <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl rounded-tl-none px-3.5 py-2.5">
                  {isReasoning ? (
                    <div className="flex items-center gap-2 text-violet-300 text-[11px]">
                      <span className="flex gap-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                      </span>
                      <span>Reasoning with GPT-OSS 120B...</span>
                    </div>
                  ) : (
                    <span className="text-slate-400 text-xs italic">Synthesizing response...</span>
                  )}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick prompts */}
          <div className="px-3 py-2 bg-slate-950/70 border-t border-slate-800/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {quickPrompts.map((chip, idx) => (
              <button key={idx} onClick={() => handleSend(chip)}
                className="whitespace-nowrap px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[10px] border border-slate-700 transition-colors">
                {chip}
              </button>
            ))}
          </div>

          {/* Input */}
          <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
            <input type="text" value={inputQuery} onChange={(e) => setInputQuery(e.target.value)}
              placeholder='Try: "Recall Alpha Squad" or "Deploy team to flood zone"'
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
            <button type="submit" disabled={!inputQuery.trim()} className="p-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-xl transition-colors shrink-0">
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}

function AlertAlertsIcon() {
  return <ShieldAlert className="h-3.5 w-3.5 text-orange-400" />;
}
