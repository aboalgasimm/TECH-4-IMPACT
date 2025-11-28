import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Report, Volunteer, Role, ReportStatus, Prediction, IssueType, Notification, NotificationType, VolunteerSettings, AlertTone } from '../types';
import { classifyReport, predictCrowds, generateSituationSummary, getSafetyAdvice } from '../services/geminiService';

interface UserProfile {
  name: string;
  id: string;
}

interface AppState {
  role: Role;
  setRole: (role: Role) => void;
  userProfile: UserProfile | null;
  login: (role: Role, name: string) => void;
  logout: () => void;
  reports: Report[];
  volunteers: Volunteer[];
  currentUser: Volunteer | null; 
  predictions: Prediction[];
  summary: string;
  notifications: Notification[];
  volunteerSettings: VolunteerSettings;
  updateVolunteerSettings: (settings: VolunteerSettings) => void;
  addReport: (desc: string, loc: { lat: number, lng: number }) => Promise<{ report: Report, advice: string[] }>;
  assignVolunteer: (reportId: string, volunteerId: string) => void;
  acceptTask: (reportId: string) => void;
  resolveReport: (reportId: string) => void;
  toggleVolunteerStatus: () => void;
  runAiAnalysis: () => Promise<void>;
  notify: (title: string, message: string, type: NotificationType) => void;
  removeNotification: (id: string) => void;
  previewTone: (tone: AlertTone) => void;
  focusedLocation: { lat: number, lng: number } | null;
  focusLocationByReportId: (reportId: string) => void;
  clearFocus: () => void;
  publicActiveReportId: string | null;
  setPublicActiveReportId: (id: string | null) => void;
}

const AppContext = createContext<AppState | undefined>(undefined);

// Madinah Coordinates: ~24.4672, 39.6102
const generateMockVolunteers = (): Volunteer[] => [
  { id: 'v1', name: 'علي محمد', location: { lat: 24.4680, lng: 39.6110 }, isOnline: true, skills: ['إسعافات أولية'] },
  { id: 'v2', name: 'عمر خالد', location: { lat: 24.4660, lng: 39.6090 }, isOnline: true, skills: ['إنقاذ', 'نقل'] },
  { id: 'v3', name: 'فاطمة الزهراء', location: { lat: 24.4690, lng: 39.6120 }, isOnline: true, skills: ['طبي', 'تنسيق'] },
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<Role | null>(null); // Null initially for login screen
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [volunteers, setVolunteers] = useState<Volunteer[]>(generateMockVolunteers());
  const [currentUser, setCurrentUser] = useState<Volunteer | null>(null);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [summary, setSummary] = useState<string>("النظام جاهز. بانتظار البلاغات...");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [focusedLocation, setFocusedLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [publicActiveReportId, setPublicActiveReportId] = useState<string | null>(null);
  
  // Settings State
  const [volunteerSettings, setVolunteerSettings] = useState<VolunteerSettings>({
    newTaskTone: 'chime',
    criticalAlertTone: 'siren'
  });

  // Sound Engine using Web Audio API
  const audioContextRef = useRef<AudioContext | null>(null);

  const playTone = (tone: AlertTone) => {
    if (tone === 'silent') return;
    
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioContextRef.current;
    
    // Resume context if suspended (browser policy)
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    if (tone === 'default' || tone === 'chime') {
      // Soft Chime: Sine wave, easing out
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.1); // G5
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 1.5);
      osc.start(now);
      osc.stop(now + 1.5);
    } else if (tone === 'siren') {
      // Urgent Siren: Sawtooth, modulating pitch
      osc.type = 'sawtooth';
      gain.gain.value = 0.15;
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.linearRampToValueAtTime(800, now + 0.3);
      osc.frequency.linearRampToValueAtTime(600, now + 0.6);
      osc.frequency.linearRampToValueAtTime(800, now + 0.9);
      osc.start(now);
      osc.stop(now + 1.0);
    }
  };

  const previewTone = (tone: AlertTone) => {
    playTone(tone);
  };

  // Simulate Socket.IO updates (Volunteer movement in Madinah)
  useEffect(() => {
    const interval = setInterval(() => {
      setVolunteers(prev => prev.map(v => ({
        ...v,
        location: {
          lat: v.location.lat + (Math.random() - 0.5) * 0.0005,
          lng: v.location.lng + (Math.random() - 0.5) * 0.0005
        }
      })));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const login = (selectedRole: Role, name: string) => {
    setRole(selectedRole);

    if (selectedRole === Role.VOLUNTEER) {
      // If a name is provided (e.g., via Google sign-in), create a new volunteer account
      // and set them as the current user. This enables OAuth-based sign-ins for volunteers.
      if (name && name !== 'متطوع سريع' && name !== 'v1') {
        const newVol: Volunteer = {
          id: 'u_' + Math.random().toString(36).substr(2, 9),
          name,
          location: { lat: 24.4672, lng: 39.6102 },
          isOnline: true,
          skills: []
        };
        setVolunteers(prev => [...prev, newVol]);
        setCurrentUser(newVol);
        setUserProfile({ name: newVol.name, id: newVol.id });
        return;
      }
      // When logging in as volunteer, prefer a volunteer who already has a task (currentTaskId)
      // or a volunteer who was assigned a report (either PENDING or ASSIGNED). This keeps the
      // volunteer's active task visible after switching between roles.
      setVolunteers(prev => {
        // Prefer volunteers who already have a currentTaskId
        const withCurrentTask = prev.find(v => v.currentTaskId);

        // Find any report that is assigned (pending or already accepted) to someone
        const assignedReport = reports.find(r => (r.status === ReportStatus.PENDING || r.status === ReportStatus.ASSIGNED) && r.assignedVolunteerId);

        let candidate: Volunteer | undefined = withCurrentTask || (assignedReport ? prev.find(v => v.id === assignedReport.assignedVolunteerId) : undefined);

        // If still no candidate, fall back to flagged volunteer or default v1
        if (!candidate) candidate = prev.find(v => v.hasNewAssignment) || prev.find(v => v.id === 'v1') || prev[0];

        if (candidate) {
          // Update volunteers array to ensure candidate has correct currentTaskId
          const updated = prev.map(v => {
            if (v.id === candidate!.id) {
              const currentTaskId = v.currentTaskId || (assignedReport && assignedReport.assignedVolunteerId === v.id ? assignedReport.id : undefined);
              return { ...v, currentTaskId, hasNewAssignment: false };
            }
            return v;
          });

          // Set current user from updated list to ensure consistency
          const updatedCandidate = updated.find(v => v.id === candidate!.id)!;
          setCurrentUser(updatedCandidate);
          setUserProfile({ name: updatedCandidate.name, id: updatedCandidate.id });

          // Notify the volunteer if they have a pending or assigned task
          const pendingTask = reports.find(r => r.assignedVolunteerId === updatedCandidate.id && (r.status === ReportStatus.PENDING || r.status === ReportStatus.ASSIGNED));
          if (pendingTask) {
            setTimeout(() => notify('طلب استجابة', 'لديك بلاغ معلق بانتظار القبول!', 'alert'), 500);
          }

          return updated;
        }

        return prev;
      });
    } else {
      // For Public/Admin, create a session ID
      const uid = Math.random().toString(36).substr(2, 9);
      setUserProfile({ name, id: uid });
      setCurrentUser(null);
    }
  };

  const logout = () => {
    setRole(null);
    setUserProfile(null);
    setCurrentUser(null);
    setNotifications([]);
  };

  const notify = (title: string, message: string, type: NotificationType) => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, title, message, type }]);
    
    // Play Sound based on Role and Settings
    if (role === Role.VOLUNTEER && currentUser) {
      if (type === 'alert') {
        playTone(volunteerSettings.criticalAlertTone);
      } else {
        // Use default/newTask tone for general info if desired, or silence
        // Here we default generic notifications to the new task tone for visibility
        playTone(volunteerSettings.newTaskTone);
      }
    } else if (role === Role.ADMIN && type === 'alert') {
        playTone('siren'); // Admin always gets siren for alerts
    }
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 8000);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const addReport = async (desc: string, loc: { lat: number, lng: number }): Promise<{ report: Report, advice: string[] }> => {
    // 1. AI Classification
    const classification = await classifyReport(desc);
    
    // 2. AI Safety Advice
    const advice = await getSafetyAdvice(classification.type, desc);

    const newReport: Report = {
      id: Math.random().toString(36).substr(2, 9),
      description: desc,
      location: loc,
      status: ReportStatus.PENDING,
      timestamp: Date.now(),
      type: classification.type,
      aiSeverityScore: classification.severity
    };

    setReports(prev => [...prev, newReport]);

    // High Priority Notification Logic
    if (classification.severity && classification.severity >= 7) {
      notify('بلاغ خطير جديد', `تم رصد حالة ${classification.type} عالية الخطورة.`, 'alert');
    }

    // 3. Auto-assignment Logic
    // Sort by distance
    const availableVolunteers = volunteers
      .filter(v => v.isOnline && !v.currentTaskId)
      .map(v => ({
        ...v,
        distance: Math.hypot(v.location.lat - loc.lat, v.location.lng - loc.lng)
      }))
      .sort((a, b) => a.distance - b.distance);

    const nearest = availableVolunteers[0];

    if (nearest) {
      assignVolunteer(newReport.id, nearest.id);
    } else {
      notify('تنبيه', 'لا يوجد متطوعين متاحين حالياً في المنطقة.', 'info');
    }
    
    return { report: newReport, advice };
  };

  const assignVolunteer = (reportId: string, volunteerId: string) => {
    // Keep status PENDING until accepted
    setReports(prev => prev.map(r => r.id === reportId ? { ...r, assignedVolunteerId: volunteerId } : r));

    // Mark volunteer with pending assignment so they'll be notified when they become the active user
    setVolunteers(prev => prev.map(v => v.id === volunteerId ? { ...v, currentTaskId: reportId, hasNewAssignment: true } : v));

    // If the currently logged in user is the one being assigned, update their state immediately and notify
    if (currentUser?.id === volunteerId) {
      setCurrentUser(prev => prev ? ({ ...prev, currentTaskId: reportId, hasNewAssignment: false }) : null);
      // This notification will trigger the sound via the notify function
      notify('طلب استجابة', 'يوجد بلاغ قريب يحتاج استجابتك. الرجاء القبول.', 'alert');
      // Clear the flag for that volunteer in the volunteers array as well
      setVolunteers(prev => prev.map(v => v.id === volunteerId ? { ...v, hasNewAssignment: false } : v));
    }
  };

  const acceptTask = (reportId: string) => {
    if (!currentUser) return;

    // Focus the map on the accepted report location (if exists)
    const theReport = reports.find(r => r.id === reportId);
    if (theReport) setFocusedLocation(theReport.location);

    // Update Report: Assign to current user and set status to ASSIGNED
    setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: ReportStatus.ASSIGNED, assignedVolunteerId: currentUser.id } : r));
    
    // Update Volunteer State
    setVolunteers(prev => prev.map(v => v.id === currentUser.id ? { ...v, currentTaskId: reportId } : v));
    setCurrentUser(prev => prev ? ({ ...prev, currentTaskId: reportId }) : null);

    notify('تم قبول المهمة', 'أنت الآن في وضع الاستجابة. توجه للموقع.', 'success');
  };

  const resolveReport = (reportId: string) => {
    const report = reports.find(r => r.id === reportId);
    if (!report) return;

    setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: ReportStatus.RESOLVED } : r));
    
    // Clear volunteer task
    const vid = report.assignedVolunteerId || currentUser?.id;
    if (vid) {
        setVolunteers(prev => prev.map(v => v.id === vid ? { ...v, currentTaskId: undefined } : v));
        // Update current user if they are the volunteer
        if (currentUser?.id === vid) {
            setCurrentUser(prev => prev ? ({ ...prev, currentTaskId: undefined }) : null);
            notify('شكراً لك', 'تم إغلاق البلاغ بنجاح.', 'success');
        }
    }
    // Clear focused map location if resolving the currently focused task
    setFocusedLocation(prev => {
      if (!prev) return prev;
      if (report.location.lat === prev.lat && report.location.lng === prev.lng) return null;
      return prev;
    });
  };

  const toggleVolunteerStatus = () => {
    if (!currentUser) return;
    const newStatus = !currentUser.isOnline;
    setCurrentUser({ ...currentUser, isOnline: newStatus });
    setVolunteers(prev => prev.map(v => v.id === currentUser.id ? { ...v, isOnline: newStatus } : v));
  };

  const runAiAnalysis = async () => {
    setSummary("جاري تحليل الموقف...");
    const preds = await predictCrowds(reports);
    setPredictions(preds);
    const sum = await generateSituationSummary(reports);
    setSummary(sum);

    // AI Prediction Notification Logic
    preds.forEach(p => {
      if (p.severity === 'high') {
        notify('تحذير حشود', `توقع ازدحام عالي الخطورة في القطاع: ${p.description}`, 'alert');
      }
    });
  };

  const updateVolunteerSettings = (settings: VolunteerSettings) => {
    setVolunteerSettings(settings);
  };

  return (
    <AppContext.Provider value={{
      role, setRole, userProfile, login, logout, reports, volunteers, currentUser, predictions, summary, notifications,
      volunteerSettings, updateVolunteerSettings, previewTone,
      addReport, assignVolunteer, acceptTask, resolveReport, toggleVolunteerStatus, runAiAnalysis, notify, removeNotification,
      focusedLocation, focusLocationByReportId: (reportId: string) => {
        const r = reports.find(rr => rr.id === reportId);
        if (r) setFocusedLocation(r.location);
      },
      clearFocus: () => setFocusedLocation(null)
      ,
      publicActiveReportId,
      setPublicActiveReportId
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};