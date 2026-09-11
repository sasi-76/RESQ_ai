import { createContext, useContext, useState, useEffect } from 'react';
import { monitoredAreas, hospitals, resqTeams, alerts as initialAlerts } from '../data/mockData';

const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  // Core state
  const [disasters, setDisasters] = useState([]);
  const [alerts, setAlerts] = useState(initialAlerts);
  const [teams, setTeams] = useState(resqTeams);
  const [aiDecisions, setAiDecisions] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [selectedArea, setSelectedArea] = useState(null);
  const [hospitalRoutes, setHospitalRoutes] = useState([]);

  // Filters
  const [alertFilter, setAlertFilter] = useState('all'); // all, active, resolved
  const [aiFilter, setAiFilter] = useState('all'); // all, approved, pending, rejected

  // Add disaster (from Demo Controls or real-time detection)
  const addDisaster = (disaster) => {
    console.log('🔥 Adding disaster to global state:', disaster);

    // Add disaster
    setDisasters(prev => [...prev, disaster]);

    // Create corresponding alert
    const alert = {
      id: `alert-${disaster.id}`,
      disasterId: disaster.id,
      area: disaster.areaName,
      type: disaster.type,
      priority: disaster.severity === 'critical' ? 'P1' : disaster.severity === 'high' ? 'P2' : 'P3',
      message: disaster.description || `${disaster.type} detected in ${disaster.areaName}`,
      timestamp: disaster.timestamp,
      status: 'active',
      riskPercent: disaster.riskPercent,
      lat: disaster.lat,
      lng: disaster.lng,
    };

    setAlerts(prev => [alert, ...prev]);

    // Create AI decision for review
    const aiDecision = {
      id: `decision-${disaster.id}`,
      disasterId: disaster.id,
      timestamp: disaster.timestamp,
      type: disaster.type,
      area: disaster.areaName,
      decision: `Deploy emergency response to ${disaster.areaName}`,
      confidence: Math.floor(85 + Math.random() * 15),
      reasoning: `AI detected ${disaster.type} with ${disaster.riskPercent}% risk level. Immediate response recommended based on population density (${Math.floor(Math.random() * 100000)}) and infrastructure vulnerability.`,
      status: 'pending',
      affectedPopulation: Math.floor(Math.random() * 100000),
      recommendedTeams: Math.floor(Math.random() * 3) + 1,
    };

    setAiDecisions(prev => [aiDecision, ...prev]);

    // Show notification
    showNotification({
      id: Date.now(),
      type: 'disaster',
      title: `${disaster.type.toUpperCase()} DETECTED`,
      message: `${disaster.areaName} - Risk: ${disaster.riskPercent}%`,
      severity: disaster.severity,
      timestamp: disaster.timestamp,
    });

    return alert;
  };

  // Remove disaster
  const removeDisaster = (disasterId) => {
    console.log('🗑️ Removing disaster:', disasterId);
    setDisasters(prev => prev.filter(d => d.id !== disasterId));
    setAlerts(prev => prev.map(a => a.disasterId === disasterId ? { ...a, status: 'resolved' } : a));
  };

  // Update alert status
  const updateAlertStatus = (alertId, status) => {
    console.log(`📝 Updating alert ${alertId} to ${status}`);
    setAlerts(prev =>
      prev.map(alert =>
        alert.id === alertId ? { ...alert, status } : alert
      )
    );
  };

  // Approve/Reject AI decision
  const updateAiDecision = (decisionId, status, comment = '') => {
    console.log(`✅ AI Decision ${decisionId}: ${status}`);
    setAiDecisions(prev =>
      prev.map(decision =>
        decision.id === decisionId
          ? { ...decision, status, reviewedAt: new Date().toISOString(), comment }
          : decision
      )
    );

    // If approved, auto-deploy team
    if (status === 'approved') {
      const decision = aiDecisions.find(d => d.id === decisionId);
      if (decision) {
        autoDeployTeam(decision.area, decision.type);
      }
    }
  };

  // Deploy team
  const deployTeam = (teamId, location, mission) => {
    console.log(`🚁 Deploying team ${teamId} to ${location}`);

    const team = teams.find(t => t.id === teamId);
    if (!team) {
      console.error('Team not found:', teamId);
      return;
    }

    // Check if team is already deployed
    if (team.status === 'deployed') {
      console.log('Team already deployed, reassigning...');
    }

    setTeams(prev =>
      prev.map(t =>
        t.id === teamId
          ? {
              ...t,
              status: 'deployed',
              location,
              assignedArea: location,
              mission,
              deployedAt: new Date().toISOString(),
            }
          : t
      )
    );

    showNotification({
      id: Date.now(),
      type: 'team',
      title: 'TEAM DEPLOYED',
      message: `${team.name} (${team.members} personnel) dispatched to ${location}`,
      severity: 'high',
      timestamp: new Date().toISOString(),
    });
  };

  // Auto-deploy team (from AI approval)
  const autoDeployTeam = (area, disasterType) => {
    // Find available team
    const availableTeam = teams.find(t => t.status === 'standby');
    if (availableTeam) {
      deployTeam(
        availableTeam.id,
        area,
        `${disasterType} response operation`
      );
    }
  };

  // Recall team
  const recallTeam = (teamId) => {
    console.log(`🏠 Recalling team ${teamId}`);
    setTeams(prev =>
      prev.map(team =>
        team.id === teamId
          ? { ...team, status: 'standby', location: 'Base', mission: 'Standby', deployedAt: null }
          : team
      )
    );
  };

  // Add hospital route
  const addHospitalRoute = (route) => {
    setHospitalRoutes(prev => [...prev, route]);
  };

  // Show notification
  const showNotification = (notification) => {
    setNotifications(prev => [notification, ...prev]);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      removeNotification(notification.id);
    }, 5000);
  };

  // Remove notification
  const removeNotification = (notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  // Clear all disasters
  const clearAllDisasters = () => {
    console.log('🧹 Clearing all disasters');
    setDisasters([]);
    setAlerts(prev => prev.map(a => ({ ...a, status: 'resolved' })));
  };

  // Get filtered alerts
  const getFilteredAlerts = () => {
    if (alertFilter === 'all') return alerts;
    return alerts.filter(a => a.status === alertFilter);
  };

  // Get filtered AI decisions
  const getFilteredAiDecisions = () => {
    if (aiFilter === 'all') return aiDecisions;
    return aiDecisions.filter(d => d.status === aiFilter);
  };

  // Get resource stats
  const getResourceStats = () => {
    // Teams
    const totalTeams = teams.length;
    const deployedTeams = teams.filter(t => t.status === 'deployed').length;
    const availableTeams = totalTeams - deployedTeams;

    // Personnel
    const totalPersonnel = teams.reduce((sum, t) => sum + t.members, 0);
    const deployedPersonnel = teams.filter(t => t.status === 'deployed').reduce((sum, t) => sum + t.members, 0);
    const availablePersonnel = totalPersonnel - deployedPersonnel;

    // Ambulances
    const totalAmbulances = hospitals.reduce((sum, h) => sum + h.ambulances, 0);

    // Beds
    const totalBeds = hospitals.reduce((sum, h) => sum + h.totalBeds, 0);
    const availableBeds = hospitals.reduce((sum, h) => sum + h.freeBeds, 0);
    const occupiedBeds = totalBeds - availableBeds;

    return {
      teams: {
        total: totalTeams,
        deployed: deployedTeams,
        available: availableTeams,
      },
      personnel: {
        total: totalPersonnel,
        deployed: deployedPersonnel,
        available: availablePersonnel,
      },
      ambulances: {
        total: totalAmbulances,
      },
      beds: {
        total: totalBeds,
        available: availableBeds,
        occupied: occupiedBeds,
      },
    };
  };

  // Get stats for dashboard
  const getStats = () => {
    const activeDisasters = disasters.length;
    const activeAlerts = alerts.filter(a => a.status === 'active').length;
    const deployedTeams = teams.filter(t => t.status === 'deployed').length;
    const criticalAreas = disasters.filter(d => d.severity === 'critical').length;
    const resources = getResourceStats();

    return {
      activeDisasters,
      activeAlerts,
      deployedTeams,
      criticalAreas,
      totalHospitals: hospitals.length,
      totalTeams: teams.length,
      availableTeams: resources.teams.available,
      availablePersonnel: resources.personnel.available,
      totalPersonnel: resources.personnel.total,
      availableBeds: resources.beds.available,
      totalBeds: resources.beds.total,
    };
  };

  // Get monitored areas with current disaster data
  const getMonitoredAreasWithData = () => {
    return monitoredAreas.map(area => {
      const areaDisasters = disasters.filter(d => d.areaName === area.name);
      const hasActive = areaDisasters.length > 0;
      const maxRisk = hasActive
        ? Math.max(...areaDisasters.map(d => d.riskPercent))
        : area.riskPercent;

      return {
        ...area,
        riskPercent: maxRisk,
        hasActiveDisaster: hasActive,
        activeDisasters: areaDisasters,
      };
    });
  };

  const value = {
    // State
    disasters,
    alerts,
    teams,
    hospitals,
    aiDecisions,
    notifications,
    selectedArea,
    hospitalRoutes,
    alertFilter,
    aiFilter,
    monitoredAreas: getMonitoredAreasWithData(),

    // Actions
    addDisaster,
    removeDisaster,
    clearAllDisasters,
    updateAlertStatus,
    updateAiDecision,
    deployTeam,
    recallTeam,
    addHospitalRoute,
    showNotification,
    removeNotification,
    setSelectedArea,
    setAlertFilter,
    setAiFilter,

    // Computed
    getFilteredAlerts,
    getFilteredAiDecisions,
    getStats,
    getResourceStats,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
