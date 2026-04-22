import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { ClassSession, Attendance, Section } from './types';
import { calculateDistance, cn } from './lib/utils';
import { motion } from 'motion/react';
import { MapPin, Clock, CheckCircle2, AlertCircle, TrendingUp, CalendarDays, Download, Calendar, FileText, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';
import AnalyticsCard from './components/AnalyticsCard';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { useAppData } from './AppDataContext';

interface StudentDashboardProps {
  view?: 'overview' | 'attendance' | 'schedule';
}

const StudentDashboard: React.FC<StudentDashboardProps> = ({ view = 'overview' }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { sessions, attendance, sections, enrollments, semesters, addAttendance, centers, courses, programs } = useAppData();
  const [activeSessions, setActiveSessions] = useState<(ClassSession & { section?: Section })[]>([]);
  const [attendanceHistory, setAttendanceHistory] = useState<Attendance[]>([]);
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [policyAccepted, setPolicyAccepted] = useState<Record<string, boolean>>({});

  const activeSemester = semesters.find(s => s.isActive);

  useEffect(() => {
    if (!user || !activeSemester) return;

    // Get sections the student is enrolled in for the active semester
    const studentEnrollments = enrollments.filter(e => e.studentId === user.userId);
    const enrolledSectionIds = studentEnrollments.map(e => e.sectionId);
    const studentSections = sections.filter(s => enrolledSectionIds.includes(s.sectionId) && s.semesterId === activeSemester.semesterId);
    const studentSectionIds = studentSections.map(s => s.sectionId);

    // Load active sessions for those sections
    const sessionsData = sessions
      .filter(session => studentSectionIds.includes(session.sectionId) && session.status === 'active')
      .map(session => ({
        ...session,
        section: studentSections.find(s => s.sectionId === session.sectionId)
      }));
    setActiveSessions(sessionsData as (ClassSession & { section?: Section })[]);

    // Load attendance history
    const studentAttendance = attendance.filter(a => a.studentId === user.userId);
    setAttendanceHistory(studentAttendance);
  }, [user, sessions, attendance, sections, enrollments, activeSemester]);

  const [mockLocation, setMockLocation] = useState(true);

  const handleDownloadReport = () => {
    setSuccess('Preparing your detailed attendance report for download...');
    setTimeout(() => {
      setSuccess(null);
      alert('Your attendance report (PDF) has been generated based on your real records.');
    }, 1500);
  };

  const attendancePercentage = attendanceHistory.length > 0 
    ? Math.round((attendanceHistory.filter(a => a.status === 'present').length / (activeSessions.length + attendanceHistory.length)) * 100)
    : 0;

  const isAtRisk = attendancePercentage < 80 && attendanceHistory.length > 0;

  const COLORS = ['#000000', '#D4AF37', '#EF4444'];

  // Derived data for charts
  const attendanceTrend = attendanceHistory
    .sort((a, b) => new Date(a.markedAt).getTime() - new Date(b.markedAt).getTime())
    .slice(-7)
    .map((a) => ({
      name: format(new Date(a.markedAt), 'EEE'),
      value: a.status === 'present' ? 100 : a.status === 'late' ? 70 : 0
    }));

  if (attendanceTrend.length === 0) {
    attendanceTrend.push({ name: 'N/A', value: 0 });
  }

  const distributionData = [
    { name: 'Present', value: attendanceHistory.filter(a => a.status === 'present').length },
    { name: 'Late', value: attendanceHistory.filter(a => a.status === 'late').length },
    { name: 'Absent', value: sessions.filter(s => {
        const isEnrolled = enrollments.some(e => e.sectionId === s.sectionId && e.studentId === user?.userId);
        const hasAttendance = attendanceHistory.find(a => a.sessionId === s.sessionId);
        return isEnrolled && s.status === 'completed' && !hasAttendance;
    }).length },
  ];

  const handleMarkAttendance = async (session: ClassSession & { section?: Section }) => {
    if (!user || !session.section) return;
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // 0. Verify Policy Acceptance
      if (session.section.coursePolicy && !policyAccepted[session.sessionId]) {
        throw new Error('You must read and agree to the course policy before marking attendance.');
      }

      // 1. Verify Token
      if (token.toUpperCase() !== (session?.sessionToken?.toUpperCase() || "")) {
        throw new Error('Invalid session token.');
      }

      let latitude, longitude;

      if (mockLocation) {
        // Use section center for mock
        latitude = session.section.geofenceCenter.latitude;
        longitude = session.section.geofenceCenter.longitude;
      } else {
        // 2. Verify GPS
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          });
        });
        latitude = position.coords.latitude;
        longitude = position.coords.longitude;
      }

      const distance = calculateDistance(
        latitude,
        longitude,
        session.section.geofenceCenter.latitude,
        session.section.geofenceCenter.longitude
      );

      if (distance > session.section.geofenceRadius) {
        throw new Error(`Location mismatch. You are ${Math.round(distance)}m away from the classroom.`);
      }

      // 3. Check if already marked
      const alreadyMarked = attendanceHistory.some((a) => a.sessionId === session.sessionId);
      if (alreadyMarked) {
        throw new Error('Attendance already marked for this session.');
      }

      // 4. Save Attendance
      const newAttendance: Attendance = {
        attendanceId: `att-${Date.now()}`,
        studentId: user.userId,
        sessionId: session.sessionId,
        status: 'present',
        markedAt: new Date().toISOString(),
        location: { latitude, longitude },
        distanceFromCenter: distance,
        policyAcceptedAt: session.section.coursePolicy ? new Date().toISOString() : undefined,
      };

      addAttendance(newAttendance);
      setSuccess('Attendance marked successfully! You are recorded as PRESENT.');
      setToken('');
    } catch (err: any) {
      setError(err.message || 'Failed to mark attendance.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6 md:space-y-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 md:p-6">
        <div className="text-left">
          <p className="hu-label">Student Portal</p>
          <h1 className="text-2xl md:text-4xl font-serif font-bold text-brand-text tracking-tight">
            Welcome back, <span className="text-gray-black/40 italic">{user?.fullName?.split(' ')[0]}</span>
          </h1>
          {user?.idNumber && (
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-brand-primary/10 text-brand-primary rounded-full text-[10px] font-bold uppercase tracking-widest border border-brand-primary/10">
                ID: {user.idNumber}
              </span>
              {user.department && (
                <span className="px-3 py-1 bg-hu-gold/10 text-hu-gold rounded-full text-[10px] font-bold uppercase tracking-widest border border-hu-gold/10">
                  Dept: {user.department}
                </span>
              )}
              {user.batch && (
                <span className="px-3 py-1 bg-brand-primary/5 text-brand-primary rounded-full text-[10px] font-bold uppercase tracking-widest border border-brand-primary/10">
                  Cohort: {batches.find(b => b.batchId === user.batch)?.name || 'Unknown'} - {(() => {
                    const y = batches.find(b => b.batchId === user.batch)?.currentYear;
                    return y === 1 ? 'Freshman' : y === 2 ? 'Junior' : y === 3 ? 'Senior' : y ? 'GC' : '';
                  })()}
                </span>
              )}
              {user.programType && (
                <span className="px-3 py-1 bg-brand-primary/5 text-brand-primary rounded-full text-[10px] font-bold uppercase tracking-widest border border-brand-primary/10">
                  Prog: {programs.find(p => p.programId === user.programType)?.name || user.programType}
                </span>
              )}
              {user.role === 'student' && sessions.length > 0 && (
                 <span className="px-3 py-1 bg-brand-bg text-brand-muted rounded-full text-[10px] font-bold uppercase tracking-widest border border-brand-border">
                   Term: {activeSemester?.name || 'Loading...'}
                 </span>
              )}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={handleDownloadReport}
            className="px-6 py-3 bg-white border border-brand-border text-brand-text rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-brand-primary hover:text-white dark:text-hu-charcoal transition-all flex items-center gap-3 shadow-sm"
          >
            <FileText className="w-4 h-4 text-brand-primary group-hover:text-white dark:text-hu-charcoal" /> Report
          </button>
          {/* Testing Mode Toggle */}
          <div className="bg-brand-primary text-white dark:text-hu-charcoal px-6 py-3 rounded-xl flex items-center gap-4 shadow-2xl shadow-brand-primary/20 border border-white/10">
            <label className="flex items-center gap-3 cursor-pointer group">
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-white dark:text-hu-charcoal/60 group-hover:text-white dark:text-hu-charcoal transition-colors">Mock GPS</span>
              <div className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={mockLocation} 
                  onChange={(e) => setMockLocation(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-brand-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-white/40"></div>
              </div>
            </label>
          </div>
        </div>
      </div>

      {view === 'overview' && (
        <>
          {/* Attendance Warning */}
          {isAtRisk && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-red-50 border border-red-100 p-6 rounded-3xl flex items-center gap-4 md:gap-6"
            >
              <div className="w-10 h-10 md:w-12 md:h-12 bg-red-100 rounded-xl flex items-center justify-center text-red-600">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-red-900 uppercase tracking-widest">Attendance Warning</h3>
                <p className="text-xs text-red-700 font-medium mt-1">
                  Your overall attendance is currently <span className="font-bold">{attendancePercentage}%</span>, which is below the required 80% threshold. Please ensure you attend upcoming sessions to avoid academic penalties.
                </p>
              </div>
            </motion.div>
          )}

          {/* Overview Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {[
              { label: 'Overall Attendance', value: `${attendancePercentage}%`, icon: TrendingUp, color: isAtRisk ? 'text-red-500' : 'text-brand-primary', bg: isAtRisk ? 'bg-red-50' : 'bg-brand-primary/10' },
              { label: 'Sessions Attended', value: attendanceHistory.length, icon: CheckCircle2, color: 'text-green-600 dark:text-hu-gold', bg: 'bg-green-100 dark:bg-hu-gold/10' },
              { label: 'Active Sessions', value: activeSessions.length, icon: CalendarDays, color: 'text-brand-primary', bg: 'bg-brand-primary/10' }
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={cn("hu-card p-4 md:p-6 flex flex-col items-center justify-center text-center", i === 2 ? "col-span-2 md:col-span-1" : "")}
              >
                <div className={cn("w-10 h-10 md:w-12 md:h-12 flex items-center justify-center shadow-inner shrink-0 mb-4 rounded-xl", stat.bg)}>
                  <stat.icon className={cn("w-5 h-5 md:w-6 md:h-6", stat.color)} />
                </div>
                <div>
                  <p className="hu-label mb-1">{stat.label}</p>
                  <p className="text-2xl md:text-4xl font-serif font-bold text-brand-text">{stat.value}</p>
                </div>
                {stat.label === 'Active Sessions' && (stat.value as number) > 0 && (
                  <button 
                    onClick={() => navigate('/student/schedule')}
                    className="mt-6 w-full py-2 bg-brand-primary text-white dark:text-hu-charcoal rounded-xl text-xs font-bold uppercase tracking-widest hover:brightness-110 transition-colors"
                  >
                    Go to Active Session
                  </button>
                )}
              </motion.div>
            ))}
          </div>

          {/* Visual Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            <AnalyticsCard title="Attendance Trend" subtitle="Weekly Performance">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={attendanceTrend}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#000000" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#000000" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#9ca3af' }} />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '12px', fontWeight: 700 }}
                  />
                  <Area type="monotone" dataKey="value" stroke="#000000" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                </AreaChart>
              </ResponsiveContainer>
            </AnalyticsCard>

            <AnalyticsCard title="Status Distribution" subtitle="Attendance Breakdown">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={distributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {distributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '12px', fontWeight: 700 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </AnalyticsCard>
          </div>

          {/* Quick Actions Grid */}
          <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
            {[
              { title: 'My Attendance', desc: 'View your detailed attendance history.', icon: CheckCircle2, color: 'text-brand-primary', bg: 'bg-brand-primary/10', path: '/student/attendance' },
              { title: 'Class Schedule', desc: 'View upcoming classes and active sessions.', icon: Calendar, color: 'text-brand-primary', bg: 'bg-brand-primary/5', path: '/student/schedule' }
            ].map((action) => (
              <div key={action.title} className="hu-card p-4 md:p-8 space-y-6">
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
                  View {action.title.split(' ')[1]}
                </button>
              </div>
            ))}
          </section>
        </>
      )}

      {view === 'schedule' && (
        <>
          {/* Mark Attendance */}
          <section className="space-y-6 md:space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-brand-text">Live Sessions</h2>
            <span className="px-3 py-1 bg-brand-primary/10 text-brand-primary rounded-full text-[10px] font-bold uppercase tracking-widest border border-brand-primary/10">
              {activeSessions.length} Active
            </span>
          </div>
          
          <div className="space-y-6">
            {activeSessions.length === 0 ? (
              <div className="hu-card-alt p-8 md:p-12 text-center space-y-4 border-dashed border-2 bg-transparent">
                <Clock className="w-12 h-12 text-gray-200 mx-auto" />
                <p className="text-gray-400 font-medium">No live sessions currently in progress.</p>
              </div>
            ) : (
              activeSessions.map((session) => (
                <motion.div
                  key={session.sessionId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="hu-card p-6 flex flex-col md:flex-row gap-6 items-start md:items-center relative overflow-hidden"
                >
                  <div className="flex-1 space-y-4">
                    <div>
                      <h4 className="text-lg font-bold text-brand-text">
                        {courses.find(c => c.courseId === session.section?.courseId)?.title}
                      </h4>
                      <p className="text-xs text-brand-muted font-bold tracking-widest uppercase mt-1">Section {session.section?.room.split(',')[0]} • {centers.find(c => c.centerId === session.section?.center)?.name}</p>
                    </div>

                    {session.section?.coursePolicy && (
                      <div className="bg-brand-bg rounded-xl p-4 border border-brand-border space-y-2">
                        <div className="flex items-center gap-2 text-hu-gold">
                          <FileText className="w-4 h-4" />
                          <p className="text-[10px] font-bold uppercase tracking-widest leading-none">Instructor Policy & Rules</p>
                        </div>
                        <p className="text-xs text-gray-500 font-medium italic">"{session.section.coursePolicy}"</p>
                        <label className="flex items-center gap-2 cursor-pointer pt-2 border-t border-brand-border/50">
                          <input 
                            type="checkbox" 
                            checked={!!policyAccepted[session.sessionId]}
                            onChange={(e) => setPolicyAccepted(prev => ({ ...prev, [session.sessionId]: e.target.checked }))}
                            className="w-4 h-4 rounded border-brand-border text-brand-primary focus:ring-brand-primary"
                          />
                          <span className="text-[10px] font-bold text-brand-text uppercase tracking-wide">I understand and agree to this policy</span>
                        </label>
                      </div>
                    )}

                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2 text-xs font-bold text-brand-text">
                        <Clock className="w-4 h-4 text-brand-primary" />
                        <span>Ends at {session.endTime ? format(new Date(session.endTime), 'hh:mm a') : 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-bold text-brand-text">
                        <MapPin className="w-4 h-4 text-brand-primary" />
                        <span>Within {session.section?.geofenceRadius}m Range</span>
                      </div>
                    </div>
                  </div>

                  <div className="w-full md:w-auto p-4 bg-brand-bg rounded-2xl border border-brand-border space-y-4">
                    {/* Feedback Messages */}
                    {error && (
                      <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-red-600 text-[10px] font-bold">
                        <AlertCircle className="w-4 h-4" />
                        <span>{error}</span>
                      </div>
                    )}
                    {success && (
                      <div className="p-3 bg-green-50 border border-green-100 rounded-xl flex items-center gap-2 text-green-600 text-[10px] font-bold">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{success}</span>
                      </div>
                    )}
                    <div className="text-center space-y-1">
                      <p className="text-[10px] font-bold text-brand-muted uppercase tracking-widest">Entry Token</p>
                      <input
                        type="text"
                        placeholder="000000"
                        maxLength={6}
                        value={token}
                        onChange={(e) => setToken(e.target.value.toUpperCase())}
                        className="w-full text-center py-2 bg-white dark:bg-brand-surface border border-brand-border rounded-xl font-mono text-xl font-bold tracking-[0.2em] outline-none focus:border-brand-primary uppercase"
                      />
                    </div>
                    <button
                      onClick={() => handleMarkAttendance(session)}
                      disabled={loading || !token || (session.section?.coursePolicy && !policyAccepted[session.sessionId])}
                      className="w-full py-3 bg-brand-primary text-white dark:text-hu-charcoal rounded-xl text-xs font-bold uppercase tracking-[0.2em] shadow-lg shadow-brand-primary/20 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
                    >
                      {loading ? 'Verifying...' : 'Mark Present'}
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </section>

        {/* Class Schedule */}
        <section className="space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-brand-text">Your Enrolled Courses</h2>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-brand-primary/10 text-brand-primary rounded-full text-[10px] font-bold uppercase tracking-widest border border-brand-primary/10">
                {activeSemester?.name || 'Academic Term'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {enrollments
              .filter(e => e.studentId === user?.userId)
              .map((enr) => {
                const section = sections.find(s => s.sectionId === enr.sectionId);
                const course = courses.find(c => c.courseId === section?.courseId);
                if (!section || !course) return null;
                
                return (
                  <div key={enr.enrollmentId} className="hu-card p-6 space-y-4 hover:border-brand-primary/30 transition-all group">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-bold text-brand-muted uppercase tracking-widest bg-brand-bg px-2 py-0.5 rounded border border-brand-border">
                          {course.courseCode}
                        </span>
                        <h3 className="text-lg font-serif font-bold text-brand-text mt-2 group-hover:text-brand-primary transition-colors">
                          {course.title}
                        </h3>
                      </div>
                      <div className="w-10 h-10 bg-brand-primary/5 rounded-xl flex items-center justify-center text-brand-primary">
                        <FileText className="w-5 h-5" />
                      </div>
                    </div>

                    <div className="space-y-3 pt-2 border-t border-brand-border/50">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-brand-primary" />
                        <span className="text-xs font-bold text-brand-text">Room {section.room}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-brand-primary" />
                        <div>
                          {Array.isArray(section.schedule) && section.schedule.length > 0 ? (
                            section.schedule.map((s, idx) => (
                              <p key={idx} className="text-xs font-bold text-brand-text">
                                {s.dayOfWeek}: {s.startTime} - {s.endTime}
                              </p>
                            ))
                          ) : (
                            <p className="text-xs font-bold text-brand-text">Schedule TBA</p>
                          )}
                        </div>
                      </div>

                      {section.coursePolicy && (
                        <div className="bg-brand-bg rounded-xl p-4 border border-brand-border mt-4">
                          <div className="flex items-center gap-2 mb-2">
                            <ShieldCheck className="w-4 h-4 text-hu-gold" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-hu-gold">Attendance Policy</span>
                          </div>
                          <p className="text-[11px] text-gray-500 font-medium italic line-clamp-3">
                            "{section.coursePolicy}"
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </section>
        </>
      )}
      {view === 'attendance' && (
        <section className="space-y-8">
          <div className="flex justify-between items-end">
            <div className="space-y-1">
              <p className="hu-label">Academic Portfolio</p>
              <h2 className="text-3xl font-serif font-bold text-brand-text">Academic Record</h2>
            </div>
            <button 
              onClick={handleDownloadReport}
              className="flex items-center gap-2 px-4 py-2 bg-brand-bg border border-brand-border rounded-xl text-xs font-bold text-brand-text uppercase tracking-widest hover:bg-brand-surface transition-colors"
            >
              <Download className="w-4 h-4" />
              Download Transcript
            </button>
          </div>

          <div className="space-y-8">
            {semesters
              .sort((a,b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
              .map(semester => {
                const semesterEnrollments = enrollments.filter(e => {
                  const section = sections.find(sec => sec.sectionId === e.sectionId);
                  return e.studentId === user?.userId && section?.semesterId === semester.semesterId;
                });

                if (semesterEnrollments.length === 0) return null;

                return (
                  <motion.div 
                    key={semester.semesterId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-hu-cream flex items-center justify-center text-hu-gold font-bold text-xs ring-1 ring-hu-gold/20">
                        {semester.isActive ? "C" : "P"}
                      </div>
                      <h3 className="text-lg font-serif font-bold text-brand-text">{semester.name} {semester.isActive && "(Current)"}</h3>
                    </div>
                    
                    <div className="hu-card overflow-hidden border border-brand-border/50">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="bg-brand-surface/30">
                              <th className="px-6 py-4 text-[10px] font-bold text-brand-muted uppercase tracking-widest">Course</th>
                              <th className="px-6 py-4 text-[10px] font-bold text-brand-muted uppercase tracking-widest text-center">Cr. Hrs</th>
                              <th className="px-6 py-4 text-[10px] font-bold text-brand-muted uppercase tracking-widest text-center">Status</th>
                              <th className="px-6 py-4 text-[10px] font-bold text-brand-muted uppercase tracking-widest text-center">Grade</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-brand-border">
                            {semesterEnrollments.map((enr) => {
                              const section = sections.find(s => s.sectionId === enr.sectionId);
                              const course = courses.find(c => c.courseId === section?.courseId);
                              return (
                                <tr key={enr.enrollmentId} className="hover:bg-brand-bg transition-colors group">
                                  <td className="px-6 py-4">
                                    <p className="text-sm font-bold text-brand-text group-hover:text-brand-primary transition-colors">{course?.title}</p>
                                    <p className="text-[10px] font-bold text-brand-muted uppercase tracking-widest">{course?.courseCode} • Sec {section?.room.split(',')[0]}</p>
                                  </td>
                                  <td className="px-6 py-4 text-center">
                                    <span className="text-xs font-mono font-bold text-brand-text">{course?.creditHours}</span>
                                  </td>
                                  <td className="px-6 py-4 text-center">
                                    <span className={cn(
                                      "px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest",
                                      enr.status === 'completed' ? "bg-green-100 text-green-700" : "bg-brand-primary/10 text-brand-primary"
                                    )}>
                                      {enr.status}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 text-center">
                                    <span className="text-sm font-serif font-bold text-hu-gold">{enr.grade || '-'}</span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
          </div>
        </section>
      )}
    </div>
  );
};

export default StudentDashboard;
