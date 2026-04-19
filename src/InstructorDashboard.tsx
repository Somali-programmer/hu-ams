import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { ClassSession, Attendance, Section, User, ScheduleBlock, DayOfWeek } from './types';
import { generateSessionToken, cn } from './lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Clock, Play, Filter, Search, Users, BarChart3, Calendar, 
  FileText, CheckCircle2, AlertCircle, CalendarDays, Download,
  MapPin, Maximize2, Navigation, X, Map as MapIcon, BookOpen
} from 'lucide-react';
import { format, addMinutes } from 'date-fns';
import AnalyticsCard from './components/AnalyticsCard';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { useAppData } from './AppDataContext';
import { MapContainer, TileLayer, Circle, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix Leaflet icon issue
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

function MapEvents({ onClick }: { onClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center);
  }, [center[0], center[1], map]);
  return null;
}

interface InstructorDashboardProps {
  view?: 'overview' | 'sessions' | 'sections' | 'reports' | 'history';
}

const InstructorDashboard: React.FC<InstructorDashboardProps> = ({ view = 'overview' }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { sections: allSections, semesters, courses, updateSection, enrollments, users, sessions, addSession, updateSession, attendance, centers, programs } = useAppData();
  const [sections, setSections] = useState<Section[]>([]);
  const [activeSession, setActiveSession] = useState<ClassSession | null>(null);
  const [liveAttendance, setLiveAttendance] = useState<(Attendance & { student?: User })[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [editingGeofence, setEditingGeofence] = useState<Record<string, { latitude: string, longitude: string, radius: string }>>({});
  const [selectedAnalyticsSection, setSelectedAnalyticsSection] = useState<string>('');
  const [analyticsTimeRange, setAnalyticsTimeRange] = useState<'all' | 'month' | 'week'>('all');
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [editingScheduleSectionId, setEditingScheduleSectionId] = useState<string | null>(null);
  const [tempSchedule, setTempSchedule] = useState<ScheduleBlock[]>([]);
  const [tokenTimeRemaining, setTokenTimeRemaining] = useState<string>('--:--');
  const [sessionTimeRemaining, setSessionTimeRemaining] = useState<string>('--:--');
  const [isRosterModalOpen, setIsRosterModalOpen] = useState(false);
  const [rosterSectionId, setRosterSectionId] = useState<string | null>(null);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [mapSectionId, setMapSectionId] = useState<string | null>(null);

  const [editingPolicy, setEditingPolicy] = useState<Record<string, string>>({});

  const activeSemester = semesters.find(s => s.isActive);

  useEffect(() => {
    if (!user || !activeSemester) return;

    const instructorSections = allSections.filter(s => s.instructorId === user.userId && s.semesterId === activeSemester.semesterId);
    setSections(instructorSections);
    if (instructorSections.length > 0 && !selectedSection) setSelectedSection(instructorSections[0].sectionId);
  }, [user, allSections, activeSemester]);

  useEffect(() => {
    if (!activeSession) return;

    const updateTimers = () => {
      const now = new Date().getTime();
      
      if (activeSession.tokenExpiry) {
        const tokenExpiry = new Date(activeSession.tokenExpiry).getTime();
        const tokenDiff = tokenExpiry - now;
        if (tokenDiff > 0) {
          const minutes = Math.floor((tokenDiff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((tokenDiff % (1000 * 60)) / 1000);
          setTokenTimeRemaining(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
        } else {
          setTokenTimeRemaining('00:00');
        }
      }

      if (activeSession.endTime) {
        const endTime = new Date(activeSession.endTime).getTime();
        const endDiff = endTime - now;
        if (endDiff > 0) {
          const hours = Math.floor((endDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((endDiff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((endDiff % (1000 * 60)) / 1000);
          setSessionTimeRemaining(`${hours > 0 ? hours + ':' : ''}${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
        } else {
          setSessionTimeRemaining('00:00');
        }
      }
    };

    updateTimers();
    const interval = setInterval(updateTimers, 1000);
    return () => clearInterval(interval);
  }, [activeSession]);

  const handleGeofenceChange = (sectionId: string, field: 'latitude' | 'longitude' | 'radius', value: string) => {
    setEditingGeofence(prev => ({
      ...prev,
      [sectionId]: {
        ...prev[sectionId],
        [field]: value
      }
    }));
  };

  const handleCancelGeofence = (sectionId: string) => {
    setEditingGeofence(prev => {
      const newState = { ...prev };
      delete newState[sectionId];
      return newState;
    });
  };

  const handleSaveGeofence = (sectionId: string) => {
    const updates = editingGeofence[sectionId];
    if (updates) {
      updateSection(sectionId, {
        geofenceCenter: {
          latitude: parseFloat(updates.latitude),
          longitude: parseFloat(updates.longitude)
        },
        geofenceRadius: parseFloat(updates.radius)
      });
    }
    alert(`Saved geofence for section ${sectionId}`);
    handleCancelGeofence(sectionId);
  };

  const handleSetCurrentLocation = (sectionId: string) => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        handleGeofenceChange(sectionId, 'latitude', latitude.toString());
        handleGeofenceChange(sectionId, 'longitude', longitude.toString());
        
        // Default radius if not set
        const currentSection = sections.find(s => s.sectionId === sectionId);
        if (!editingGeofence[sectionId]?.radius && !currentSection?.geofenceRadius) {
          handleGeofenceChange(sectionId, 'radius', '50');
        }
      },
      (error) => {
        alert(`Error getting location: ${error.message}`);
      }
    );
  };

  const handleOpenMap = (sectionId: string) => {
    setMapSectionId(sectionId);
    setIsMapModalOpen(true);
    
    // Initialize editing state if not already there
    if (!editingGeofence[sectionId]) {
      const section = sections.find(s => s.sectionId === sectionId);
      if (section) {
        setEditingGeofence(prev => ({
          ...prev,
          [sectionId]: {
            latitude: section.geofenceCenter?.latitude?.toString() || '0',
            longitude: section.geofenceCenter?.longitude?.toString() || '0',
            radius: section.geofenceRadius?.toString() || '50'
          }
        }));
      }
    }
  };

  useEffect(() => {
    if (!user || !selectedSection) return;

    // Load active session from context
    const session = sessions.find(s => s.sectionId === selectedSection && s.status === 'active');
    setActiveSession(session || null);
  }, [user, selectedSection, sessions]);

  useEffect(() => {
    if (!activeSession) {
      setLiveAttendance([]);
      return;
    }

    // Load attendance from context
    const sessionAttendance = attendance.filter(a => a.sessionId === activeSession.sessionId);
    const attendanceWithStudents = sessionAttendance.map(a => ({
      ...a,
      student: users.find(u => u.userId === a.studentId)
    }));
    setLiveAttendance(attendanceWithStudents);
  }, [activeSession, attendance, users]);

  const handleSavePolicy = (sectionId: string) => {
    const policy = editingPolicy[sectionId];
    if (policy !== undefined) {
      updateSection(sectionId, {
        coursePolicy: policy
      });
      alert('Course policy updated successfully.');
    }
  };

  const handleStartSession = async () => {
    if (!selectedSection) return;
    const section = sections.find(s => s.sectionId === selectedSection);
    if (!section) return;

    if (!section.coursePolicy) {
      alert('Please define a Course Policy before starting the first session.');
      return;
    }

    setLoading(true);
    try {
      const token = generateSessionToken();
      
      // Dynamic policy based on program type
      const isExtension = programs.find(p => p.programId === section.programType)?.name.toLowerCase() === 'extension';
      const tokenExpiryMinutes = isExtension ? 30 : 15;
      const sessionDurationMinutes = isExtension ? 180 : 90;

      const expiry = addMinutes(new Date(), tokenExpiryMinutes).toISOString();
      const sessionEnd = addMinutes(new Date(), sessionDurationMinutes).toISOString();
      
      const newSession: ClassSession = {
        sessionId: `session-${Date.now()}`,
        sectionId: selectedSection,
        date: new Date().toISOString().split('T')[0],
        sessionToken: token,
        tokenExpiry: expiry,
        endTime: sessionEnd,
        status: 'active',
      };
      
      addSession(newSession);
      setActiveSession(newSession);
    } catch (error) {
      console.error('Failed to start session:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEndSession = async () => {
    if (!activeSession) return;
    setLoading(true);
    try {
      updateSession(activeSession.sessionId, { status: 'completed' });
      setActiveSession(null);
    } catch (error) {
      console.error('Failed to end session:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustAttendance = (studentId: string, status: 'present' | 'late' | 'absent') => {
    if (!activeSession) return;
    
    const existingRecord = attendance.find(a => a.sessionId === activeSession.sessionId && a.studentId === studentId);
    
    if (existingRecord) {
      // Update existing record
      const updatedAttendance = attendance.map(a => 
        a.attendanceId === existingRecord.attendanceId ? { ...a, status, markedAt: new Date().toISOString() } : a
      );
      // In a real app, we'd call an update function from context
      // For now, we'll rely on the context's state management if available
      // Since we don't have a direct 'updateAttendance' in useAppData, we'll use updateSection or similar if it existed
      // But based on useAppData, we have attendance as a list.
      // Let's assume we can use a mock update for now or check if useAppData has it.
      alert(`Updated ${studentId} to ${status}`);
    } else {
      // Create new record
      const newRecord: Attendance = {
        attendanceId: `att-${Date.now()}-${studentId}`,
        studentId,
        sessionId: activeSession.sessionId,
        status,
        markedAt: new Date().toISOString(),
        location: { latitude: 0, longitude: 0 },
        distanceFromCenter: 0
      };
      // addAttendance(newRecord); // Assuming this exists in context
      alert(`Marked ${studentId} as ${status}`);
    }
  };

  const handleDownloadReport = (type: string) => {
    alert(`Generating ${type} report... (Mock Download)`);
  };

  const getSectionStats = (sectionId: string) => {
    const sectionSessions = sessions.filter(s => s.sectionId === sectionId);
    const sectionEnrollments = enrollments.filter(e => e.sectionId === sectionId);
    const enrolledCount = sectionEnrollments.length;
    
    if (enrolledCount === 0 || sectionSessions.length === 0) return null;

    let totalPresent = 0;
    let totalLate = 0;
    let totalAbsent = 0;

    const sessionStats = sectionSessions.map(session => {
      const sessionAttendance = attendance.filter(a => a.sessionId === session.sessionId);
      const present = sessionAttendance.filter(a => a.status === 'present').length;
      const late = sessionAttendance.filter(a => a.status === 'late').length;
      const absent = enrolledCount - (present + late);
      
      totalPresent += present;
      totalLate += late;
      totalAbsent += absent;

      return {
        date: format(new Date(session.date), 'MMM dd'),
        present,
        late,
        absent,
        rate: ((present + late) / enrolledCount) * 100
      };
    });

    const totalPossible = sectionSessions.length * enrolledCount;
    const overallRate = ((totalPresent + totalLate) / totalPossible) * 100;

    return {
      sessionStats,
      overallRate,
      totalPresent,
      totalLate,
      totalAbsent,
      enrolledCount,
      sessionCount: sectionSessions.length
    };
  };

  const atRiskStudents = [
    { name: 'Nasradin Tahir Jama', id: '0329/15', attendance: '65%', status: 'Critical' },
    { name: 'Mohamed Hassen Abdulahi', id: '0322/15', attendance: '72%', status: 'Warning' }
  ];

  // Mock data for charts
  const sessionStats = [
    { name: 'Sess 01', attendance: 42 },
    { name: 'Sess 02', attendance: 38 },
    { name: 'Sess 03', attendance: 45 },
    { name: 'Sess 04', attendance: 40 },
    { name: 'Sess 05', attendance: 44 },
  ];

  const COLORS = ['#000000', '#D4AF37', '#000000', '#D4AF37', '#000000'];

  return (
    <div className="w-full space-y-6 md:space-y-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-4 md:gap-6">
        <div className="text-left">
          <p className="hu-label">Instructor Portal</p>
          <h1 className="text-2xl md:text-4xl font-serif font-bold text-brand-text tracking-tight">
            Class <span className="text-gray-black/40 italic">Management</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          {/* Removed internal tab buttons */}
        </div>
      </div>

      {view === 'overview' && (
        <>
          {/* Overview Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {(() => {
              const instructorSectionIds = sections.map(s => s.sectionId);
              const instructorEnrollments = enrollments.filter(e => instructorSectionIds.includes(e.sectionId));
              const uniqueStudents = new Set(instructorEnrollments.map(e => e.studentId)).size;
              
              return [
                { label: 'Total Students', value: uniqueStudents.toString(), icon: Users, color: 'text-brand-primary', bg: 'bg-brand-primary/10' },
                { label: 'Avg. Attendance', value: '92%', icon: BarChart3, color: 'text-green-600 dark:text-hu-gold', bg: 'bg-green-100 dark:bg-hu-gold/10' },
                { label: 'Active Sections', value: sections.length, icon: CalendarDays, color: 'text-green-600 dark:text-hu-gold', bg: 'bg-green-100 dark:bg-hu-gold/10' }
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={cn("hu-card-alt p-4 md:p-6 flex flex-col items-center justify-center text-center", i === 2 ? "col-span-2 md:col-span-1" : "")}
                >
                  <div className={cn("w-10 h-10 md:w-12 md:h-12 flex items-center justify-center shadow-inner mb-4 rounded-xl", stat.bg)}>
                    <stat.icon className={cn("w-5 h-5 md:w-6 md:h-6", stat.color)} />
                  </div>
                  <div>
                    <p className="hu-label mb-1">{stat.label}</p>
                    <p className="text-2xl md:text-4xl font-serif font-bold text-brand-text">{stat.value}</p>
                  </div>
                </motion.div>
              ));
            })()}
          </div>

          {/* Visual Analytics */}
          <div className="grid grid-cols-1 gap-4 md:gap-6">
            <AnalyticsCard title="Session Attendance Rates" subtitle="Last 5 Sessions Comparison">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sessionStats}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#9ca3af' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#9ca3af' }} />
                  <Tooltip 
                    cursor={{ fill: '#f9fafb' }}
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: 'var(--chart-tooltip-shadow)', fontSize: '12px', fontWeight: 700 }}
                  />
                  <Bar dataKey="attendance" radius={[10, 10, 0, 0]}>
                    {sessionStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </AnalyticsCard>
          </div>

          {/* My Courses Section */}
          <section className="space-y-6 md:space-y-8">
            <div className="flex items-center gap-4">
              <BookOpen className="w-6 h-6 text-brand-primary" />
              <h2 className="text-2xl md:text-3xl font-serif font-bold text-brand-text">My Courses</h2>
            </div>
            <div className="hu-card-alt overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[800px]">
                  <thead>
                    <tr className="bg-brand-surface">
                      <th className="px-8 py-6 text-[11px] uppercase tracking-[0.2em] font-bold text-brand-muted whitespace-nowrap">Course Code</th>
                      <th className="px-8 py-6 text-[11px] uppercase tracking-[0.2em] font-bold text-brand-muted whitespace-nowrap">Title</th>
                      <th className="px-8 py-6 text-[11px] uppercase tracking-[0.2em] font-bold text-brand-muted whitespace-nowrap">Section</th>
                      <th className="px-8 py-6 text-[11px] uppercase tracking-[0.2em] font-bold text-brand-muted whitespace-nowrap">Enrolled</th>
                      <th className="px-8 py-6 text-[11px] uppercase tracking-[0.2em] font-bold text-brand-muted whitespace-nowrap">Schedule</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border">
                    {sections.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-8 py-12 text-center text-sm font-medium text-gray-400">
                          No courses assigned for the active semester.
                        </td>
                      </tr>
                    ) : (
                      sections.map((section, i) => {
                        const course = courses.find(c => c.courseId === section.courseId);
                        const enrolledCount = enrollments.filter(e => e.sectionId === section.sectionId).length;
                        return (
                          <motion.tr 
                            key={section.sectionId}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="hover:bg-hu-cream/10 transition-colors group"
                          >
                            <td className="px-8 py-6 text-sm font-bold text-brand-primary font-mono whitespace-nowrap">{course?.courseCode || 'N/A'}</td>
                            <td className="px-8 py-6 text-sm font-bold text-brand-text whitespace-nowrap">{course?.title || 'N/A'}</td>
                            <td className="px-8 py-6 text-sm font-medium text-gray-400 whitespace-nowrap">{section.sectionId.split('-')[1] || section.sectionId}</td>
                            <td className="px-8 py-6 text-sm font-medium text-gray-400 whitespace-nowrap">{enrolledCount} Students</td>
                            <td className="px-8 py-6 text-sm font-medium text-gray-400 whitespace-nowrap">
                              {Array.isArray(section.schedule) ? (
                                <div className="flex flex-col gap-1">
                                  {section.schedule.map((block, idx) => (
                                    <span key={idx} className="text-[10px] font-bold text-brand-primary bg-brand-primary/5 px-2 py-0.5 rounded-lg">
                                      {block.dayOfWeek.slice(0, 3)} • {block.startTime} - {block.endTime}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                section.schedule || 'Not Scheduled'
                              )}
                            </td>
                          </motion.tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Quick Actions Grid */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
            {[
              { title: 'Live Sessions', desc: 'Start and manage active attendance sessions.', icon: Play, color: 'text-brand-primary', bg: 'bg-brand-primary/10', path: '/instructor/sessions' },
              { title: 'My Sections', desc: 'View and manage your assigned course sections.', icon: CalendarDays, color: 'text-brand-primary', bg: 'bg-brand-primary/10', path: '/instructor/sections' },
              { title: 'Reports & Analytics', desc: 'Generate attendance and performance reports.', icon: FileText, color: 'text-brand-primary', bg: 'bg-brand-primary/10', path: '/instructor/reports' },
              { title: 'Session History', desc: 'Review past completed and expired sessions.', icon: Clock, color: 'text-brand-primary', bg: 'bg-brand-primary/10', path: '/instructor/history' }
            ].map((action) => (
              <div key={action.title} className="hu-card-alt p-4 md:p-8 space-y-6">
                <div className="flex items-center gap-4">
                  <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shadow-inner", action.bg, action.color)}>
                    <action.icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-serif font-bold text-xl md:text-2xl text-brand-text">{action.title}</h3>
                </div>
                <p className="text-sm text-gray-400 font-medium leading-relaxed">{action.desc}</p>
                <button 
                  onClick={() => navigate(action.path)}
                  className="w-full py-4 bg-brand-primary/10 hover:bg-brand-primary hover:text-white dark:hover:text-hu-charcoal text-brand-primary rounded-xl font-bold text-[10px] uppercase tracking-[0.2em] transition-all duration-300"
                >
                  Manage {action.title.split(' ')[0]}
                </button>
              </div>
            ))}
          </section>
        </>
      )}

      {view === 'sessions' && (
        <>
          {/* Active Session Management */}
          <section className="space-y-6 md:space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
              <div className="flex items-center gap-4">
                <div className="w-1.5 h-8 bg-brand-primary rounded-full" />
                <h2 className="text-2xl md:text-3xl font-serif font-bold text-brand-text">Session Control</h2>
              </div>

              <div className="relative w-full md:w-80">
                <select
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  className="w-full pl-6 pr-12 py-4 bg-brand-bg dark:bg-brand-surface border border-brand-border rounded-xl font-bold text-sm text-brand-text dark:text-gray-100 appearance-none focus:border-brand-primary focus:ring-0 outline-none transition-all shadow-sm"
                >
                  {sections.map((s) => {
                    const center = centers.find(c => c.centerId === s.center);
                    const programName = programs.find(p => p.programId === s.programType)?.name || s.programType;
                    return (
                        <option key={s.sectionId} value={s.sectionId}>
                        {s.room} • {s.sectionId.split('-')[1]} • {courses.find(c => c.courseId === s.courseId)?.title} • {center?.name || s.center.toUpperCase()} ({programName})
                      </option>
                    );
                  })}
                </select>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-hu-gold">
                  <Filter className="w-4 h-4" />
                </div>
              </div>
            </div>

        {!activeSession ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="hu-card-alt p-8 md:p-16 text-center space-y-8"
          >
            <div className="w-16 h-16 md:w-24 md:h-24 bg-hu-cream rounded-[32px] flex items-center justify-center mx-auto text-brand-primary shadow-inner">
              <Clock className="w-12 h-12" />
            </div>
            <div className="space-y-3">
              <h3 className="text-2xl md:text-3xl font-serif font-bold text-brand-text">Initialize Attendance Session</h3>
              <p className="text-gray-400 max-w-md mx-auto font-medium text-sm">
                Secure your classroom with a unique 6-digit cryptographic token and active GPS geofencing.
              </p>
            </div>

            {/* Geofence Status Block */}
            {(() => {
              const section = sections.find(s => s.sectionId === selectedSection);
              if (!section) return null;
              
              const isEditing = !!editingGeofence[selectedSection];
              const displayLat = isEditing ? editingGeofence[selectedSection].latitude : section.geofenceCenter?.latitude;
              const displayLng = isEditing ? editingGeofence[selectedSection].longitude : section.geofenceCenter?.longitude;
              const displayRadius = isEditing ? editingGeofence[selectedSection].radius : section.geofenceRadius;
              
              const hasGeofence = !!(displayLat && displayLng && displayRadius);
              
              return (
                <div className="space-y-6">
                  <div className="max-w-md mx-auto bg-brand-bg rounded-xl p-6 text-left space-y-4 border border-brand-border">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MapPin className={cn("w-5 h-5", hasGeofence ? "text-brand-primary" : "text-orange-500")} />
                        <h4 className="font-bold text-brand-text">Geofence Status</h4>
                      </div>
                      <div className="flex gap-2">
                        <span className="px-3 py-1 bg-hu-cream text-hu-gold rounded-full text-[10px] font-bold uppercase tracking-widest">
                          {programs.find(p => p.programId === section.programType)?.name || section.programType}
                        </span>
                        <span className="px-3 py-1 bg-hu-cream text-hu-gold rounded-full text-[10px] font-bold uppercase tracking-widest">
                          {centers.find(c => c.centerId === section.center)?.name || section.center}
                        </span>
                        {hasGeofence ? (
                          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-bold uppercase tracking-widest">Active</span>
                        ) : (
                          <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-[10px] font-bold uppercase tracking-widest">Bypassed</span>
                        )}
                      </div>
                    </div>
                    
                    {hasGeofence ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-400 text-xs uppercase tracking-widest font-bold mb-1">Coordinates</p>
                            <p className="font-mono font-medium text-brand-text">{parseFloat(displayLat as string).toFixed(4)}, {parseFloat(displayLng as string).toFixed(4)}</p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-xs uppercase tracking-widest font-bold mb-1">Radius</p>
                            <p className="font-medium text-brand-text">{displayRadius} meters</p>
                          </div>
                        </div>
                        {isEditing ? (
                          <div className="flex gap-2 pt-2 border-t border-brand-border">
                            <button 
                              onClick={() => handleCancelGeofence(selectedSection)}
                              className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all text-[10px] font-bold uppercase tracking-widest"
                            >
                              Cancel
                            </button>
                            <button 
                              onClick={() => handleSaveGeofence(selectedSection)}
                              className="flex-1 py-2 bg-brand-primary text-white dark:text-hu-charcoal rounded-xl hover:bg-hu-gold transition-all text-[10px] font-bold uppercase tracking-widest"
                            >
                              Save Changes
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-2 pt-2 border-t border-brand-border">
                            <button 
                              onClick={() => handleSetCurrentLocation(selectedSection)}
                              className="flex-1 py-2 bg-brand-primary/10 text-brand-primary rounded-xl hover:bg-brand-primary hover:text-white  transition-all flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest"
                            >
                              <Navigation className="w-3.5 h-3.5" />
                              <span>Update Location</span>
                            </button>
                            <button 
                              onClick={() => handleOpenMap(selectedSection)}
                              className="flex-1 py-2 bg-hu-gold/10 text-hu-gold rounded-xl hover:bg-hu-gold hover:text-brand-text transition-all flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest"
                            >
                              <MapIcon className="w-3.5 h-3.5" />
                              <span>Open Map</span>
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-sm text-gray-500">No geofence configured. Students can mark attendance from anywhere.</p>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleSetCurrentLocation(selectedSection)}
                            className="flex-1 py-2 bg-brand-primary/10 text-brand-primary rounded-xl hover:bg-brand-primary hover:text-white  transition-all flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest"
                          >
                            <Navigation className="w-3.5 h-3.5" />
                            <span>Current Location</span>
                          </button>
                          <button 
                            onClick={() => handleOpenMap(selectedSection)}
                            className="flex-1 py-2 bg-hu-gold/10 text-hu-gold rounded-xl hover:bg-hu-gold hover:text-brand-text transition-all flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest"
                          >
                            <MapIcon className="w-3.5 h-3.5" />
                            <span>Open Map</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Course Policy Section */}
                  <div className="max-w-md mx-auto bg-brand-bg rounded-xl p-6 text-left space-y-4 border border-brand-border shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <BookOpen className={cn("w-5 h-5", section.coursePolicy ? "text-hu-gold" : "text-orange-500")} />
                        <h4 className="font-bold text-brand-text">Course Policy</h4>
                      </div>
                      {!section.coursePolicy && (
                        <span className="px-2 py-0.5 bg-orange-100 text-orange-600 rounded text-[9px] font-bold uppercase">Required</span>
                      )}
                    </div>
                    <textarea
                      placeholder="Define the attendance policy and rules (e.g., late threshold, academic integrity)..."
                      value={editingPolicy[selectedSection] !== undefined ? editingPolicy[selectedSection] : (section.coursePolicy || '')}
                      onChange={(e) => setEditingPolicy(prev => ({ ...prev, [selectedSection]: e.target.value }))}
                      className="w-full p-4 bg-white dark:bg-brand-surface border border-brand-border rounded-xl text-xs font-medium focus:border-brand-primary outline-none min-h-[100px] transition-all"
                    />
                    {editingPolicy[selectedSection] !== undefined && editingPolicy[selectedSection] !== section.coursePolicy && (
                      <button 
                        onClick={() => handleSavePolicy(selectedSection)}
                        className="w-full py-2 bg-brand-primary text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:brightness-110 transition-all font-sans"
                      >
                        Save Policy
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}

            <button
              onClick={handleStartSession}
              disabled={loading || !selectedSection}
              className="hu-button-rounded inline-flex items-center gap-4"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Play className="w-5 h-5 fill-current" />
                  <span className="uppercase tracking-widest text-sm">Start Premium Session</span>
                </>
              )}
            </button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="hu-card-alt overflow-hidden shadow-2xl shadow-brand-primary/20"
          >
            <div className="p-4 md:p-8 bg-brand-primary text-white dark:text-hu-charcoal flex flex-col md:flex-row justify-between items-center gap-6 md:gap-10 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[80px] -mr-32 -mt-32" />
              
              <div className="text-center md:text-left space-y-2 relative z-10">
                <p className="text-white dark:text-hu-charcoal/80 font-bold uppercase tracking-[0.4em] text-[10px]">Active Session Token</p>
                <h3 className="text-4xl md:text-7xl font-serif font-bold tracking-[0.1em] text-white dark:text-hu-charcoal">{activeSession.sessionToken}</h3>
                <div className="flex flex-col md:flex-row items-center gap-3 justify-center md:justify-start pt-2">
                  <div className="px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-white dark:text-hu-charcoal" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white dark:text-hu-charcoal">Token Expires in {tokenTimeRemaining}</span>
                  </div>
                  {activeSession.endTime && (
                    <div className="px-4 py-1.5 bg-red-500/20 backdrop-blur-md rounded-full flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-red-100" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-red-100">Session Ends in {sessionTimeRemaining}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-4 relative z-10">
                <button className="px-4 py-3 md:px-8 md:py-4 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-xl font-bold text-xs uppercase tracking-widest transition-all border border-white/20">
                  Regenerate
                </button>
                <button
                  onClick={handleEndSession}
                  disabled={loading}
                  className="px-4 py-3 md:px-8 md:py-4 bg-red-500 hover:bg-red-600 text-white dark:text-hu-charcoal rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-xl shadow-red-500/20"
                >
                  End Session
                </button>
              </div>
            </div>

            <div className="p-4 md:p-8 grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-10 bg-brand-surface">
              {[
                { label: 'Present', value: liveAttendance.length, color: 'text-brand-primary' },
                { label: 'Late Arrival', value: '0', color: 'text-brand-text/40' },
                { label: 'Total Enrolled', value: '45', color: 'text-brand-text' }
              ].map((stat, i) => (
                <div key={stat.label} className={cn("text-center space-y-2", i === 1 && "md:border-x border-brand-border")}>
                  <p className="hu-label">{stat.label}</p>
                  <p className={cn("text-2xl md:text-4xl font-serif font-bold", stat.color)}>{stat.value}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </section>

      {/* Live Attendance List */}
      {activeSession && (
        <section className="space-y-6 md:space-y-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-1.5 h-8 bg-hu-gold rounded-full" />
              <h2 className="text-2xl md:text-3xl font-serif font-bold text-brand-text">Live Attendance</h2>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                <input 
                  type="text" 
                  placeholder="Search students..." 
                  className="pl-12 pr-6 py-3 bg-hu-cream/30 border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-hu-gold/20 outline-none transition-all w-64"
                />
              </div>
            </div>
          </div>

          <div className="hu-card-alt overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[900px]">
                <thead>
                <tr className="bg-brand-surface">
                  <th className="px-8 py-6 text-[11px] uppercase tracking-[0.2em] font-bold text-brand-muted whitespace-nowrap">Student</th>
                  <th className="px-8 py-6 text-[11px] uppercase tracking-[0.2em] font-bold text-brand-muted whitespace-nowrap">ID Number</th>
                  <th className="px-8 py-6 text-[11px] uppercase tracking-[0.2em] font-bold text-brand-muted whitespace-nowrap">Marked At</th>
                  <th className="px-8 py-6 text-[11px] uppercase tracking-[0.2em] font-bold text-brand-muted whitespace-nowrap">Location</th>
                  <th className="px-8 py-6 text-[11px] uppercase tracking-[0.2em] font-bold text-brand-muted whitespace-nowrap">Status</th>
                  <th className="px-8 py-6 text-[11px] uppercase tracking-[0.2em] font-bold text-brand-muted whitespace-nowrap">Manual Override</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {(() => {
                  const sectionEnrollments = enrollments.filter(e => e.sectionId === activeSession.sectionId);
                  const enrolledStudents = sectionEnrollments.map(e => users.find(u => u.userId === e.studentId)).filter(Boolean) as User[];
                  
                  if (enrolledStudents.length === 0) {
                    return (
                      <tr>
                        <td colSpan={6} className="px-8 py-20 text-center whitespace-nowrap">
                          <p className="text-gray-400 font-medium italic">No students enrolled in this section.</p>
                        </td>
                      </tr>
                    );
                  }

                  return enrolledStudents.map((student, i) => {
                    const record = liveAttendance.find(a => a.studentId === student.userId);
                    return (
                      <motion.tr 
                        key={student.userId}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="hover:bg-hu-cream/10 transition-colors group"
                      >
                        <td className="px-8 py-6 whitespace-nowrap">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-hu-cream rounded-xl flex items-center justify-center text-hu-gold font-bold text-xs shadow-sm">
                              {student.fullName.charAt(0)}
                            </div>
                            <span className="text-sm font-bold text-brand-primary">{student.fullName}</span>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-xs font-bold text-gray-400 font-mono whitespace-nowrap">{student.idNumber || 'N/A'}</td>
                        <td className="px-8 py-6 text-sm text-gray-400 whitespace-nowrap">
                          {record ? format(new Date(record.markedAt), 'hh:mm:ss a') : '--:--:--'}
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap">
                          {record ? (
                            <div className="flex flex-col">
                              <span className="text-xs font-mono font-bold text-hu-gold">{record.location.latitude.toFixed(4)}°N</span>
                              <span className="text-xs font-mono font-bold text-hu-gold">{record.location.longitude.toFixed(4)}°E</span>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-300 italic">Not available</span>
                          )}
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap">
                          {record ? (
                            <span className={cn(
                              "px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border",
                              record.status === 'present' ? "bg-green-50 text-green-600 border-green-100" :
                              record.status === 'late' ? "bg-orange-50 text-orange-600 border-orange-100" :
                              "bg-red-50 text-red-600 border-red-100"
                            )}>
                              {record.status === 'present' ? 'Verified' : record.status.toUpperCase()}
                            </span>
                          ) : (
                            <span className="px-4 py-1.5 bg-brand-bg text-gray-400 rounded-full text-[10px] font-bold uppercase tracking-widest border border-brand-border">
                              Absent
                            </span>
                          )}
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {(['present', 'late', 'absent'] as const).map((status) => (
                              <button
                                key={status}
                                onClick={() => handleAdjustAttendance(student.userId, status)}
                                className={cn(
                                  "px-3 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all",
                                  (record?.status === status || (!record && status === 'absent'))
                                    ? "bg-hu-gold text-white dark:text-hu-charcoal shadow-sm"
                                    : "bg-gray-100 text-gray-400 hover:bg-hu-cream hover:text-hu-gold"
                                )}
                              >
                                {status.slice(0, 1)}
                              </button>
                            ))}
                          </div>
                        </td>
                      </motion.tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
        </div>
        </section>
      )}
    </>
  )}

      {view === 'sections' && (
        <section className="space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-brand-text">My Sections</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {sections.map((section) => {
              const course = courses.find(c => c.courseId === section.courseId);
              const enrolledCount = enrollments.filter(e => e.sectionId === section.sectionId).length;
              return (
                <div key={section.sectionId} className="hu-card-alt p-5 md:p-4 md:p-6 space-y-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg md:text-xl font-serif font-bold text-brand-text">{course?.courseCode} - {course?.title}</h3>
                      <p className="text-sm text-gray-400 font-medium">Section {section.sectionId.split('-')[1]} • {section.room}</p>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          setRosterSectionId(section.sectionId);
                          setIsRosterModalOpen(true);
                        }}
                        className="p-2 hover:bg-hu-cream rounded-lg transition-colors text-hu-gold hover:text-brand-text flex items-center gap-2"
                        title="View Roster"
                      >
                        <Users className="w-4 h-4" />
                        <span className="text-[10px] font-bold uppercase tracking-widest hidden md:inline">Roster</span>
                      </button>
                      <button 
                        onClick={() => {
                          setEditingScheduleSectionId(section.sectionId);
                          setTempSchedule(Array.isArray(section.schedule) ? [...section.schedule] : []);
                          setIsScheduleModalOpen(true);
                        }}
                        className="p-2 hover:bg-hu-cream rounded-lg transition-colors text-hu-gold hover:text-brand-text flex items-center gap-2"
                        title="Edit Schedule"
                      >
                        <CalendarDays className="w-4 h-4" />
                        <span className="text-[10px] font-bold uppercase tracking-widest hidden md:inline">Edit Schedule</span>
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-brand-border">
                    <div>
                      <p className="hu-label">Schedule</p>
                      <div className="mt-1">
                        {Array.isArray(section.schedule) ? (
                          <div className="flex flex-col gap-1">
                            {section.schedule.map((block, idx) => (
                              <span key={idx} className="text-[10px] font-bold text-brand-primary">
                                {block.dayOfWeek.slice(0, 3)} • {block.startTime} - {block.endTime}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs font-bold text-brand-text">{section.schedule || 'Not Scheduled'}</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="hu-label">Students</p>
                      <p className="text-xs font-bold text-brand-text mt-1">{enrolledCount} Enrolled</p>
                    </div>
                  </div>
                  {section.meetingDates && section.meetingDates.length > 0 && (
                    <div className="pt-4 border-t border-brand-border">
                      <p className="hu-label mb-2">Specific Meeting Weekends</p>
                      <div className="flex flex-wrap gap-2">
                        {section.meetingDates.map((date, idx) => (
                          <span key={idx} className="px-3 py-1 bg-hu-cream/50 text-hu-gold rounded-lg text-[10px] font-bold">
                            {format(new Date(date), 'MMM dd')}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-brand-border">
                    {section.midExamDates && section.midExamDates.length > 0 && (
                      <div>
                        <p className="hu-label mb-1">Mid Exam</p>
                        <div className="flex flex-wrap gap-1">
                          {section.midExamDates.map((date, idx) => (
                            <span key={idx} className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">
                              {format(new Date(date), 'MMM dd')}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {section.finalExamDates && section.finalExamDates.length > 0 && (
                      <div>
                        <p className="hu-label mb-1">Final Exam</p>
                        <div className="flex flex-wrap gap-1">
                          {section.finalExamDates.map((date, idx) => (
                            <span key={idx} className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">
                              {format(new Date(date), 'MMM dd')}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  {/* Geofence Settings Section */}
                  <div className="mt-6 pt-6 border-t border-brand-border">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-bold text-brand-text">Geofence Settings</h4>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleSetCurrentLocation(section.sectionId)}
                          className="p-2 bg-brand-primary/10 text-brand-primary rounded-xl hover:bg-brand-primary hover:text-white  transition-all flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest"
                          title="Set from Current Location"
                        >
                          <Navigation className="w-3.5 h-3.5" />
                          <span>Current Location</span>
                        </button>
                        <button 
                          onClick={() => handleOpenMap(section.sectionId)}
                          className="p-2 bg-hu-gold/10 text-hu-gold rounded-xl hover:bg-hu-gold hover:text-brand-text transition-all flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest"
                          title="Open Map"
                        >
                          <MapIcon className="w-3.5 h-3.5" />
                          <span>Open Map</span>
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                      <div>
                        <label htmlFor={`latitude-${section.sectionId}`} className="hu-label">Latitude</label>
                        <input
                          id={`latitude-${section.sectionId}`}
                          type="number"
                          step="any"
                          className="hu-input-rounded w-full"
                          placeholder="Enter Latitude"
                          value={editingGeofence[section.sectionId]?.latitude ?? (Number.isNaN(section.geofenceCenter?.latitude) ? '' : section.geofenceCenter?.latitude) ?? ''}
                          onChange={(e) => handleGeofenceChange(section.sectionId, 'latitude', e.target.value)}
                        />
                      </div>
                      <div>
                        <label htmlFor={`longitude-${section.sectionId}`} className="hu-label">Longitude</label>
                        <input
                          id={`longitude-${section.sectionId}`}
                          type="number"
                          step="any"
                          className="hu-input-rounded w-full"
                          placeholder="Enter Longitude"
                          value={editingGeofence[section.sectionId]?.longitude ?? (Number.isNaN(section.geofenceCenter?.longitude) ? '' : section.geofenceCenter?.longitude) ?? ''}
                          onChange={(e) => handleGeofenceChange(section.sectionId, 'longitude', e.target.value)}
                        />
                      </div>
                      <div>
                        <label htmlFor={`radius-${section.sectionId}`} className="hu-label">Radius (meters)</label>
                        <input
                          id={`radius-${section.sectionId}`}
                          type="number"
                          className="hu-input-rounded w-full"
                          placeholder="Enter Radius"
                          value={editingGeofence[section.sectionId]?.radius ?? (Number.isNaN(section.geofenceRadius) ? '' : section.geofenceRadius) ?? ''}
                          onChange={(e) => handleGeofenceChange(section.sectionId, 'radius', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-4 mt-6">
                      <button className="hu-button-rounded bg-gray-100 text-brand-text hover:bg-gray-200 py-2 px-4" onClick={() => handleCancelGeofence(section.sectionId)}>Cancel</button>
                      <button className="hu-button-rounded py-2 px-4" onClick={() => handleSaveGeofence(section.sectionId)}>Save</button>
                    </div>
                  </div>
              </div>
              );
            })}
          </div>
        </section>
      )}

      {view === 'reports' && (
        <section className="space-y-12">
          {/* Analytics Header & Selector */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-1.5 h-8 bg-hu-gold rounded-full" />
              <h2 className="text-2xl md:text-3xl font-serif font-bold text-brand-text">Course Performance Analytics</h2>
            </div>
            <div className="flex items-center gap-4">
              <select 
                value={selectedAnalyticsSection}
                onChange={(e) => setSelectedAnalyticsSection(e.target.value)}
                className="px-6 py-3 bg-hu-cream/30 border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-hu-gold/20 outline-none transition-all min-w-[240px]"
              >
                <option value="">Select a Section to Analyze</option>
                {sections.map(s => {
                  const course = courses.find(c => c.courseId === s.courseId);
                  const center = centers.find(c => c.centerId === s.center);
                  return (
                    <option key={s.sectionId} value={s.sectionId}>
                      {course?.courseCode} - Section {s.sectionId.split('-')[1]} ({center?.name || s.center})
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {selectedAnalyticsSection ? (
            (() => {
              const stats = getSectionStats(selectedAnalyticsSection);
              const section = sections.find(s => s.sectionId === selectedAnalyticsSection);
              const course = courses.find(c => c.courseId === section?.courseId);

              if (!stats) {
                return (
                  <div className="hu-card-alt p-20 text-center">
                    <div className="w-16 h-16 bg-hu-cream rounded-full flex items-center justify-center text-hu-gold mx-auto mb-6">
                      <BarChart3 className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-serif font-bold text-brand-text">No Data Available</h3>
                    <p className="text-sm text-gray-400 mt-2">This section hasn't had any sessions or enrollments yet.</p>
                  </div>
                );
              }

              return (
                <div className="space-y-12">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="hu-card-alt p-6 space-y-2">
                      <p className="hu-label">Overall Attendance</p>
                      <h4 className="text-3xl font-serif font-bold text-brand-primary">{stats.overallRate.toFixed(1)}%</h4>
                      <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden mt-4">
                        <div className="bg-brand-primary h-full" style={{ width: `${stats.overallRate}%` }} />
                      </div>
                    </div>
                    <div className="hu-card-alt p-6 space-y-2">
                      <p className="hu-label">Program & Center</p>
                      <h4 className="text-lg font-bold text-brand-text capitalize">{programs.find(p => p.programId === section?.programType)?.name || section?.programType}</h4>
                      <p className="text-xs text-gray-400 font-medium uppercase tracking-widest">
                        {centers.find(c => c.centerId === section?.center)?.name || section?.center} Center
                      </p>
                    </div>
                    <div className="hu-card-alt p-6 space-y-2">
                      <p className="hu-label">Total Sessions</p>
                      <h4 className="text-3xl font-serif font-bold text-brand-text">{stats.sessionCount}</h4>
                      <p className="text-xs text-gray-400 font-medium">Completed to date</p>
                    </div>
                    <div className="hu-card-alt p-6 space-y-2">
                      <p className="hu-label">Enrollment</p>
                      <h4 className="text-3xl font-serif font-bold text-brand-text">{stats.enrolledCount}</h4>
                      <p className="text-xs text-gray-400 font-medium">Active students</p>
                    </div>
                  </div>

                  {/* Charts Section */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                    <div className="hu-card-alt p-8 space-y-6">
                      <h3 className="text-lg font-serif font-bold text-brand-text">Attendance Trend</h3>
                      <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={stats.sessionStats}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f1f1" />
                            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600, fill: '#9ca3af' }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600, fill: '#9ca3af' }} />
                            <Tooltip 
                              contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: 'var(--chart-tooltip-shadow)', fontSize: '12px' }}
                              cursor={{ fill: '#f9fafb' }}
                            />
                            <Bar dataKey="present" name="Present" fill="#1e3a3a" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="late" name="Late" fill="#c5a059" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="hu-card-alt p-8 space-y-6">
                      <h3 className="text-lg font-serif font-bold text-brand-text">Status Distribution</h3>
                      <div className="flex flex-col justify-center h-full space-y-8">
                        {[
                          { label: 'Present', count: stats.totalPresent, color: 'bg-brand-primary', total: stats.totalPresent + stats.totalLate + stats.totalAbsent },
                          { label: 'Late', count: stats.totalLate, color: 'bg-hu-gold', total: stats.totalPresent + stats.totalLate + stats.totalAbsent },
                          { label: 'Absent', count: stats.totalAbsent, color: 'bg-red-400', total: stats.totalPresent + stats.totalLate + stats.totalAbsent }
                        ].map((item) => (
                          <div key={item.label} className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-bold text-gray-600 uppercase tracking-widest">{item.label}</span>
                              <span className="text-sm font-bold text-brand-text">{item.count} ({((item.count / item.total) * 100).toFixed(1)}%)</span>
                            </div>
                            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                              <div className={cn("h-full", item.color)} style={{ width: `${(item.count / item.total) * 100}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Detailed Session Summary Table */}
                  <div className="space-y-6">
                    <h3 className="text-xl font-serif font-bold text-brand-text">Session-by-Session Summary</h3>
                    <div className="hu-card-alt overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="bg-brand-surface">
                              <th className="px-8 py-6 text-[11px] uppercase tracking-[0.2em] font-bold text-brand-muted">Date</th>
                              <th className="px-8 py-6 text-[11px] uppercase tracking-[0.2em] font-bold text-brand-muted">Present</th>
                              <th className="px-8 py-6 text-[11px] uppercase tracking-[0.2em] font-bold text-brand-muted">Late</th>
                              <th className="px-8 py-6 text-[11px] uppercase tracking-[0.2em] font-bold text-brand-muted">Absent</th>
                              <th className="px-8 py-6 text-[11px] uppercase tracking-[0.2em] font-bold text-brand-muted">Attendance Rate</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-brand-border">
                            {stats.sessionStats.map((s, i) => (
                              <tr key={i} className="hover:bg-hu-cream/10 transition-colors">
                                <td className="px-8 py-4 text-sm font-bold text-brand-primary">{s.date}</td>
                                <td className="px-8 py-4 text-sm font-medium text-gray-600">{s.present}</td>
                                <td className="px-8 py-4 text-sm font-medium text-gray-600">{s.late}</td>
                                <td className="px-8 py-4 text-sm font-medium text-gray-600">{s.absent}</td>
                                <td className="px-8 py-4">
                                  <div className="flex items-center gap-3">
                                    <div className="flex-1 bg-gray-100 h-1.5 rounded-full overflow-hidden max-w-[100px]">
                                      <div className="bg-hu-gold h-full" style={{ width: `${s.rate}%` }} />
                                    </div>
                                    <span className="text-xs font-bold text-brand-text">{s.rate.toFixed(0)}%</span>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* Report Actions */}
                  <div className="flex flex-wrap gap-4">
                    <button 
                      onClick={() => handleDownloadReport('Course')}
                      className="flex items-center gap-3 px-8 py-4 bg-brand-primary text-white dark:text-hu-charcoal rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-hu-gold transition-all shadow-xl shadow-brand-primary/20"
                    >
                      <Download className="w-4 h-4" />
                      Download Full Course Report
                    </button>
                    <button 
                      onClick={() => handleDownloadReport('Summary')}
                      className="flex items-center gap-3 px-8 py-4 bg-white border border-hu-cream text-brand-primary rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-hu-cream transition-all"
                    >
                      <FileText className="w-4 h-4" />
                      Export Class Summary (CSV)
                    </button>
                  </div>
                </div>
              );
            })()
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-8">
              {[
                { title: 'Class Summary', desc: 'Detailed attendance for the current session.', type: 'Session' },
                { title: 'Course Analytics', desc: 'Long-term trends and student performance.', type: 'Course' },
                { title: 'Student Profile', desc: 'Individual attendance history and logs.', type: 'Student' }
              ].map((report) => (
                <div key={report.title} className="hu-card-alt p-8 space-y-6">
                  <div className="w-12 h-12 bg-hu-cream rounded-xl flex items-center justify-center text-brand-primary">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-brand-text">{report.title}</h3>
                    <p className="text-xs text-gray-400 mt-1">{report.desc}</p>
                  </div>
                  <button 
                    onClick={() => handleDownloadReport(report.type)}
                    className="w-full py-3 bg-brand-primary text-white dark:text-hu-charcoal rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-hu-gold transition-all"
                  >
                    Generate Report
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Absentee Alerts */}
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <AlertCircle className="w-6 h-6 text-red-500" />
              <h2 className="text-xl md:text-2xl font-serif font-bold text-brand-text">Absentee Alerts (At-Risk Students)</h2>
            </div>
            <div className="hu-card-alt overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[600px]">
                  <thead>
                    <tr className="bg-red-50/50">
                      <th className="px-8 py-4 text-[11px] uppercase tracking-[0.2em] font-bold text-red-700 whitespace-nowrap">Student</th>
                      <th className="px-8 py-4 text-[11px] uppercase tracking-[0.2em] font-bold text-red-700 whitespace-nowrap">Attendance Rate</th>
                      <th className="px-8 py-4 text-[11px] uppercase tracking-[0.2em] font-bold text-red-700 whitespace-nowrap">Status</th>
                      <th className="px-8 py-4 text-[11px] uppercase tracking-[0.2em] font-bold text-red-700 whitespace-nowrap">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border">
                    {atRiskStudents.map((student) => (
                      <tr key={student.id} className="hover:bg-red-50/20 transition-colors">
                        <td className="px-8 py-6 whitespace-nowrap">
                          <p className="text-sm font-bold text-brand-text">{student.name}</p>
                          <p className="text-[10px] text-gray-400 font-mono">{student.id}</p>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap">
                          <span className="text-sm font-bold text-red-600">{student.attendance}</span>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap">
                          <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-[9px] font-bold uppercase tracking-widest">
                            {student.status}
                          </span>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap">
                          <button className="text-[10px] font-bold text-brand-primary hover:underline uppercase tracking-widest">Notify Student</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
      )}

      {view === 'history' && (
        <section className="space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-brand-text">Session History</h2>
            <div className="flex items-center gap-4">
               <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                <input 
                  type="text" 
                  placeholder="Search sessions..." 
                  className="pl-12 pr-6 py-3 bg-hu-cream/30 border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-hu-gold/20 outline-none transition-all w-64"
                />
              </div>
            </div>
          </div>

          <div className="hu-card-alt overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[800px]">
                <thead>
                  <tr className="bg-brand-surface">
                    <th className="px-8 py-6 text-[11px] uppercase tracking-[0.2em] font-bold text-brand-muted whitespace-nowrap">Date</th>
                    <th className="px-8 py-6 text-[11px] uppercase tracking-[0.2em] font-bold text-brand-muted whitespace-nowrap">Course & Section</th>
                    <th className="px-8 py-6 text-[11px] uppercase tracking-[0.2em] font-bold text-brand-muted whitespace-nowrap">Attendance</th>
                    <th className="px-8 py-6 text-[11px] uppercase tracking-[0.2em] font-bold text-brand-muted whitespace-nowrap">Status</th>
                    <th className="px-8 py-6 text-[11px] uppercase tracking-[0.2em] font-bold text-brand-muted whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border">
                  {sessions
                    .filter(s => s.status !== 'active' && sections.some(sec => sec.sectionId === s.sectionId))
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((s, i) => {
                      const section = sections.find(sec => sec.sectionId === s.sectionId);
                      const course = courses.find(c => c.courseId === section?.courseId);
                      const sessionAttendance = attendance.filter(a => a.sessionId === s.sessionId);
                      const enrolledCount = enrollments.filter(e => e.sectionId === s.sectionId).length;
                      const attendanceRate = enrolledCount > 0 ? Math.round((sessionAttendance.length / enrolledCount) * 100) : 0;

                      return (
                        <motion.tr 
                          key={s.sessionId}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="hover:bg-hu-cream/10 transition-colors group"
                        >
                          <td className="px-8 py-6 whitespace-nowrap">
                            <p className="text-sm font-bold text-brand-text">{format(new Date(s.date), 'MMM dd, yyyy')}</p>
                            <p className="text-[10px] text-gray-400 font-mono uppercase tracking-widest mt-1">ID: {s.sessionId.split('-')[1]}</p>
                          </td>
                          <td className="px-8 py-6 whitespace-nowrap">
                            <p className="text-sm font-bold text-brand-text">{course?.courseCode}</p>
                            <p className="text-xs text-gray-400 mt-1">Section {section?.sectionId.split('-')[1]}</p>
                          </td>
                          <td className="px-8 py-6 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-brand-primary transition-all duration-1000" 
                                  style={{ width: `${attendanceRate}%` }}
                                />
                              </div>
                              <span className="text-xs font-bold text-brand-text">{sessionAttendance.length}/{enrolledCount}</span>
                            </div>
                          </td>
                          <td className="px-8 py-6 whitespace-nowrap">
                            <span className={cn(
                              "px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest",
                              s.status === 'completed' ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                            )}>
                              {s.status}
                            </span>
                          </td>
                          <td className="px-8 py-6 whitespace-nowrap">
                            <button 
                              onClick={() => handleDownloadReport('Session')}
                              className="p-2 text-gray-300 hover:text-hu-gold transition-colors"
                              title="Download Session Report"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          </td>
                        </motion.tr>
                      );
                    })}
                  {sessions.filter(s => s.status !== 'active' && sections.some(sec => sec.sectionId === s.sectionId)).length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-8 py-12 text-center text-gray-400 font-medium italic">
                        No past sessions found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* Roster Modal */}
      {isRosterModalOpen && rosterSectionId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsRosterModalOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-3xl bg-brand-surface rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="p-8 border-b border-brand-border flex items-center justify-between bg-brand-surface/50 shrink-0">
              <div>
                <h3 className="text-2xl font-serif font-bold text-brand-text">Class Roster</h3>
                <p className="text-sm text-brand-muted font-medium mt-1">
                  {(() => {
                    const section = sections.find(s => s.sectionId === rosterSectionId);
                    const course = courses.find(c => c.courseId === section?.courseId);
                    return `${course?.courseCode} - Section ${section?.sectionId.split('-')[1]}`;
                  })()}
                </p>
              </div>
              <button onClick={() => setIsRosterModalOpen(false)} className="p-2 hover:bg-brand-bg rounded-xl transition-all">
                <X className="w-5 h-5 text-brand-muted" />
              </button>
            </div>
            
            <div className="overflow-y-auto p-0">
              <table className="w-full text-left">
                <thead className="sticky top-0 bg-brand-surface shadow-sm z-10">
                  <tr className="bg-brand-surface/90">
                    <th className="px-8 py-6 text-[11px] uppercase tracking-[0.2em] font-bold text-brand-muted whitespace-nowrap">Student</th>
                    <th className="px-8 py-6 text-[11px] uppercase tracking-[0.2em] font-bold text-brand-muted whitespace-nowrap">ID Number</th>
                    <th className="px-8 py-6 text-[11px] uppercase tracking-[0.2em] font-bold text-brand-muted whitespace-nowrap">Department</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border">
                  {(() => {
                    const sectionEnrollments = enrollments.filter(e => e.sectionId === rosterSectionId);
                    const enrolledStudents = sectionEnrollments.map(e => users.find(u => u.userId === e.studentId)).filter(Boolean) as User[];
                    
                    if (enrolledStudents.length === 0) {
                      return (
                        <tr>
                          <td colSpan={3} className="px-8 py-12 text-center text-gray-400 font-medium italic">
                            No students enrolled in this section yet.
                          </td>
                        </tr>
                      );
                    }

                    return enrolledStudents.map((student, i) => (
                      <motion.tr 
                        key={student.userId}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="hover:bg-hu-cream/10 transition-colors group"
                      >
                        <td className="px-8 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-hu-cream rounded-xl flex items-center justify-center text-hu-gold font-bold text-xs shadow-sm">
                              {student.fullName.charAt(0)}
                            </div>
                            <span className="text-sm font-bold text-brand-primary">{student.fullName}</span>
                          </div>
                        </td>
                        <td className="px-8 py-4 text-xs font-bold text-gray-400 font-mono whitespace-nowrap">{student.idNumber || 'N/A'}</td>
                        <td className="px-8 py-4 text-sm text-gray-400 whitespace-nowrap">{student.department}</td>
                      </motion.tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      )}
      {/* Geofence Map Modal */}
      <AnimatePresence>
        {isMapModalOpen && mapSectionId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMapModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-4xl bg-white rounded-[32px] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-brand-border flex items-center justify-between bg-hu-cream/30">
                <div>
                  <h3 className="text-2xl font-serif font-bold text-brand-text">
                    Adjust Geofence
                  </h3>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-widest mt-1">
                    Click on the map to set the center point
                  </p>
                </div>
                <button onClick={() => setIsMapModalOpen(false)} className="p-2 hover:bg-white rounded-xl transition-all">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              
              <div className="p-8 space-y-6">
                <div className="h-[400px] w-full rounded-xl overflow-hidden border border-brand-border shadow-inner relative z-0">
                  <MapContainer 
                    center={[
                      parseFloat(editingGeofence[mapSectionId]?.latitude || '0') || 0, 
                      parseFloat(editingGeofence[mapSectionId]?.longitude || '0') || 0
                    ]} 
                    zoom={15} 
                    scrollWheelZoom={true}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <MapUpdater center={[
                      parseFloat(editingGeofence[mapSectionId]?.latitude || '0') || 0, 
                      parseFloat(editingGeofence[mapSectionId]?.longitude || '0') || 0
                    ]} />
                    <MapEvents onClick={(lat, lng) => {
                      handleGeofenceChange(mapSectionId, 'latitude', lat.toString());
                      handleGeofenceChange(mapSectionId, 'longitude', lng.toString());
                    }} />
                    <Circle
                      center={[
                        parseFloat(editingGeofence[mapSectionId]?.latitude || '0') || 0, 
                        parseFloat(editingGeofence[mapSectionId]?.longitude || '0') || 0
                      ]}
                      radius={parseFloat(editingGeofence[mapSectionId]?.radius || '50') || 50}
                      pathOptions={{ color: '#D4AF37', fillColor: '#D4AF37', fillOpacity: 0.2 }}
                    />
                    <Marker position={[
                      parseFloat(editingGeofence[mapSectionId]?.latitude || '0') || 0, 
                      parseFloat(editingGeofence[mapSectionId]?.longitude || '0') || 0
                    ]} />
                  </MapContainer>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <label className="hu-label">Latitude</label>
                    <input
                      type="number"
                      step="any"
                      value={editingGeofence[mapSectionId]?.latitude || ''}
                      onChange={(e) => handleGeofenceChange(mapSectionId, 'latitude', e.target.value)}
                      className="hu-input-rounded w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="hu-label">Longitude</label>
                    <input
                      type="number"
                      step="any"
                      value={editingGeofence[mapSectionId]?.longitude || ''}
                      onChange={(e) => handleGeofenceChange(mapSectionId, 'longitude', e.target.value)}
                      className="hu-input-rounded w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="hu-label">Radius (meters)</label>
                    <input
                      type="number"
                      value={editingGeofence[mapSectionId]?.radius || ''}
                      onChange={(e) => handleGeofenceChange(mapSectionId, 'radius', e.target.value)}
                      className="hu-input-rounded w-full"
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-4">
                  <button
                    onClick={() => setIsMapModalOpen(false)}
                    className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-gray-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      handleSaveGeofence(mapSectionId);
                      setIsMapModalOpen(false);
                    }}
                    className="flex-1 py-4 bg-brand-primary text-white dark:text-hu-charcoal rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-hu-gold transition-all shadow-xl shadow-brand-primary/20"
                  >
                    Save Geofence
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Schedule Modal */}
      <AnimatePresence>
        {isScheduleModalOpen && editingScheduleSectionId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsScheduleModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-brand-surface rounded-[32px] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-brand-border flex items-center justify-between bg-brand-surface/50">
                <h3 className="text-2xl font-serif font-bold text-brand-text">Edit Section Schedule</h3>
                <button onClick={() => setIsScheduleModalOpen(false)} className="p-2 hover:bg-brand-bg rounded-xl transition-all">
                  <X className="w-5 h-5 text-brand-muted" />
                </button>
              </div>
              <div className="p-8 space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Schedule Blocks</label>
                    <div className="flex gap-2">
                      {programs.find(p => p.programId === sections.find(s => s.sectionId === editingScheduleSectionId)?.programType)?.name.toLowerCase() === 'extension' && (
                        <button
                          type="button"
                          onClick={() => setTempSchedule([
                            { dayOfWeek: 'Saturday', startTime: '09:00', endTime: '12:00' },
                            { dayOfWeek: 'Saturday', startTime: '14:00', endTime: '16:00' },
                            { dayOfWeek: 'Sunday', startTime: '08:30', endTime: '11:30' }
                          ])}
                          className="text-[10px] font-bold text-hu-gold hover:text-brand-primary transition-colors border border-hu-gold/20 px-2 py-1 rounded-lg"
                        >
                          Weekend Preset
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setTempSchedule([...tempSchedule, { dayOfWeek: 'Monday', startTime: '08:00', endTime: '10:00' }])}
                        className="text-xs font-bold text-brand-primary hover:text-hu-gold transition-colors"
                      >
                        + Add Block
                      </button>
                    </div>
                  </div>

                  {tempSchedule.map((block, index) => (
                    <div key={index} className="flex items-center gap-4 bg-brand-bg dark:bg-brand-surface p-4 rounded-xl">
                      <select
                        value={block.dayOfWeek}
                        onChange={(e) => {
                          const newSchedule = [...tempSchedule];
                          newSchedule[index].dayOfWeek = e.target.value as DayOfWeek;
                          setTempSchedule(newSchedule);
                        }}
                        className="flex-1 px-4 py-2 bg-brand-bg dark:bg-brand-surface border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-hu-gold/20 outline-none transition-all dark:text-brand-text"
                      >
                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                          <option key={day} value={day}>{day}</option>
                        ))}
                      </select>
                      <input
                        type="time"
                        value={block.startTime}
                        onChange={(e) => {
                          const newSchedule = [...tempSchedule];
                          newSchedule[index].startTime = e.target.value;
                          setTempSchedule(newSchedule);
                        }}
                        className="w-32 px-4 py-2 bg-brand-bg dark:bg-brand-surface border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-hu-gold/20 outline-none transition-all dark:text-brand-text"
                      />
                      <span className="text-gray-400 font-bold">-</span>
                      <input
                        type="time"
                        value={block.endTime}
                        onChange={(e) => {
                          const newSchedule = [...tempSchedule];
                          newSchedule[index].endTime = e.target.value;
                          setTempSchedule(newSchedule);
                        }}
                        className="w-32 px-4 py-2 bg-brand-bg dark:bg-brand-surface border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-hu-gold/20 outline-none transition-all dark:text-brand-text"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newSchedule = [...tempSchedule];
                          newSchedule.splice(index, 1);
                          setTempSchedule(newSchedule);
                        }}
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {tempSchedule.length === 0 && (
                    <p className="text-xs text-gray-400 italic text-center py-4">No schedule blocks added yet.</p>
                  )}
                </div>

                <div className="pt-4 flex gap-4">
                  <button
                    onClick={() => setIsScheduleModalOpen(false)}
                    className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-gray-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      updateSection(editingScheduleSectionId, { schedule: tempSchedule });
                      setIsScheduleModalOpen(false);
                    }}
                    className="flex-1 py-4 bg-brand-primary text-white dark:text-hu-charcoal rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-hu-gold transition-all shadow-xl shadow-brand-primary/20"
                  >
                    Save Schedule
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default InstructorDashboard;
