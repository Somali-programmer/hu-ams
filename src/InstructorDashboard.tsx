import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { ClassSession, Attendance, Section, User } from './types';
import { generateSessionToken, cn } from './lib/utils';
import { motion } from 'motion/react';
import { Clock, Play, Filter, Search, Users, BarChart3, Calendar, FileText, CheckCircle2, AlertCircle, CalendarDays, Download } from 'lucide-react';
import { format, addMinutes } from 'date-fns';
import AnalyticsCard from './components/AnalyticsCard';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { useAppData } from './AppDataContext';

interface InstructorDashboardProps {
  view?: 'overview' | 'sessions' | 'sections' | 'reports' | 'history';
}

const InstructorDashboard: React.FC<InstructorDashboardProps> = ({ view = 'overview' }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { sections: allSections, semesters, courses, updateSection, enrollments, users, sessions, addSession, updateSession, attendance } = useAppData();
  const [sections, setSections] = useState<Section[]>([]);
  const [activeSession, setActiveSession] = useState<ClassSession | null>(null);
  const [liveAttendance, setLiveAttendance] = useState<(Attendance & { student?: User })[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [editingGeofence, setEditingGeofence] = useState<Record<string, { latitude: string, longitude: string, radius: string }>>({});
  const [tokenTimeRemaining, setTokenTimeRemaining] = useState<string>('--:--');
  const [sessionTimeRemaining, setSessionTimeRemaining] = useState<string>('--:--');
  const [isRosterModalOpen, setIsRosterModalOpen] = useState(false);
  const [rosterSectionId, setRosterSectionId] = useState<string | null>(null);

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

  const handleStartSession = async () => {
    if (!selectedSection) return;
    setLoading(true);
    try {
      const token = generateSessionToken();
      const expiry = addMinutes(new Date(), 15).toISOString();
      const sessionEnd = addMinutes(new Date(), 90).toISOString();
      
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

  const handleAdjustAttendance = (recordId: string) => {
    alert(`Adjusting attendance record ${recordId}... (Mock Action)`);
  };

  const handleDownloadReport = (type: string) => {
    alert(`Generating ${type} report... (Mock Download)`);
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
    <div className="max-w-7xl mx-auto space-y-8 md:space-y-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-4 md:gap-8">
        <div className="text-left">
          <p className="hu-label">Instructor Portal</p>
          <h1 className="text-3xl md:text-5xl font-serif font-bold text-black tracking-tight">
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
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8">
            {[
              { label: 'Total Students', value: '124', icon: Users, color: 'text-hu-green', bg: 'bg-hu-green/10' },
              { label: 'Avg. Attendance', value: '92%', icon: BarChart3, color: 'text-hu-gold', bg: 'bg-hu-gold/10' },
              { label: 'Active Sections', value: sections.length, icon: CalendarDays, color: 'text-black', bg: 'bg-gray-100' }
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="hu-card-alt p-5 md:p-8 flex items-center gap-4 md:p-6"
              >
                <div className={cn("w-10 h-10 md:w-12 md:h-12 md:w-16 md:h-16 rounded-3xl flex items-center justify-center shadow-inner", stat.bg)}>
                  <stat.icon className={cn("w-6 h-6 md:w-8 md:h-8", stat.color)} />
                </div>
                <div>
                  <p className="hu-label mb-1">{stat.label}</p>
                  <p className="text-2xl md:text-4xl font-serif font-bold text-black">{stat.value}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Visual Analytics */}
          <div className="grid grid-cols-1 gap-4 md:gap-8">
            <AnalyticsCard title="Session Attendance Rates" subtitle="Last 5 Sessions Comparison">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sessionStats}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#9ca3af' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#9ca3af' }} />
                  <Tooltip 
                    cursor={{ fill: '#f9fafb' }}
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '12px', fontWeight: 700 }}
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

          {/* Quick Actions Grid */}
          <section className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
            {[
              { title: 'Live Sessions', desc: 'Start and manage active attendance sessions.', icon: Play, color: 'text-blue-500', bg: 'bg-blue-50', path: '/instructor/sessions' },
              { title: 'My Sections', desc: 'View and manage your assigned course sections.', icon: CalendarDays, color: 'text-purple-500', bg: 'bg-purple-50', path: '/instructor/sections' },
              { title: 'Reports & Analytics', desc: 'Generate attendance and performance reports.', icon: FileText, color: 'text-green-500', bg: 'bg-green-50', path: '/instructor/reports' },
              { title: 'Session History', desc: 'Review past completed and expired sessions.', icon: Clock, color: 'text-orange-500', bg: 'bg-orange-50', path: '/instructor/history' }
            ].map((action) => (
              <div key={action.title} className="hu-card-alt p-6 md:p-10 space-y-6 border-none">
                <div className="flex items-center gap-4">
                  <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner", action.bg, action.color)}>
                    <action.icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-serif font-bold text-xl md:text-2xl text-black">{action.title}</h3>
                </div>
                <p className="text-sm text-gray-400 font-medium leading-relaxed">{action.desc}</p>
                <button 
                  onClick={() => navigate(action.path)}
                  className="w-full py-4 bg-hu-green/10 hover:bg-hu-green hover:text-white text-black rounded-2xl font-bold text-[10px] uppercase tracking-[0.2em] transition-all duration-300"
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
                <div className="w-1.5 h-8 bg-hu-green rounded-full" />
                <h2 className="text-2xl md:text-3xl font-serif font-bold text-black">Session Control</h2>
              </div>

              <div className="relative w-full md:w-80">
                <select
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  className="w-full pl-6 pr-12 py-4 bg-white border border-gray-100 rounded-2xl font-bold text-sm text-black appearance-none focus:border-hu-green focus:ring-0 outline-none transition-all shadow-sm"
                >
                  {sections.map((s) => (
                    <option key={s.sectionId} value={s.sectionId}>
                      {s.room} • Section {s.sectionId.slice(0, 4)}
                    </option>
                  ))}
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
            className="hu-card-alt p-8 md:p-16 text-center space-y-8 border-none"
          >
            <div className="w-20 h-20 md:w-24 md:h-24 bg-hu-cream rounded-[32px] flex items-center justify-center mx-auto text-hu-green shadow-inner">
              <Clock className="w-12 h-12" />
            </div>
            <div className="space-y-3">
              <h3 className="text-2xl md:text-3xl font-serif font-bold text-black">Initialize Attendance Session</h3>
              <p className="text-gray-400 max-w-md mx-auto font-medium text-sm">
                Secure your classroom with a unique 6-digit cryptographic token and active GPS geofencing.
              </p>
            </div>
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
            className="hu-card-alt overflow-hidden border-none shadow-2xl shadow-hu-green/20"
          >
            <div className="p-6 md:p-10 bg-hu-green text-white flex flex-col md:flex-row justify-between items-center gap-6 md:gap-10 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[80px] -mr-32 -mt-32" />
              
              <div className="text-center md:text-left space-y-2 relative z-10">
                <p className="text-white/80 font-bold uppercase tracking-[0.4em] text-[10px]">Active Session Token</p>
                <h3 className="text-4xl md:text-7xl font-serif font-bold tracking-[0.1em] text-white">{activeSession.sessionToken}</h3>
                <div className="flex flex-col md:flex-row items-center gap-3 justify-center md:justify-start pt-2">
                  <div className="px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-white" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white">Token Expires in {tokenTimeRemaining}</span>
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
                <button className="px-4 py-3 md:px-8 md:py-4 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-2xl font-bold text-xs uppercase tracking-widest transition-all border border-white/20">
                  Regenerate
                </button>
                <button
                  onClick={handleEndSession}
                  disabled={loading}
                  className="px-4 py-3 md:px-8 md:py-4 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-bold text-xs uppercase tracking-widest transition-all shadow-xl shadow-red-500/20"
                >
                  End Session
                </button>
              </div>
            </div>

            <div className="p-6 md:p-10 grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10 bg-white">
              {[
                { label: 'Present', value: liveAttendance.length, color: 'text-hu-green' },
                { label: 'Late Arrival', value: '0', color: 'text-hu-charcoal/40' },
                { label: 'Total Enrolled', value: '45', color: 'text-black' }
              ].map((stat, i) => (
                <div key={stat.label} className={cn("text-center space-y-2", i === 1 && "md:border-x border-gray-50")}>
                  <p className="hu-label">{stat.label}</p>
                  <p className={cn("text-3xl md:text-5xl font-serif font-bold", stat.color)}>{stat.value}</p>
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
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-black">Live Attendance</h2>
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

          <div className="hu-card-alt overflow-hidden border-none">
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[800px]">
                <thead>
                <tr className="bg-hu-cream/20">
                  <th className="px-4 py-4 md:px-8 md:py-6 text-[11px] uppercase tracking-[0.2em] font-bold text-gray-black/70 whitespace-nowrap">Student</th>
                  <th className="px-4 py-4 md:px-8 md:py-6 text-[11px] uppercase tracking-[0.2em] font-bold text-gray-black/70 whitespace-nowrap">ID Number</th>
                  <th className="px-8 py-6 text-[11px] uppercase tracking-[0.2em] font-bold text-gray-black/70 whitespace-nowrap">Marked At</th>
                  <th className="px-8 py-6 text-[11px] uppercase tracking-[0.2em] font-bold text-gray-black/70 whitespace-nowrap">Status</th>
                  <th className="px-8 py-6 text-[11px] uppercase tracking-[0.2em] font-bold text-gray-black/70 whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {liveAttendance.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-20 text-center whitespace-nowrap">
                      <p className="text-gray-400 font-medium italic">Awaiting first student entry...</p>
                    </td>
                  </tr>
                ) : (
                  liveAttendance.map((record, i) => (
                    <motion.tr 
                      key={record.attendanceId}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="hover:bg-hu-cream/10 transition-colors group"
                    >
                      <td className="px-8 py-6 whitespace-nowrap">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-hu-cream rounded-xl flex items-center justify-center text-hu-gold font-bold text-xs shadow-sm">
                            {record.student?.fullName.charAt(0)}
                          </div>
                          <span className="text-sm font-bold text-hu-green">{record.student?.fullName}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-xs font-bold text-gray-400 font-mono whitespace-nowrap">{record.student?.idNumber || 'N/A'}</td>
                      <td className="px-8 py-6 text-sm text-gray-400 whitespace-nowrap">
                        {format(new Date(record.markedAt), 'hh:mm:ss a')}
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <span className="px-4 py-1.5 bg-green-50 text-green-600 rounded-full text-[10px] font-bold uppercase tracking-widest border border-green-100">
                          Verified
                        </span>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <button 
                          onClick={() => handleAdjustAttendance(record.attendanceId)}
                          className="text-[10px] font-bold text-hu-gold hover:text-hu-green uppercase tracking-widest transition-colors"
                        >
                          Adjust
                        </button>
                      </td>
                    </motion.tr>
                  ))
                )}
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
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-black">My Sections</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {sections.map((section) => {
              const course = courses.find(c => c.courseId === section.courseId);
              const enrolledCount = enrollments.filter(e => e.sectionId === section.sectionId).length;
              return (
                <div key={section.sectionId} className="hu-card-alt p-5 md:p-5 md:p-8 space-y-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg md:text-xl font-serif font-bold text-black">{course?.courseCode} - {course?.title}</h3>
                      <p className="text-sm text-gray-400 font-medium">Section {section.sectionId.split('-')[1]} • {section.room}</p>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          setRosterSectionId(section.sectionId);
                          setIsRosterModalOpen(true);
                        }}
                        className="p-2 hover:bg-hu-cream rounded-lg transition-colors text-hu-gold hover:text-black flex items-center gap-2"
                        title="View Roster"
                      >
                        <Users className="w-4 h-4" />
                        <span className="text-[10px] font-bold uppercase tracking-widest hidden md:inline">Roster</span>
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50">
                    <div>
                      <p className="hu-label">Schedule</p>
                      <p className="text-xs font-bold text-black mt-1">{section.schedule}</p>
                    </div>
                    <div>
                      <p className="hu-label">Students</p>
                      <p className="text-xs font-bold text-black mt-1">{enrolledCount} Enrolled</p>
                    </div>
                  </div>
                  {/* Geofence Settings Section */}
                  <div className="mt-6 pt-6 border-t border-gray-50">
                  <h4 className="text-lg font-bold text-black mb-4">Geofence Settings</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <label htmlFor={`latitude-${section.sectionId}`} className="hu-label">Latitude</label>
                      <input
                        id={`latitude-${section.sectionId}`}
                        type="number"
                        className="hu-input-rounded w-full"
                        placeholder="Enter Latitude"
                        value={editingGeofence[section.sectionId]?.latitude ?? section.geofenceCenter?.latitude ?? ''}
                        onChange={(e) => handleGeofenceChange(section.sectionId, 'latitude', e.target.value)}
                      />
                    </div>
                    <div>
                      <label htmlFor={`longitude-${section.sectionId}`} className="hu-label">Longitude</label>
                      <input
                        id={`longitude-${section.sectionId}`}
                        type="number"
                        className="hu-input-rounded w-full"
                        placeholder="Enter Longitude"
                        value={editingGeofence[section.sectionId]?.longitude ?? section.geofenceCenter?.longitude ?? ''}
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
                        value={editingGeofence[section.sectionId]?.radius ?? section.geofenceRadius ?? ''}
                        onChange={(e) => handleGeofenceChange(section.sectionId, 'radius', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-4 mt-6">
                    <button className="hu-button-rounded bg-gray-100 text-hu-charcoal hover:bg-gray-200 py-2 px-4" onClick={() => handleCancelGeofence(section.sectionId)}>Cancel</button>
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
          {/* Absentee Alerts */}
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <AlertCircle className="w-6 h-6 text-red-500" />
              <h2 className="text-xl md:text-2xl font-serif font-bold text-black">Absentee Alerts</h2>
            </div>
            <div className="hu-card-alt overflow-hidden border-none">
              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[600px]">
                  <thead>
                    <tr className="bg-red-50/50">
                      <th className="px-4 py-3 md:px-8 md:py-4 text-[11px] uppercase tracking-[0.2em] font-bold text-red-700 whitespace-nowrap">Student</th>
                    <th className="px-4 py-3 md:px-8 md:py-4 text-[11px] uppercase tracking-[0.2em] font-bold text-red-700 whitespace-nowrap">Attendance</th>
                    <th className="px-8 py-4 text-[11px] uppercase tracking-[0.2em] font-bold text-red-700 whitespace-nowrap">Status</th>
                    <th className="px-8 py-4 text-[11px] uppercase tracking-[0.2em] font-bold text-red-700 whitespace-nowrap">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {atRiskStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-red-50/20 transition-colors">
                      <td className="px-8 py-6 whitespace-nowrap">
                        <p className="text-sm font-bold text-black">{student.name}</p>
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
                        <button className="text-[10px] font-bold text-hu-green hover:underline uppercase tracking-widest">Notify</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          </div>

          {/* Report Generation */}
          <div className="space-y-6">
            <h2 className="text-2xl font-serif font-bold text-black">Report Generation</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { title: 'Class Summary', desc: 'Detailed attendance for the current session.', type: 'Session' },
                { title: 'Course Analytics', desc: 'Long-term trends and student performance.', type: 'Course' },
                { title: 'Student Profile', desc: 'Individual attendance history and logs.', type: 'Student' }
              ].map((report) => (
                <div key={report.title} className="hu-card-alt p-8 space-y-6">
                  <div className="w-12 h-12 bg-hu-cream rounded-2xl flex items-center justify-center text-hu-green">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-black">{report.title}</h3>
                    <p className="text-xs text-gray-400 mt-1">{report.desc}</p>
                  </div>
                  <button 
                    onClick={() => handleDownloadReport(report.type)}
                    className="w-full py-3 bg-hu-green text-white rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-hu-gold transition-all"
                  >
                    Generate Report
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {view === 'history' && (
        <section className="space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-black">Session History</h2>
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

          <div className="hu-card-alt overflow-hidden border-none">
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[800px]">
                <thead>
                  <tr className="bg-hu-cream/20">
                    <th className="px-8 py-6 text-[11px] uppercase tracking-[0.2em] font-bold text-gray-black/70 whitespace-nowrap">Date</th>
                    <th className="px-8 py-6 text-[11px] uppercase tracking-[0.2em] font-bold text-gray-black/70 whitespace-nowrap">Course & Section</th>
                    <th className="px-8 py-6 text-[11px] uppercase tracking-[0.2em] font-bold text-gray-black/70 whitespace-nowrap">Attendance</th>
                    <th className="px-8 py-6 text-[11px] uppercase tracking-[0.2em] font-bold text-gray-black/70 whitespace-nowrap">Status</th>
                    <th className="px-8 py-6 text-[11px] uppercase tracking-[0.2em] font-bold text-gray-black/70 whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
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
                            <p className="text-sm font-bold text-black">{format(new Date(s.date), 'MMM dd, yyyy')}</p>
                            <p className="text-[10px] text-gray-400 font-mono uppercase tracking-widest mt-1">ID: {s.sessionId.split('-')[1]}</p>
                          </td>
                          <td className="px-8 py-6 whitespace-nowrap">
                            <p className="text-sm font-bold text-black">{course?.courseCode}</p>
                            <p className="text-xs text-gray-400 mt-1">Section {section?.sectionId.split('-')[1]}</p>
                          </td>
                          <td className="px-8 py-6 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-hu-green transition-all duration-1000" 
                                  style={{ width: `${attendanceRate}%` }}
                                />
                              </div>
                              <span className="text-xs font-bold text-black">{sessionAttendance.length}/{enrolledCount}</span>
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
            className="relative w-full max-w-3xl bg-white rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-hu-cream/30 shrink-0">
              <div>
                <h3 className="text-2xl font-serif font-bold text-black">Class Roster</h3>
                <p className="text-sm text-gray-400 font-medium mt-1">
                  {(() => {
                    const section = sections.find(s => s.sectionId === rosterSectionId);
                    const course = courses.find(c => c.courseId === section?.courseId);
                    return `${course?.courseCode} - Section ${section?.sectionId.split('-')[1]}`;
                  })()}
                </p>
              </div>
              <button onClick={() => setIsRosterModalOpen(false)} className="p-2 hover:bg-white rounded-xl transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-gray-400"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
            
            <div className="overflow-y-auto p-0">
              <table className="w-full text-left">
                <thead className="sticky top-0 bg-white shadow-sm z-10">
                  <tr className="bg-hu-cream/20">
                    <th className="px-8 py-6 text-[11px] uppercase tracking-[0.2em] font-bold text-gray-black/70 whitespace-nowrap">Student</th>
                    <th className="px-8 py-6 text-[11px] uppercase tracking-[0.2em] font-bold text-gray-black/70 whitespace-nowrap">ID Number</th>
                    <th className="px-8 py-6 text-[11px] uppercase tracking-[0.2em] font-bold text-gray-black/70 whitespace-nowrap">Department</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
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
                            <span className="text-sm font-bold text-hu-green">{student.fullName}</span>
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
    </div>
  );
};

export default InstructorDashboard;
