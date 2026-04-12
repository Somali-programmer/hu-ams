import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { Attendance, User, ClassSession } from './types';
import { motion } from 'motion/react';
import { ShieldCheck, TrendingUp, AlertCircle, CheckCircle2, Search, Filter, Download, BarChart3, History, ClipboardCheck, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from './lib/utils';
import { MOCK_ATTENDANCE, MOCK_USER, MOCK_SESSIONS } from './mockData';
import AnalyticsCard from './components/AnalyticsCard';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from 'recharts';

import { useNavigate } from 'react-router-dom';

interface QAOfficerDashboardProps {
  view?: 'overview' | 'audit' | 'corrections' | 'reports';
}

const QAOfficerDashboard: React.FC<QAOfficerDashboardProps> = ({ view = 'overview' }) => {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [sessions, setSessions] = useState<ClassSession[]>([]);

  useEffect(() => {
    // Load mock data
    setAttendance(MOCK_ATTENDANCE);
    setUsers([MOCK_USER]);
    setSessions(MOCK_SESSIONS);
  }, []);

  const handleApproveCorrection = (id: string) => {
    alert(`Correction request ${id} approved. (Mock Action)`);
  };

  const handleDownloadAudit = (type: string) => {
    alert(`Downloading ${type} audit report... (Mock Download)`);
  };

  const studentsAtRisk = users.filter(u => {
    if (u.role !== 'student') return false;
    const studentAttendance = attendance.filter(a => a.studentId === u.userId);
    const totalSessions = sessions.length;
    if (totalSessions === 0) return false;
    const percentage = (studentAttendance.length / totalSessions) * 100;
    return percentage < 80;
  });

  // Mock data for charts
  const complianceTrend = [
    { name: 'Week 1', value: 88 },
    { name: 'Week 2', value: 92 },
    { name: 'Week 3', value: 90 },
    { name: 'Week 4', value: 94 },
  ];

  const riskDistribution = [
    { name: 'Low Risk', value: 85 },
    { name: 'Medium Risk', value: 10 },
    { name: 'High Risk', value: 5 },
  ];

  const COLORS = ['#10B981', '#F59E0B', '#EF4444'];

  return (
    <div className="max-w-7xl mx-auto space-y-8 md:space-y-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-4 md:gap-8">
        <div className="text-left">
          <p className="hu-label">Quality Assurance Portal</p>
          <h1 className="text-3xl md:text-5xl font-serif font-bold text-black tracking-tight">
            Compliance <span className="text-gray-black/40 italic">Audit</span>
          </h1>
          <p className="text-gray-400 font-medium mt-2">Monitor academic integrity and attendance trends.</p>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          {/* Removed internal tab buttons */}
        </div>
      </div>

      {view === 'overview' && (
        <>
          {/* Audit Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8">
            {[
              { label: 'Compliance Rate', value: '94.2%', icon: ShieldCheck, color: 'text-hu-green', bg: 'bg-hu-green/10' },
              { label: 'Students At Risk', value: studentsAtRisk.length, icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50' },
              { label: 'Total Audit Logs', value: attendance.length, icon: BarChart3, color: 'text-hu-green', bg: 'bg-hu-green/10' }
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="hu-card-alt p-5 md:p-8 border-none"
              >
                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-inner", stat.bg, stat.color)}>
                  <stat.icon className="w-7 h-7" />
                </div>
                <p className="hu-label mb-1">{stat.label}</p>
                <p className="text-2xl md:text-3xl font-serif font-bold text-black">{stat.value}</p>
              </motion.div>
            ))}
          </div>

          {/* Visual Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
            <AnalyticsCard title="Compliance Trend" subtitle="Monthly Performance">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={complianceTrend}>
                  <defs>
                    <linearGradient id="colorCompliance" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#000000" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#000000" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#9ca3af' }} />
                  <YAxis hide domain={[80, 100]} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '12px', fontWeight: 700 }}
                  />
                  <Area type="monotone" dataKey="value" stroke="#000000" strokeWidth={3} fillOpacity={1} fill="url(#colorCompliance)" />
                </AreaChart>
              </ResponsiveContainer>
            </AnalyticsCard>

            <AnalyticsCard title="Risk Distribution" subtitle="Student Population">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={riskDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {riskDistribution.map((entry, index) => (
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
          <section className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8">
            {[
              { title: 'Audit Logs', desc: 'Review system compliance and attendance logs.', icon: ShieldCheck, color: 'text-blue-500', bg: 'bg-blue-50', path: '/qa/audit' },
              { title: 'Corrections', desc: 'Review and approve attendance correction requests.', icon: ClipboardCheck, color: 'text-purple-500', bg: 'bg-purple-50', path: '/qa/corrections' },
              { title: 'Reports', desc: 'Generate verification and compliance reports.', icon: BarChart3, color: 'text-green-500', bg: 'bg-green-50', path: '/qa/reports' }
            ].map((action) => (
              <div key={action.title} className="hu-card-alt p-6 md:p-10 space-y-6 border-none">
                <div className="flex items-center gap-4">
                  <div className={cn("w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center shadow-inner", action.bg, action.color)}>
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

      {view === 'audit' && (
        <>
          <section className="space-y-6 md:space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h2 className="text-2xl md:text-3xl font-serif font-bold text-black">Attendance Compliance Audit</h2>
              <div className="flex items-center gap-4 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                  <input
                    type="text"
                    placeholder="Filter by course..."
                    className="w-full pl-12 pr-6 py-3 bg-hu-cream/30 border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-hu-green/20 outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="hu-card-alt overflow-hidden border-none">
              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[800px]">
                  <thead>
                    <tr className="bg-hu-cream/20">
                      <th className="px-4 py-4 md:px-8 md:py-6 text-[11px] uppercase tracking-[0.2em] font-bold text-gray-black/70 whitespace-nowrap">Course</th>
                      <th className="px-4 py-4 md:px-8 md:py-6 text-[11px] uppercase tracking-[0.2em] font-bold text-gray-black/70 whitespace-nowrap">Instructor</th>
                      <th className="px-8 py-6 text-[11px] uppercase tracking-[0.2em] font-bold text-gray-black/70 whitespace-nowrap">Avg. Attendance</th>
                      <th className="px-8 py-6 text-[11px] uppercase tracking-[0.2em] font-bold text-gray-black/70 whitespace-nowrap">Status</th>
                      <th className="px-8 py-6 text-[11px] uppercase tracking-[0.2em] font-bold text-gray-black/70 whitespace-nowrap">Last Audit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    <tr className="hover:bg-hu-cream/10 transition-colors group">
                      <td className="px-8 py-6 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-black">Database Systems</span>
                          <span className="text-[10px] font-bold text-gray-black/40 uppercase tracking-widest">CS-301</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-sm font-medium text-gray-400 whitespace-nowrap">Dr. Alemu Gudata</td>
                      <td className="px-8 py-6 text-sm font-bold text-black whitespace-nowrap">92%</td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <span className="px-4 py-1.5 bg-hu-green/10 text-hu-green rounded-full text-[10px] font-bold uppercase tracking-widest border border-hu-green/20">
                          Compliant
                        </span>
                      </td>
                      <td className="px-8 py-6 text-sm text-gray-400 whitespace-nowrap">Today, 10:30 AM</td>
                    </tr>
                    <tr className="hover:bg-hu-cream/10 transition-colors group">
                      <td className="px-8 py-6 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-black">Web Development</span>
                          <span className="text-[10px] font-bold text-gray-black/40 uppercase tracking-widest">CS-305</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-sm font-medium text-gray-400 whitespace-nowrap">Mr. Dahir Bashir</td>
                      <td className="px-8 py-6 text-sm font-bold text-yellow-600 whitespace-nowrap">78%</td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <span className="px-4 py-1.5 bg-yellow-50 text-yellow-600 rounded-full text-[10px] font-bold uppercase tracking-widest border border-yellow-100">
                          Warning
                        </span>
                      </td>
                      <td className="px-8 py-6 text-sm text-gray-400 whitespace-nowrap">Yesterday, 02:15 PM</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Risk Alerts */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900 text-red-600 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" /> High-Risk Student Alerts
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {studentsAtRisk.map(student => (
                <div key={student.userId} className="bg-white p-6 rounded-3xl shadow-sm border border-red-100 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-gray-900">{student.fullName}</h3>
                      <p className="text-xs text-gray-500">{student.email}</p>
                    </div>
                    <span className="px-2 py-1 bg-red-100 text-red-700 rounded-lg text-[10px] font-black uppercase">Critical</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-gray-50">
                    <span className="text-sm text-gray-500 font-medium">Attendance Rate</span>
                    <span className="text-lg font-black text-red-600">64%</span>
                  </div>
                  <button className="w-full py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-xs font-bold transition-all">
                    Notify Advisor
                  </button>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      {view === 'corrections' && (
        <section className="space-y-8">
          <div className="flex items-center gap-4">
            <ClipboardCheck className="w-6 h-6 text-hu-green" />
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-black">Attendance Correction Requests</h2>
          </div>
          <div className="hu-card-alt overflow-hidden border-none">
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[800px]">
                <thead>
                  <tr className="bg-hu-cream/20">
                    <th className="px-4 py-4 md:px-8 md:py-6 text-[11px] uppercase tracking-[0.2em] font-bold text-gray-black/70 whitespace-nowrap">Student</th>
                  <th className="px-8 py-6 text-[11px] uppercase tracking-[0.2em] font-bold text-gray-black/70 whitespace-nowrap">Course & Date</th>
                  <th className="px-8 py-6 text-[11px] uppercase tracking-[0.2em] font-bold text-gray-black/70 whitespace-nowrap">Reason</th>
                  <th className="px-8 py-6 text-[11px] uppercase tracking-[0.2em] font-bold text-gray-black/70 whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {[
                  { id: '1', name: 'Mustafe Kadar', course: 'CS-301', date: '2026-04-05', reason: 'Medical Appointment' },
                  { id: '2', name: 'Dahir Bashir', course: 'CS-305', date: '2026-04-06', reason: 'Technical Issue' }
                ].map((req) => (
                  <tr key={req.id} className="hover:bg-hu-cream/10 transition-colors">
                    <td className="px-8 py-6 whitespace-nowrap">
                      <p className="text-sm font-bold text-black">{req.name}</p>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                      <p className="text-sm font-medium text-black">{req.course}</p>
                      <p className="text-[10px] text-gray-400 font-mono">{req.date}</p>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <MessageSquare className="w-3 h-3" />
                        {req.reason}
                      </div>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                      <div className="flex gap-4">
                        <button 
                          onClick={() => handleApproveCorrection(req.id)}
                          className="text-[10px] font-bold text-green-600 hover:underline uppercase tracking-widest"
                        >
                          Approve
                        </button>
                        <button className="text-[10px] font-bold text-red-600 hover:underline uppercase tracking-widest">Reject</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        </section>
      )}

      {view === 'reports' && (
        <section className="space-y-8">
          <div className="flex items-center gap-4">
            <BarChart3 className="w-6 h-6 text-hu-green" />
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-black">Verification Reports</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: 'Monthly Compliance', desc: 'Summary of all departmental compliance rates.', icon: ShieldCheck },
              { title: 'Instructor Integrity', desc: 'Audit logs of session creation and geofence usage.', icon: History },
              { title: 'Risk Analytics', desc: 'Deep dive into student absenteeism trends.', icon: TrendingUp }
            ].map((report) => (
              <div key={report.title} className="hu-card-alt p-5 md:p-5 md:p-8 space-y-6">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-hu-cream rounded-2xl flex items-center justify-center text-hu-green">
                  <report.icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-black">{report.title}</h3>
                  <p className="text-xs text-gray-400 mt-1">{report.desc}</p>
                </div>
                <button 
                  onClick={() => handleDownloadAudit(report.title)}
                  className="w-full py-3 bg-hu-green text-white rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-hu-gold transition-all"
                >
                  Download Report
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default QAOfficerDashboard;
