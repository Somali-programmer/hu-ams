import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { ClassSession, Attendance, Section } from './types';
import { calculateDistance, cn } from './lib/utils';
import { motion } from 'motion/react';
import { MapPin, Clock, CheckCircle2, AlertCircle, TrendingUp, CalendarDays, Download, Calendar, FileText } from 'lucide-react';
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
  const { sessions, attendance, sections, enrollments, semesters, addAttendance } = useAppData();
  const [activeSessions, setActiveSessions] = useState<(ClassSession & { section?: Section })[]>([]);
  const [attendanceHistory, setAttendanceHistory] = useState<Attendance[]>([]);
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
    alert('Generating your personal attendance report... (Mock Download)');
  };

  const attendancePercentage = attendanceHistory.length > 0 
    ? Math.round((attendanceHistory.filter(a => a.status === 'present').length / (activeSessions.length + attendanceHistory.length)) * 100)
    : 0;

  const isAtRisk = attendancePercentage < 80 && attendanceHistory.length > 0;

  // Mock data for charts
  const attendanceTrend = [
    { name: 'Mon', value: 100 },
    { name: 'Tue', value: 80 },
    { name: 'Wed', value: 90 },
    { name: 'Thu', value: 100 },
    { name: 'Fri', value: 70 },
  ];

  const distributionData = [
    { name: 'Present', value: attendanceHistory.filter(a => a.status === 'present').length },
    { name: 'Late', value: attendanceHistory.filter(a => a.status === 'late').length },
    { name: 'Absent', value: 2 }, // Mocked
  ];

  const COLORS = ['#000000', '#D4AF37', '#F3F4F6'];

  const handleMarkAttendance = async (session: ClassSession & { section?: Section }) => {
    if (!user || !session.section) return;
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // 1. Verify Token
      if (token.toUpperCase() !== session.sessionToken.toUpperCase()) {
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
    <div className="max-w-7xl mx-auto space-y-8 md:space-y-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 md:p-6">
        <div className="text-left">
          <p className="hu-label">Student Portal</p>
          <h1 className="text-3xl md:text-5xl font-serif font-bold text-black tracking-tight">
            Welcome back, <span className="text-gray-black/40 italic">{user?.fullName?.split(' ')[0]}</span>
          </h1>
          {user?.idNumber && (
            <div className="mt-2 flex items-center gap-2">
              <span className="px-3 py-1 bg-hu-green/10 text-hu-green rounded-full text-[10px] font-bold uppercase tracking-widest border border-hu-green/10">
                ID: {user.idNumber}
              </span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={handleDownloadReport}
            className="px-6 py-3 bg-white border border-gray-100 text-black rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:bg-hu-green hover:text-white transition-all flex items-center gap-3 shadow-sm"
          >
            <FileText className="w-4 h-4 text-hu-green group-hover:text-white" /> Report
          </button>
          {/* Testing Mode Toggle */}
          <div className="bg-hu-green text-white px-6 py-3 rounded-2xl flex items-center gap-4 shadow-2xl shadow-hu-green/10 border border-white/10">
            <label className="flex items-center gap-3 cursor-pointer group">
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/60 group-hover:text-white transition-colors">Mock GPS</span>
              <div className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={mockLocation} 
                  onChange={(e) => setMockLocation(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-white/40"></div>
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
              <div className="w-10 h-10 md:w-12 md:h-12 bg-red-100 rounded-2xl flex items-center justify-center text-red-600">
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
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8">
            {[
              { label: 'Overall Attendance', value: `${attendancePercentage}%`, icon: TrendingUp, color: isAtRisk ? 'text-red-500' : 'text-hu-green', bg: isAtRisk ? 'bg-red-50' : 'bg-hu-green/10' },
              { label: 'Sessions Attended', value: attendanceHistory.length, icon: CheckCircle2, color: 'text-hu-charcoal', bg: 'bg-gray-50' },
              { label: 'Active Sessions', value: activeSessions.length, icon: CalendarDays, color: 'text-hu-green', bg: 'bg-hu-green/10' }
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="hu-card p-5 md:p-8 flex items-center gap-6"
              >
                <div className={cn("w-10 h-10 md:w-12 md:h-12 md:w-16 md:h-16 rounded-3xl flex items-center justify-center shadow-inner", stat.bg)}>
                  <stat.icon className={cn("w-6 h-6 md:w-8 md:h-8", stat.color)} />
                </div>
                <div>
                  <p className="hu-label mb-1">{stat.label}</p>
                  <p className="text-2xl md:text-4xl font-serif font-bold text-hu-charcoal">{stat.value}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Visual Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
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
          <section className="grid grid-cols-2 md:grid-cols-2 gap-4 md:gap-8">
            {[
              { title: 'My Attendance', desc: 'View your detailed attendance history.', icon: CheckCircle2, color: 'text-hu-blue', bg: 'bg-hu-blue/5', path: '/student/attendance' },
              { title: 'Class Schedule', desc: 'View upcoming classes and active sessions.', icon: Calendar, color: 'text-hu-green', bg: 'bg-hu-green/5', path: '/student/schedule' }
            ].map((action) => (
              <div key={action.title} className="hu-card p-6 md:p-10 space-y-6 border-none">
                <div className="flex items-center gap-4">
                  <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner", action.bg, action.color)}>
                    <action.icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-serif font-bold text-xl md:text-2xl text-hu-charcoal">{action.title}</h3>
                </div>
                <p className="text-sm text-gray-400 font-medium leading-relaxed">{action.desc}</p>
                <button 
                  onClick={() => navigate(action.path)}
                  className="w-full py-4 bg-hu-green/10 hover:bg-hu-green hover:text-white text-hu-green rounded-2xl font-bold text-[10px] uppercase tracking-[0.2em] transition-all duration-300"
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
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-black">Live Sessions</h2>
            <span className="px-3 py-1 bg-hu-green/10 text-hu-green rounded-full text-[10px] font-bold uppercase tracking-widest border border-hu-green/10">
              {activeSessions.length} Active
            </span>
          </div>
          
          <div className="space-y-6">
            {activeSessions.length === 0 ? (
              <div className="hu-card-alt p-8 md:p-12 text-center space-y-4 border-dashed border-2 border-gray-100 bg-transparent">
                <Clock className="w-12 h-12 text-gray-200 mx-auto" />
                <p className="text-gray-400 font-medium">No live sessions currently in progress.</p>
              </div>
            ) : (
              activeSessions.map((session) => (
                <motion.div 
                  key={session.sessionId}
                  className="hu-card-alt p-5 md:p-8 space-y-8"
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <h3 className="text-lg md:text-xl font-serif font-bold text-black">{session.section?.courseId}</h3>
                      <p className="text-sm text-gray-400 font-medium">Section {session.section?.sectionId}</p>
                    </div>
                    <div className="flex items-center gap-2 text-hu-green">
                      <MapPin className="w-4 h-4" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">In Geofence</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Session Code</label>
                    <div className="flex gap-4">
                      <input 
                        type="text" 
                        maxLength={6}
                        value={token}
                        onChange={(e) => setToken(e.target.value.toUpperCase())}
                        placeholder="ENTER CODE"
                        className="flex-1 bg-hu-cream/30 border-none rounded-2xl px-6 py-4 text-lg font-mono font-bold tracking-[0.5em] focus:ring-2 focus:ring-hu-gold/20 outline-none transition-all placeholder:tracking-normal placeholder:text-xs placeholder:font-sans"
                      />
                      <button 
                        onClick={() => handleMarkAttendance(session)}
                        disabled={loading || !token}
                        className="hu-button-rounded px-8 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? '...' : 'Mark Presence'}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="p-4 bg-red-50 text-red-600 rounded-xl text-xs font-bold flex items-center gap-3">
                      <AlertCircle className="w-4 h-4" /> {error}
                    </div>
                  )}
                  {success && (
                    <div className="p-4 bg-hu-green/10 text-hu-green rounded-xl text-xs font-bold flex items-center gap-3">
                      <CheckCircle2 className="w-4 h-4" /> {success}
                    </div>
                  )}
                </motion.div>
              ))
            )}
          </div>
        </section>

        {/* Class Schedule */}
        <section className="space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-black">Class Schedule</h2>
            <button className="text-[10px] font-bold uppercase tracking-widest text-hu-green">Full Calendar</button>
          </div>

          <div className="hu-card-alt p-0 overflow-hidden border-none">
            <div className="divide-y divide-gray-50">
              {[
                { day: 'Monday', time: '08:30 AM - 10:30 AM', course: 'Distributed Systems', code: 'CoSc4038', room: 'Lab 04' },
                { day: 'Tuesday', time: '10:45 AM - 12:45 PM', course: 'Network Admin', code: 'CoSc4036', room: 'Room 201' },
                { day: 'Wednesday', time: '02:00 PM - 04:00 PM', course: 'Software Engineering II', code: 'CoSc4032', room: 'Lab 02' },
                { day: 'Thursday', time: '08:30 AM - 10:30 AM', course: 'Database Systems', code: 'CoSc301', room: 'Room 105' }
              ].map((item, i) => (
                <div key={i} className="p-6 flex items-center justify-between hover:bg-hu-cream/10 transition-colors">
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 bg-hu-cream rounded-2xl flex flex-col items-center justify-center text-hu-green">
                      <span className="text-[8px] font-bold uppercase">{item.day.substring(0, 3)}</span>
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-black">{item.course}</h4>
                      <p className="text-[10px] font-medium text-gray-400">{item.time} • {item.room}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-gray-black/40 font-mono">{item.code}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
        </>
      )}
      {view === 'attendance' && (
        <section className="space-y-6 md:space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-black">Attendance History</h2>
            <button className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-hu-green hover:text-black transition-colors">View All Records</button>
          </div>
          
          <div className="hu-card-alt overflow-hidden border-none">
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[600px]">
                <thead>
                  <tr className="bg-hu-cream/30">
                    <th className="px-4 py-4 md:px-8 md:py-6 text-[11px] uppercase tracking-[0.2em] font-bold text-gray-black/70 whitespace-nowrap">Date</th>
                    <th className="px-4 py-4 md:px-8 md:py-6 text-[11px] uppercase tracking-[0.2em] font-bold text-gray-black/70 whitespace-nowrap">Course</th>
                    <th className="px-8 py-6 text-[11px] uppercase tracking-[0.2em] font-bold text-gray-black/70 whitespace-nowrap">Status</th>
                    <th className="px-8 py-6 text-[11px] uppercase tracking-[0.2em] font-bold text-gray-black/70 whitespace-nowrap">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {attendanceHistory.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-8 py-20 text-center whitespace-nowrap">
                        <div className="max-w-xs mx-auto space-y-4">
                          <div className="w-12 h-12 md:w-16 md:h-16 bg-hu-cream rounded-full flex items-center justify-center mx-auto text-hu-gold">
                            <AlertCircle className="w-8 h-8" />
                          </div>
                          <p className="text-gray-400 font-medium">No attendance records found in the localized archive.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    attendanceHistory.map((record, i) => (
                      <motion.tr 
                        key={record.attendanceId}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="hover:bg-hu-cream/20 transition-colors group"
                      >
                        <td className="px-8 py-6 whitespace-nowrap">
                          <p className="text-sm font-bold text-black">
                            {format(new Date(record.markedAt), 'MMM dd, yyyy')}
                          </p>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-black">Database Systems</span>
                            <span className="text-[10px] font-bold text-gray-black/40 uppercase tracking-widest">CS-301</span>
                          </div>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap">
                          <span className={cn(
                            "px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest inline-flex items-center gap-2",
                            record.status === 'present' 
                              ? "bg-hu-green/10 text-hu-green border border-hu-green/20" 
                              : "bg-red-50 text-red-600 border border-red-100"
                          )}>
                            <div className={cn("w-1.5 h-1.5 rounded-full", record.status === 'present' ? "bg-hu-green" : "bg-red-600")} />
                            {record.status}
                          </span>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap">
                          <p className="text-sm font-medium text-gray-400 group-hover:text-black transition-colors">
                            {format(new Date(record.markedAt), 'hh:mm a')}
                          </p>
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
    </div>
  );
};

export default StudentDashboard;
