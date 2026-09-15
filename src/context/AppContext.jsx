import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { monitoredAreas, hospitals as initialHospitals, resqTeams, alerts as initialAlerts, initialAiDecisions } from '../data/mockData';
import { INITIAL_DAMS } from '../data/damData';
import { calculateDamAggregateStats, evaluateDamStatus } from '../services/damService';
import { getUserCurrentLocation, calculateDistanceKm, calculateTransitEta, reverseGeocodeCoordinates } from '../services/locationService';
import { sendCommanderAlert, sendCitizenAlert } from '../services/notificationService';

const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  // ── User Live Location & Manual Search ─────────────────────────────────────
  const [userLocation, setUserLocation] = useState(() => {
    try {
      const saved = localStorage.getItem('resqai_user_location');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.isRealGps && !parsed.isIpFallback && !parsed.name?.toLowerCase().includes('royapuram')) {
          return parsed;
        }
      }
    } catch (e) {}
    return {
      lat: 11.75,
      lng: 79.77,
      name: 'Awaiting Live GPS Permission...',
      isDetected: false,
    };
  });

  const [gpsPermissionStatus, setGpsPermissionStatus] = useState('prompt'); // 'prompt' | 'granted' | 'denied'
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [selectedSearchLocation, setSelectedSearchLocation] = useState(null);

  // ── Core State with Local Storage Persistence ──────────────────────────────
  const [disasters, setDisasters] = useState(() => {
    try {
      const saved = localStorage.getItem('resqai_disasters');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [alerts, setAlerts] = useState(() => {
    try {
      const saved = localStorage.getItem('resqai_alerts');
      return saved ? JSON.parse(saved) : initialAlerts;
    } catch (e) {
      return initialAlerts;
    }
  });

  const [teams, setTeams] = useState(() => {
    try {
      const saved = localStorage.getItem('resqai_teams');
      return saved ? JSON.parse(saved) : resqTeams;
    } catch (e) {
      return resqTeams;
    }
  });

  const [hospitals, setHospitals] = useState(() => {
    try {
      const saved = localStorage.getItem('resqai_hospitals');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 20) {
          return parsed;
        }
      }
      return initialHospitals;
    } catch (e) {
      return initialHospitals;
    }
  });

  // ── Dam & Reservoir Water Levels Telemetry ─────────────────────────────────
  const [dams, setDams] = useState(() => {
    try {
      const saved = localStorage.getItem('resqai_dams');
      return saved ? JSON.parse(saved) : INITIAL_DAMS;
    } catch (e) {
      return INITIAL_DAMS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('resqai_dams', JSON.stringify(dams));
    } catch (e) {}
  }, [dams]);

  const [completedMissions, setCompletedMissions] = useState(() => {
    try {
      const saved = localStorage.getItem('resqai_completed_missions');
      return saved ? JSON.parse(saved) : [
        {
          id: 'mission-01',
          teamId: 'RESQ-02',
          teamName: 'Bravo Team',
          area: 'Cuddalore Port',
          mission: 'Coastal storm surge evacuation and barrier defense',
          deployedAt: new Date(Date.now() - 6 * 3600000).toISOString(),
          completedAt: new Date(Date.now() - 2 * 3600000).toISOString(),
          personnelInvolved: 15,
          civiliansRescued: 142,
          notes: 'Evacuated 45 families to temporary relief shelters. Zero casualties.',
          status: 'completed',
        },
      ];
    } catch (e) {
      return [];
    }
  });

  const [sosBeacons, setSosBeacons] = useState(() => {
    try {
      const saved = localStorage.getItem('resqai_sos_beacons');
      return saved ? JSON.parse(saved) : [
        {
          id: 'sos-1',
          senderName: 'Priya Ramanathan',
          contact: '+91 98401 23456',
          areaName: 'Cuddalore Old Town',
          lat: 11.748,
          lng: 79.765,
          type: 'Flood Evacuation',
          message: 'Water level reaching 1st floor. 4 adults and 1 infant trapped on terrace.',
          peopleCount: 5,
          severity: 'critical',
          timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
          status: 'pending',
        },
        {
          id: 'sos-2',
          senderName: 'Karthik S.',
          contact: '+91 94432 78901',
          areaName: 'Chidambaram West',
          lat: 11.399,
          lng: 79.693,
          type: 'Medical Emergency',
          message: 'Elderly patient needs oxygen cylinder and dialysis transfer immediately.',
          peopleCount: 1,
          severity: 'high',
          timestamp: new Date(Date.now() - 42 * 60000).toISOString(),
          status: 'pending',
        },
      ];
    } catch (e) {
      return [];
    }
  });

  const [aiDecisions, setAiDecisions] = useState(() => {
    try {
      const saved = localStorage.getItem('resqai_ai_decisions');
      return saved ? JSON.parse(saved) : initialAiDecisions;
    } catch (e) {
      return initialAiDecisions;
    }
  });
  const [criticalAlert, setCriticalAlert] = useState(null); // disaster object when risk > 75%
  const [notifications, setNotifications] = useState([]);
  const [selectedArea, setSelectedArea] = useState(null);
  const [hospitalRoutes, setHospitalRoutes] = useState([]);

  // Field Tasks State
  const [tasks, setTasks] = useState([
    {
      id: 1,
      title: 'Evacuate Residents from Flood Zone',
      location: 'Cuddalore Old Town',
      status: 'in-progress',
      priority: 'immediate',
      category: 'Evacuation',
      assignedTeam: 'Alpha Squad',
      assignedLeader: 'Captain Rajesh',
      description: 'Evacuate 150+ residents from low-lying areas before water level rises',
      createdAt: new Date().toISOString(),
    },
    {
      id: 2,
      title: 'Establish Medical Camp at Relief Center',
      location: 'District Sports Stadium',
      status: 'pending',
      priority: 'high',
      category: 'Medical',
      assignedTeam: 'Delta Squad',
      assignedLeader: 'Dr. Priya Kumar',
      description: 'Set up field medical facility with triage station',
      createdAt: new Date().toISOString(),
    },
    {
      id: 3,
      title: 'Distribute Relief Supplies',
      location: 'Cuddalore Govt College',
      status: 'completed',
      priority: 'medium',
      category: 'Relief',
      assignedTeam: 'Charlie Squad',
      assignedLeader: 'Lt. Arun',
      description: 'Distribute food packets, water, and blankets to 200 families',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      completedAt: new Date().toISOString(),
    },
  ]);

  // Filters
  const [alertFilter, setAlertFilter] = useState('all');
  const [aiFilter, setAiFilter] = useState('all');

  // ── Sync to LocalStorage ───────────────────────────────────────────────────
  useEffect(() => {
    try {
      localStorage.setItem('resqai_user_location', JSON.stringify(userLocation));
    } catch (e) {}
  }, [userLocation]);

  useEffect(() => {
    try {
      localStorage.setItem('resqai_disasters', JSON.stringify(disasters));
    } catch (e) {}
  }, [disasters]);

  useEffect(() => {
    try {
      localStorage.setItem('resqai_teams', JSON.stringify(teams));
    } catch (e) {}
  }, [teams]);

  useEffect(() => {
    try {
      localStorage.setItem('resqai_alerts', JSON.stringify(alerts));
    } catch (e) {}
  }, [alerts]);

  useEffect(() => {
    try {
      localStorage.setItem('resqai_hospitals', JSON.stringify(hospitals));
    } catch (e) {}
  }, [hospitals]);

  useEffect(() => {
    try {
      localStorage.setItem('resqai_completed_missions', JSON.stringify(completedMissions));
    } catch (e) {}
  }, [completedMissions]);

  useEffect(() => {
    try {
      localStorage.setItem('resqai_sos_beacons', JSON.stringify(sosBeacons));
    } catch (e) {}
  }, [sosBeacons]);

  // ── Continuous Live GPS Tracking Loop & Telemetry ────────────────────────
  useEffect(() => {
    try {
      localStorage.setItem('resqai_ai_decisions', JSON.stringify(aiDecisions));
    } catch (e) {
      console.warn('Failed to save AI decisions to local storage', e);
    }
  }, [aiDecisions]);

  const [isLiveTracking, setIsLiveTracking] = useState(true);
  const [gpsTrackerTelemetry, setGpsTrackerTelemetry] = useState({
    speed: 0,
    heading: 0,
    accuracy: 10,
    altitude: null,
    movementState: 'STATIONARY',
    lastPing: new Date().toISOString(),
    breadcrumbs: [],
  });

  const prevCoordRef = useRef({ lat: userLocation.lat, lng: userLocation.lng });
  const isGeocodingRef = useRef(false);

  // ── Check Browser Permissions on Mount ────────
  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.permissions?.query) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        setGpsPermissionStatus(result.state);
        if (result.state === 'granted') {
          detectUserLocation().catch(() => {});
        }
        result.onchange = () => {
          setGpsPermissionStatus(result.state);
          if (result.state === 'granted') {
            detectUserLocation().catch(() => {});
          }
        };
      }).catch(() => {});
    }
  }, []);

  // ── Real-Time Watch Position GPS Tracker ───────────────────────────────────
  useEffect(() => {
    if (!isLiveTracking || typeof window === 'undefined' || !navigator.geolocation) return;
    if (gpsPermissionStatus === 'denied' || (!userLocation.isDetected && gpsPermissionStatus === 'prompt')) {
      return;
    }

    let watchId = null;

    const onPosSuccess = async (pos) => {
      const { latitude, longitude, accuracy, speed, heading, altitude } = pos.coords;
      const prev = prevCoordRef.current;
      const distMoved = calculateDistanceKm(prev.lat, prev.lng, latitude, longitude);

      const speedKmh = speed != null ? Math.round(speed * 3.6) : 0;
      const isMoving = (speedKmh > 1) || (distMoved > 0.04);

      setGpsTrackerTelemetry((t) => ({
        ...t,
        speed: speedKmh,
        heading: heading != null ? Math.round(heading) : t.heading,
        accuracy: Math.round(accuracy),
        altitude: altitude != null ? Math.round(altitude) : t.altitude,
        movementState: isMoving ? 'IN MOTION' : 'STATIONARY',
        lastPing: new Date().toISOString(),
      }));

      // If user moved > 40 meters or first detection:
      if (!userLocation.isDetected || distMoved >= 0.04) {
        if (isGeocodingRef.current) return;
        isGeocodingRef.current = true;
        prevCoordRef.current = { lat: latitude, lng: longitude };

        try {
          const newLoc = await reverseGeocodeCoordinates(latitude, longitude, accuracy);
          setUserLocation((curr) => {
            const hasZoneChanged = curr?.zone?.code !== newLoc.zone?.code;
            if (hasZoneChanged && curr.isDetected) {
              showNotification({
                id: Date.now(),
                type: 'system',
                title: '📍 SECTOR BOUNDARY CROSSED',
                message: `Transitioned into ${newLoc.name} (${newLoc.zone?.code || 'ZONE'})`,
                severity: 'info',
                timestamp: new Date().toISOString(),
              });
            }
            return {
              ...newLoc,
              isDetected: true,
              isRealGps: accuracy < 2500,
            };
          });

          // Append to breadcrumbs trail
          setGpsTrackerTelemetry((t) => ({
            ...t,
            breadcrumbs: [
              ...t.breadcrumbs.slice(-30),
              { lat: latitude, lng: longitude, name: newLoc.name, time: new Date().toISOString() },
            ],
          }));
        } catch (e) {
          console.warn('Live tracker reverse geocode failed:', e);
        } finally {
          isGeocodingRef.current = false;
        }
      }
    };

    const onPosError = (err) => {
      console.warn('Live GPS tracker error:', err.message);
    };

    watchId = navigator.geolocation.watchPosition(onPosSuccess, onPosError, {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 10000,
    });

    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [isLiveTracking, userLocation.isDetected]);

  // ── Manual & Movement Simulation Helper (For Testing Movement) ─────────────
  const simulateGpsMovement = async (newLat, newLng, customNameHint = null) => {
    prevCoordRef.current = { lat: newLat, lng: newLng };
    const loc = await reverseGeocodeCoordinates(newLat, newLng, 8, customNameHint);
    const updated = {
      ...loc,
      isDetected: true,
      isRealGps: true,
    };
    setUserLocation(updated);
    setSelectedSearchLocation(null);
    setGpsTrackerTelemetry((t) => ({
      ...t,
      movementState: 'IN MOTION',
      lastPing: new Date().toISOString(),
      breadcrumbs: [
        ...t.breadcrumbs.slice(-30),
        { lat: newLat, lng: newLng, name: loc.name, time: new Date().toISOString() },
      ],
    }));
    try {
      localStorage.setItem('resqai_user_location', JSON.stringify(updated));
    } catch (e) {}
    showNotification({
      id: Date.now(),
      type: 'system',
      title: '🛰️ GPS TRACKER POSITION DISPLACED',
      message: `Sector relocated to ${loc.name}. Threat Zone: ${loc.zone?.code} (${loc.zone?.alertLevel}).`,
      severity: 'info',
      timestamp: new Date().toISOString(),
    });
    return updated;
  };

  // ── Location Actions ───────────────────────────────────────────────────────
  const detectUserLocation = async () => {
    setIsDetectingLocation(true);
    try {
      const loc = await getUserCurrentLocation();
      setUserLocation(loc);
      setGpsPermissionStatus('granted');
      setSelectedSearchLocation(null);
      prevCoordRef.current = { lat: loc.lat, lng: loc.lng };
      showNotification({
        id: Date.now(),
        type: 'system',
        title: '🛰️ LIVE GPS ACCESS GRANTED',
        message: `Command origin locked to ${loc.name} (${loc.zone?.code || 'ZONE'}).`,
        severity: 'info',
        timestamp: new Date().toISOString(),
      });
      return loc;
    } catch (err) {
      console.warn('Geolocation detection:', err.message);
      if (err.message?.toLowerCase().includes('denied')) {
        setGpsPermissionStatus('denied');
      }
      showNotification({
        id: Date.now(),
        type: 'alert',
        title: 'GPS PERMISSION STATUS',
        message: err.message || 'Please click "Allow" when prompted by your browser to track live GPS location.',
        severity: 'warning',
        timestamp: new Date().toISOString(),
      });
      return null;
    } finally {
      setIsDetectingLocation(false);
    }
  };

  const setSearchLocation = (location) => {
    setSelectedSearchLocation(location);
    if (location) {
      showNotification({
        id: Date.now(),
        type: 'system',
        title: '📍 LOCATION FOCUSED',
        message: `Analyzing risk & medical distance for ${location.name}`,
        severity: 'info',
        timestamp: new Date().toISOString(),
      });
    }
  };

  const setUserExactLocation = (location) => {
    const verifiedLocation = {
      ...location,
      isDetected: true,
      isUserConfirmed: true,
    };
    setUserLocation(verifiedLocation);
    setSelectedSearchLocation(null);
    prevCoordRef.current = { lat: location.lat, lng: location.lng };
    try {
      localStorage.setItem('resqai_user_location', JSON.stringify(verifiedLocation));
    } catch (e) {}
    showNotification({
      id: Date.now(),
      type: 'system',
      title: '📍 GPS TRACKER CALIBRATED',
      message: `Tracker origin calibrated to ${location.name} (${location.zone?.code || 'ZONE'}).`,
      severity: 'info',
      timestamp: new Date().toISOString(),
    });
  };

  // ── Disasters Actions ──────────────────────────────────────────────────────
  const addDisaster = (disaster) => {
    setDisasters((prev) => [...prev, disaster]);

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

    setAlerts((prev) => [alert, ...prev]);

    const aiDecision = {
      id: `decision-${disaster.id}`,
      disasterId: disaster.id,
      timestamp: disaster.timestamp,
      type: disaster.type,
      area: disaster.areaName,
      decision: `Deploy emergency response to ${disaster.areaName}`,
      confidence: Math.floor(85 + Math.random() * 15),
      reasoning: `AI detected ${disaster.type} with ${disaster.riskPercent}% risk level. Immediate response recommended based on population density and infrastructure vulnerability.`,
      status: 'pending',
      affectedPopulation: Math.floor(Math.random() * 100000) + 15000,
      recommendedTeams: Math.floor(Math.random() * 3) + 1,
    };

    setAiDecisions((prev) => [aiDecision, ...prev]);

    showNotification({
      id: Date.now(),
      type: 'disaster',
      title: `${disaster.type.toUpperCase()} DETECTED`,
      message: `${disaster.areaName} - Risk: ${disaster.riskPercent}%`,
      severity: disaster.severity,
      timestamp: disaster.timestamp,
    });

    // Trigger critical alert modal + auto push notifications if risk > 75%
    if ((disaster.riskPercent || 0) > 75) {
      setCriticalAlert(disaster);
      // Fire push notifications automatically — no user click needed
      sendCommanderAlert(disaster);
      sendCitizenAlert(disaster);
    }

    return disaster;
  };

  const removeDisaster = (disasterId) => {
    setDisasters((prev) => prev.filter((d) => String(d.id) !== String(disasterId)));
    
    // Remove the alert from dashboard
    setAlerts((prev) => prev.filter((a) => String(a.disasterId) !== String(disasterId)));
    
    // Auto-close any pending AI decisions for this disaster so they don't hang around
    setAiDecisions((prev) => 
      prev.map(decision => 
        (String(decision.disasterId) === String(disasterId) && decision.status === 'pending')
          ? { 
              ...decision, 
              status: 'rejected', 
              reviewedAt: new Date().toISOString(), 
              comment: 'Auto-closed: Disaster was manually resolved by commander' 
            }
          : decision
      )
    );
  };

  const updateAlertStatus = (alertId, status) => {
    setAlerts((prev) => prev.map((alert) => (alert.id === alertId ? { ...alert, status } : alert)));
  };

  const updateAiDecision = (decisionId, status, comment = '') => {
    setAiDecisions((prev) =>
      prev.map((decision) =>
        decision.id === decisionId
          ? { ...decision, status, reviewedAt: new Date().toISOString(), comment }
          : decision
      )
    );

    if (status === 'approved') {
      const decision = aiDecisions.find((d) => d.id === decisionId);
      if (decision) {
        autoDeployTeam(decision.area, decision.type);
      }
    }
  };

  const logAiAction = (moduleName, decisionText, reasoningText, status = 'approved') => {
    const aiDecision = {
      id: `ai-${Date.now()}`,
      timestamp: new Date().toISOString(),
      module: moduleName,
      decision: decisionText,
      reasoning: reasoningText,
      status: status,
      confidence: Math.floor(85 + Math.random() * 15),
      dataPoints: Math.floor(10 + Math.random() * 200),
      algorithm: 'ResQ Copilot LLM Engine v1.0',
      approvedBy: status === 'approved' ? 'Auto-Copilot' : null,
      approvedAt: status === 'approved' ? new Date().toISOString() : null,
    };
    setAiDecisions((prev) => [aiDecision, ...prev]);
  };

  // ── Team Management ────────────────────────────────────────────────────────

  const deployTeam = (teamId, location, mission = 'Emergency rescue deployment') => {
    const team = teams.find((t) => t.id === teamId);
    if (!team) return false;

    setTeams((prev) =>
      prev.map((t) =>
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

    // Auto-approve any pending AI decisions for this area
    setAiDecisions((prev) => 
      prev.map(decision => 
        (decision.status === 'pending' && decision.area === location)
          ? { 
              ...decision, 
              status: 'approved', 
              approvedBy: 'Auto-Copilot', 
              approvedAt: new Date().toISOString(), 
              comment: `Auto-approved by team deployment to ${location}` 
            }
          : decision
      )
    );

    return true;
  };

  const autoDeployTeam = (area, disasterType) => {
    const availableTeam = teams.find((t) => t.status === 'standby');
    if (availableTeam) {
      deployTeam(availableTeam.id, area, `${disasterType} response operation`);
    }
  };

  const recallTeam = (teamId) => {
    setTeams((prev) =>
      prev.map((team) =>
        team.id === teamId
          ? { ...team, status: 'standby', location: 'Base', mission: 'Standby', deployedAt: null }
          : team
      )
    );
  };

  const completeMission = (teamId, report = '', civiliansSaved = 0) => {
    const team = teams.find((t) => t.id === teamId);
    if (!team) return;

    const missionRecord = {
      id: `mission-${Date.now()}`,
      teamId: team.id,
      teamName: team.name,
      area: team.location || 'Active Zone',
      mission: team.mission || 'Response mission',
      deployedAt: team.deployedAt || new Date(Date.now() - 3600000).toISOString(),
      completedAt: new Date().toISOString(),
      personnelInvolved: team.members,
      civiliansRescued: Number(civiliansSaved) || Math.floor(Math.random() * 50) + 12,
      notes: report || 'Rescue mission successfully concluded with all resources accounted for.',
      status: 'completed',
    };

    setCompletedMissions((prev) => [missionRecord, ...prev]);
    recallTeam(teamId);

    showNotification({
      id: Date.now(),
      type: 'team',
      title: 'MISSION CONCLUDED',
      message: `${team.name} completed mission in ${missionRecord.area}. Resources returned to standby.`,
      severity: 'info',
      timestamp: new Date().toISOString(),
    });

    return missionRecord;
  };

  // ── Hospital Actions (Simplified: Focus on Location, Distance, and Ambulances) ──
  const dispatchAmbulance = (hospitalId, destinationArea = 'Emergency Site') => {
    let dispatched = false;
    let hospName = '';

    setHospitals((prev) =>
      prev.map((h) => {
        if (h.id === hospitalId && h.ambulances > 0) {
          dispatched = true;
          hospName = h.name;
          return { ...h, ambulances: h.ambulances - 1 };
        }
        return h;
      })
    );

    if (dispatched) {
      showNotification({
        id: Date.now(),
        type: 'ambulance',
        title: 'AMBULANCE DISPATCHED',
        message: `Ambulance en route from ${hospName} to ${destinationArea}`,
        severity: 'high',
        timestamp: new Date().toISOString(),
      });
      return true;
    }
    return false;
  };

  // ── Hospitals with Dynamic Distance from Disaster Location or User Location ──
  const getHospitalsWithDistance = () => {
    let origin = userLocation;
    
    // If there are active disasters, use the location of the most critical one
    if (disasters && disasters.length > 0) {
      const criticalDisaster = [...disasters].sort((a, b) => (b.riskPercent || 0) - (a.riskPercent || 0))[0];
      if (criticalDisaster && criticalDisaster.lat && criticalDisaster.lng) {
        origin = { lat: criticalDisaster.lat, lng: criticalDisaster.lng };
      }
    } else if (selectedSearchLocation) {
      origin = selectedSearchLocation;
    }

    return hospitals
      .map((h) => {
        const distKm = calculateDistanceKm(origin.lat, origin.lng, h.lat, h.lng);
        const finalDist = distKm != null ? distKm : h.distance || 10;
        return {
          ...h,
          distance: finalDist,
          transitEta: calculateTransitEta(finalDist),
        };
      })
      .sort((a, b) => a.distance - b.distance);
  };

  // ── SOS Distress Beacons ───────────────────────────────────────────────────
  const addSOSBeacon = (beacon) => {
    const newBeacon = {
      id: `sos-${Date.now()}`,
      timestamp: new Date().toISOString(),
      status: 'pending',
      ...beacon,
    };

    setSosBeacons((prev) => [newBeacon, ...prev]);

    showNotification({
      id: Date.now(),
      type: 'sos',
      title: '🚨 CITIZEN SOS BEACON',
      message: `${newBeacon.senderName} (${newBeacon.areaName}): ${newBeacon.message}`,
      severity: 'critical',
      timestamp: new Date().toISOString(),
    });

    return newBeacon;
  };

  const resolveSOSBeacon = (id, resolutionNotes = 'Assistance dispatched and civilian secured') => {
    setSosBeacons((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: 'resolved', resolution: resolutionNotes } : b))
    );

    showNotification({
      id: Date.now(),
      type: 'sos',
      title: 'SOS SIGNAL RESOLVED',
      message: `Distress signal #${id} marked as resolved.`,
      severity: 'info',
      timestamp: new Date().toISOString(),
    });
  };

  const assignNearestTeamToSOS = (id) => {
    const sos = sosBeacons.find((b) => b.id === id);
    if (!sos) return;

    let nearestTeam = null;
    let minDistance = Infinity;

    teams.forEach((team) => {
      const distance = calculateDistanceKm(sos.lat, sos.lng, team.lat, team.lng);
      if (distance !== null && distance < minDistance) {
        minDistance = distance;
        nearestTeam = team;
      }
    });

    if (nearestTeam) {
      setSosBeacons((prev) =>
        prev.map((b) =>
          b.id === id
            ? { ...b, status: 'assigned', assignedTeamId: nearestTeam.id, resolution: `Assigned to ${nearestTeam.name} (${minDistance.toFixed(1)} km)` }
            : b
        )
      );

      showNotification({
        id: Date.now(),
        type: 'sos',
        title: 'TEAM ASSIGNED TO SOS',
        message: `${nearestTeam.name} has been assigned to distress signal #${id} (${minDistance.toFixed(1)} km away).`,
        severity: 'info',
        timestamp: new Date().toISOString(),
      });
    }
  };


  // ── Notifications ──────────────────────────────────────────────────────────
  const showNotification = (notification) => {
    const id = notification.id
      ? `${notification.id}-${Math.random().toString(36).slice(2, 7)}`
      : `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const newNotif = { ...notification, id };
    setNotifications((prev) => [newNotif, ...prev.slice(0, 4)]);
    setTimeout(() => {
      removeNotification(id);
    }, 6000);
  };

  const addHospitalRoute = (route) => {
    setHospitalRoutes((prev) => [route, ...prev]);
  };

  const dismissCriticalAlert = () => setCriticalAlert(null);

  const removeNotification = (notificationId) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
  };

  const clearAllDisasters = () => {
    setDisasters([]);
    setAlerts((prev) => prev.map((a) => ({ ...a, status: 'resolved' })));
  };

  const resetToDefaults = () => {
    localStorage.removeItem('resqai_disasters');
    localStorage.removeItem('resqai_teams');
    localStorage.removeItem('resqai_alerts');
    localStorage.removeItem('resqai_hospitals');
    localStorage.removeItem('resqai_completed_missions');
    localStorage.removeItem('resqai_sos_beacons');
    localStorage.removeItem('resqai_user_location');

    setUserLocation({
      lat: 11.75,
      lng: 79.77,
      name: 'Cuddalore Operations HQ',
      isDetected: false,
    });
    setSelectedSearchLocation(null);
    setDisasters([]);
    setTeams(resqTeams);
    setAlerts(initialAlerts);
    setHospitals(initialHospitals);
    setCompletedMissions([
      {
        id: 'mission-01',
        teamId: 'RESQ-02',
        teamName: 'Bravo Team',
        area: 'Cuddalore Port',
        mission: 'Coastal storm surge evacuation and barrier defense',
        deployedAt: new Date(Date.now() - 6 * 3600000).toISOString(),
        completedAt: new Date(Date.now() - 2 * 3600000).toISOString(),
        personnelInvolved: 15,
        civiliansRescued: 142,
        notes: 'Evacuated 45 families to temporary relief shelters. Zero casualties.',
        status: 'completed',
      },
    ]);
    setSosBeacons([]);

    localStorage.removeItem('resqai_dams');
    setDams(INITIAL_DAMS);

    showNotification({
      id: Date.now(),
      type: 'system',
      title: 'SYSTEM RESTORED',
      message: 'All application state and persistent storage reset to defaults.',
      severity: 'info',
      timestamp: new Date().toISOString(),
    });
  };

  // ── Dam Operational Controls & Surge Simulations ─────────────────────────
  const updateDamDischarge = (damId, outflowCusecs, openGates) => {
    setDams((prevDams) =>
      prevDams.map((d) => {
        if (d.id !== damId) return d;
        const updated = {
          ...d,
          outflowCusecs: Number(outflowCusecs),
          openGates: openGates !== undefined ? Number(openGates) : d.openGates,
        };
        const evaluation = evaluateDamStatus(updated);
        return {
          ...updated,
          status: evaluation.status,
          statusLabel: evaluation.statusLabel,
          riskLevel: evaluation.riskLevel,
        };
      })
    );
  };

  const simulateDamSurge = (damId, additionalInflow = 25000) => {
    setDams((prevDams) =>
      prevDams.map((d) => {
        if (d.id !== damId) return d;
        const newInflow = d.inflowCusecs + additionalInflow;
        const newOutflow = Math.min(d.outflowCusecs + Math.round(additionalInflow * 0.85), 160000);
        const newLevel = Math.min(Number((d.currentLevelFt + 1.2).toFixed(1)), d.frlFt);
        const newStorage = Math.min(Number((d.storageTmc + 2.1).toFixed(2)), d.capacityTmc);
        const newOpenGates = Math.min(d.openGates + 3, d.spillwayGates);

        const updated = {
          ...d,
          inflowCusecs: newInflow,
          outflowCusecs: newOutflow,
          currentLevelFt: newLevel,
          storageTmc: newStorage,
          openGates: newOpenGates,
        };
        const evaluation = evaluateDamStatus(updated);
        const result = {
          ...updated,
          status: evaluation.status,
          statusLabel: evaluation.statusLabel,
          riskLevel: evaluation.riskLevel,
        };

        // Trigger Notification
        showNotification({
          id: Date.now(),
          type: 'danger',
          title: `🌊 ${d.shortName.toUpperCase()} SURGE DISCHARGE: ${newOutflow.toLocaleString()} cusecs`,
          message: `Spillway opened to ${newOpenGates}/${d.spillwayGates} gates. Surge advancing towards ${d.transitSchedule[0]?.location || 'downstream taluks'}.`,
          severity: 'critical',
          timestamp: new Date().toISOString(),
        });

        // Add to active alerts
        const surgeAlert = {
          id: `dam-surge-${d.id}-${Date.now()}`,
          title: `CRITICAL DAM SURGE: ${d.name}`,
          message: `Heavy inflow surging at ${newInflow.toLocaleString()} cusecs. Emergency spillway release elevated to ${newOutflow.toLocaleString()} cusecs. Downstream taluks alerted: ${d.vulnerableTaluks.slice(0, 3).join(', ')}.`,
          priority: 'P1',
          severity: 'critical',
          type: 'flood',
          status: 'active',
          timestamp: new Date().toISOString(),
          damId: d.id,
          source: 'TN WRD Hydrological Command',
        };
        setAlerts((curr) => [surgeAlert, ...curr]);

        // Critical modal siren if high surge
        if (newOutflow >= 35000 || evaluation.status === 'CRITICAL_SURGE') {
          setCriticalAlert({
            id: `dam-${d.id}-${Date.now()}`,
            type: 'Dam Flood Surge',
            areaName: `${d.name} (${d.district})`,
            riskPercent: evaluation.riskLevel,
            severity: 'critical',
            lat: d.lat,
            lng: d.lng,
          });
        }

        return result;
      })
    );
  };

  const getDamStats = () => calculateDamAggregateStats(dams);

  const getFilteredAlerts = () => {
    if (alertFilter === 'all') return alerts;
    return alerts.filter((a) => a.status === alertFilter);
  };

  const getFilteredAiDecisions = () => {
    if (aiFilter === 'all') return aiDecisions;
    return aiDecisions.filter((d) => d.status === aiFilter);
  };

  // ── Task Management Functions ──────────────────────────────────────────────
  const updateTaskStatus = (taskId, newStatus) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? {
              ...task,
              status: newStatus,
              ...(newStatus === 'in-progress' ? { startedAt: new Date().toISOString() } : {}),
            }
          : task
      )
    );

    showNotification({
      id: Date.now(),
      type: 'task',
      title: 'Task Status Updated',
      message: `Task status changed to: ${newStatus}`,
      severity: 'info',
      timestamp: new Date().toISOString(),
    });
  };

  const completeTask = (taskId, details = {}) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? {
              ...task,
              status: 'completed',
              completedAt: new Date().toISOString(),
              completionNotes: details.notes || '',
              completedBy: details.completedBy || 'Field Officer',
            }
          : task
      )
    );

    showNotification({
      id: Date.now(),
      type: 'task',
      title: 'Task Completed',
      message: `Task successfully completed`,
      severity: 'team',
      timestamp: new Date().toISOString(),
    });
  };

  const getTaskStats = () => {
    const total = tasks.length;
    const pending = tasks.filter((t) => t.status === 'pending').length;
    const inProgress = tasks.filter((t) => t.status === 'in-progress').length;
    const completed = tasks.filter((t) => t.status === 'completed').length;
    const immediate = tasks.filter((t) => t.priority === 'immediate' && t.status !== 'completed').length;

    return {
      total,
      pending,
      inProgress,
      completed,
      immediate,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  };

  // ── Resources & Stats (Without Hospital Bed references) ────────────────────
  const getResourceStats = () => {
    const totalTeams = teams.length;
    const deployedTeams = teams.filter((t) => t.status === 'deployed').length;
    const availableTeams = totalTeams - deployedTeams;

    const totalPersonnel = teams.reduce((sum, t) => sum + (t.members || 0), 0);
    const deployedPersonnel = teams
      .filter((t) => t.status === 'deployed')
      .reduce((sum, t) => sum + (t.members || 0), 0);
    const availablePersonnel = totalPersonnel - deployedPersonnel;

    const totalAmbulances = hospitals.reduce((sum, h) => sum + (h.ambulances || 0), 0);
    const emergencyFacilities = hospitals.filter((h) => h.emergency).length;

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
      facilities: {
        total: hospitals.length,
        emergencyReady: emergencyFacilities,
      },
    };
  };

  const getStats = () => {
    const activeDisasters = disasters.length;
    const activeAlerts = alerts.filter((a) => a.status === 'active').length;
    const deployedTeams = teams.filter((t) => t.status === 'deployed').length;
    const criticalAreas = disasters.filter((d) => d.severity === 'critical').length;
    const resources = getResourceStats();

    let overallRiskPercent = 76;
    if (disasters.length > 0) {
      const maxDisasterRisk = Math.max(...disasters.map((d) => d.riskPercent || 50));
      overallRiskPercent = Math.max(overallRiskPercent, maxDisasterRisk);
    }

    const hospitalsWithDist = getHospitalsWithDistance();
    const nearestHospital = hospitalsWithDist[0] || null;

    return {
      activeDisasters,
      activeAlerts,
      deployedTeams,
      criticalAreas,
      overallRiskPercent,
      totalHospitals: hospitals.length,
      nearestHospital,
      totalTeams: teams.length,
      availableTeams: resources.teams.available,
      availablePersonnel: resources.personnel.available,
      totalPersonnel: resources.personnel.total,
      totalAmbulances: resources.ambulances.total,
      pendingSosCount: sosBeacons.filter((b) => b.status === 'pending').length,
      completedMissionsCount: completedMissions.length,
    };
  };

  const getMonitoredAreasWithData = () => {
    const origin = selectedSearchLocation || userLocation;
    return monitoredAreas.map((area) => {
      const areaDisasters = disasters.filter((d) => d.areaName === area.name);
      const hasActive = areaDisasters.length > 0;
      const maxRisk = hasActive
        ? Math.max(...areaDisasters.map((d) => d.riskPercent))
        : area.riskPercent;

      const dist = calculateDistanceKm(origin.lat, origin.lng, area.lat, area.lng);

      return {
        ...area,
        riskPercent: maxRisk,
        hasActiveDisaster: hasActive,
        activeDisasters: areaDisasters,
        distanceFromUserKm: dist,
      };
    });
  };

  const value = {
    // Location state & Live GPS Tracker
    userLocation,
    isDetectingLocation,
    selectedSearchLocation,
    gpsPermissionStatus,
    isLiveTracking,
    setIsLiveTracking,
    gpsTrackerTelemetry,
    simulateGpsMovement,
    detectUserLocation,
    setSearchLocation,
    setUserExactLocation,

    // Core state
    disasters,
    alerts,
    teams,
    hospitals: getHospitalsWithDistance(),
    rawHospitals: hospitals,
    aiDecisions,
    notifications,
    criticalAlert,
    dismissCriticalAlert,
    selectedArea,
    hospitalRoutes,
    alertFilter,
    aiFilter,
    completedMissions,
    sosBeacons,
    monitoredAreas: getMonitoredAreasWithData(),
    tasks,

    // Actions
    addDisaster,
    removeDisaster,
    clearAllDisasters,
    updateAlertStatus,
    updateAiDecision,
    logAiAction,
    deployTeam,
    autoDeployTeam,
    recallTeam,
    completeMission,
    dispatchAmbulance,
    addSOSBeacon,
    resolveSOSBeacon,
    assignNearestTeamToSOS,
    addHospitalRoute,
    showNotification,
    removeNotification,
    setSelectedArea,
    setAlertFilter,
    setAiFilter,
    resetToDefaults,

    // Computed
    getFilteredAlerts,
    getFilteredAiDecisions,
    getStats,
    getResourceStats,

    // Dam & Hydro Telemetry
    dams,
    updateDamDischarge,
    simulateDamSurge,
    getDamStats,

    // Task management
    updateTaskStatus,
    completeTask,
    getTaskStats,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
