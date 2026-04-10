import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { User, Course, Section, UserRole } from './types';
import { cn } from './lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Users, 
  BookOpen, 
  Settings, 
  ShieldCheck, 
  Database, 
  RefreshCw, 
  Search, 
  Filter, 
  Trash2, 
  Edit2, 
  CheckCircle2, 
  AlertCircle,
  X,
  LayoutDashboard,
  GraduationCap,
  Briefcase,
  Download,
  Calendar,
  Lock,
  FileText,
  Activity
} from 'lucide-react';
import { MOCK_USERS, MOCK_COURSES, MOCK_SECTIONS } from './mockData';
import AnalyticsCard from './components/AnalyticsCard';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, PieChart, Pie } from 'recharts';

import { useLocation, useNavigate } from 'react-router-dom';
import { useAppData } from './AppDataContext';

interface AdminDashboardProps {
  view?: 'overview' | 'staff' | 'students' | 'courses' | 'sections' | 'semesters' | 'settings';
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ view = 'overview' }) => {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const { 
    users, courses, sections, semesters, 
    addSemester, setActiveSemester, addSection,
    addUser, updateUser, deleteUser, addCourse, updateCourse, deleteCourse 
  } = useAppData();
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleBackup = () => {
    alert('System data backup initiated... (Mock Action)');
  };

  const handleDownloadDeptReport = (dept: string) => {
    alert(`Generating department-level report for ${dept}... (Mock Download)`);
  };

  // Modal States
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [editingSection, setEditingSection] = useState<Section | null>(null);

  // Form States
  const [userForm, setUserForm] = useState<Partial<User>>({
    fullName: '',
    email: '',
    role: 'student',
    department: 'Computer Science',
    idNumber: '',
    isActive: true
  });

  const [courseForm, setCourseForm] = useState<Partial<Course>>({
    courseCode: '',
    title: '',
    creditHours: 3,
    department: 'Computer Science'
  });

  const [sectionForm, setSectionForm] = useState<Partial<Section>>({
    courseId: '',
    instructorId: '',
    room: '',
    schedule: ''
  });

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      updateUser(editingUser.userId, userForm);
    } else {
      const newUser: User = {
        ...userForm,
        userId: `user-${Date.now()}`,
        createdAt: new Date().toISOString(),
        isActive: true
      } as User;
      addUser(newUser);
    }
    setIsUserModalOpen(false);
    setEditingUser(null);
    setUserForm({ fullName: '', email: '', role: 'student', department: 'Computer Science', idNumber: '', isActive: true });
  };

  const handleDeleteUser = (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      deleteUser(userId);
    }
  };

  const handleSaveCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCourse) {
      updateCourse(editingCourse.courseId, courseForm);
    } else {
      const newCourse: Course = {
        ...courseForm,
        courseId: `course-${Date.now()}`
      } as Course;
      addCourse(newCourse);
    }
    setIsCourseModalOpen(false);
    setEditingCourse(null);
    setCourseForm({ courseCode: '', title: '', creditHours: 3, department: 'Computer Science' });
  };

  const handleDeleteCourse = (courseId: string) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      deleteCourse(courseId);
    }
  };

  const handleSaveSection = (e: React.FormEvent) => {
    e.preventDefault();
    const activeSemester = semesters.find(s => s.isActive);
    if (!activeSemester) {
      alert('Please set an active semester first.');
      return;
    }

    if (editingSection) {
      updateSection(editingSection.sectionId, sectionForm);
    } else {
      const newSection: Section = {
        ...sectionForm,
        sectionId: `section-${Date.now()}`,
        semesterId: activeSemester.semesterId,
        geofenceCenter: { latitude: 0, longitude: 0 }, // Default, instructor sets this
        geofenceRadius: 50
      } as Section;
      addSection(newSection);
    }
    setIsSectionModalOpen(false);
    setEditingSection(null);
    setSectionForm({ courseId: '', instructorId: '', room: '', schedule: '' });
  };

  const handleDeleteSection = (sectionId: string) => {
    if (window.confirm('Are you sure you want to delete this section assignment?')) {
      deleteSection(sectionId);
    }
  };

  const filteredStaff = users.filter(u => 
    u.role !== 'student' && (
      u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.idNumber?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const filteredStudents = users.filter(u => 
    u.role === 'student' && (
      u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.idNumber?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const filteredCourses = courses.filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.courseCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Mock data for charts
  const userRoleData = [
    { name: 'Students', value: users.filter(u => u.role === 'student').length },
    { name: 'Instructors', value: users.filter(u => u.role === 'instructor').length },
    { name: 'Admin', value: users.filter(u => u.role === 'admin').length },
    { name: 'QA', value: users.filter(u => u.role === 'qa').length },
  ];

  const systemActivityData = [
    { name: 'Mon', value: 400 },
    { name: 'Tue', value: 300 },
    { name: 'Wed', value: 600 },
    { name: 'Thu', value: 800 },
    { name: 'Fri', value: 500 },
  ];

  const COLORS = ['#000000', '#D4AF37', '#6B7280', '#E5E7EB'];

  return (
    <div className="max-w-7xl mx-auto space-y-8 md:space-y-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-4 md:gap-8">
        <div className="text-left">
          <p className="premium-label">Administrative Portal</p>
          <h1 className="text-3xl md:text-5xl font-serif font-bold text-black tracking-tight">
            System <span className="text-gray-black/40 italic">Architecture</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          {/* Removed internal tab buttons */}
        </div>
      </div>

      {view === 'overview' && (
        <>
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-8">
            {[
              { label: 'Total Users', value: users.length, icon: Users, color: 'text-blue-500', bg: 'bg-blue-50' },
              { label: 'Active Courses', value: courses.length, icon: BookOpen, color: 'text-premium-black', bg: 'bg-premium-black/10' },
              { label: 'Total Sections', value: sections.length, icon: Database, color: 'text-premium-black', bg: 'bg-premium-black/10' },
              { label: 'System Status', value: 'Operational', icon: ShieldCheck, color: 'text-premium-black', bg: 'bg-premium-black/10' }
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="premium-card p-5 md:p-8 border-none"
              >
                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-inner", stat.bg, stat.color)}>
                  <stat.icon className="w-7 h-7" />
                </div>
                <p className="premium-label mb-1">{stat.label}</p>
                <p className={cn("text-2xl md:text-3xl font-serif font-bold", stat.label === 'System Status' ? 'text-premium-black' : 'text-black')}>
                  {stat.value}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Visual Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
            <AnalyticsCard title="User Distribution" subtitle="By Role">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={userRoleData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {userRoleData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '12px', fontWeight: 700 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </AnalyticsCard>

            <AnalyticsCard title="System Activity" subtitle="Weekly Requests">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={systemActivityData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#9ca3af' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#9ca3af' }} />
                  <Tooltip 
                    cursor={{ fill: '#f9fafb' }}
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '12px', fontWeight: 700 }}
                  />
                  <Bar dataKey="value" fill="#000000" radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </AnalyticsCard>
          </div>

          {/* Quick Actions Grid */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: 'Semesters', desc: 'Manage academic terms and active semesters.', icon: Calendar, color: 'text-orange-500', bg: 'bg-orange-50', path: '/admin/semesters' },
              { title: 'Course Catalog', desc: 'Architect the academic curriculum and course structures.', icon: BookOpen, color: 'text-blue-500', bg: 'bg-blue-50', path: '/admin/courses' },
              { title: 'Section Assignments', desc: 'Assign courses to instructors and set schedules.', icon: LayoutDashboard, color: 'text-indigo-500', bg: 'bg-indigo-50', path: '/admin/sections' },
              { title: 'Staff Management', desc: 'Manage instructors and administrative staff.', icon: Briefcase, color: 'text-purple-500', bg: 'bg-purple-50', path: '/admin/staff' },
              { title: 'Student Management', desc: 'Manage student enrollment and records.', icon: GraduationCap, color: 'text-green-500', bg: 'bg-green-50', path: '/admin/students' },
              { title: 'System Backup', desc: 'Securely archive all system data and configurations.', icon: Database, color: 'text-premium-gold', bg: 'bg-premium-cream', action: handleBackup }
            ].map((action) => (
              <div key={action.title} className="premium-card p-6 md:p-10 space-y-6 border-none">
                <div className="flex items-center gap-4">
                  <div className={cn("w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center shadow-inner", action.bg, action.color)}>
                    <action.icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-serif font-bold text-xl md:text-2xl text-black">{action.title}</h3>
                </div>
                <p className="text-sm text-gray-400 font-medium leading-relaxed">{action.desc}</p>
                <button 
                  onClick={() => action.path ? navigate(action.path) : action.action?.()}
                  className="w-full py-4 bg-premium-black/10 hover:bg-premium-black hover:text-white text-black rounded-2xl font-bold text-[10px] uppercase tracking-[0.2em] transition-all duration-300"
                >
                  {action.action ? 'Execute Backup' : `Manage ${action.title.split(' ')[0]}`}
                </button>
              </div>
            ))}
          </section>

          {/* Department Reports Section */}
          <section className="space-y-6 md:space-y-8">
            <div className="flex items-center gap-4">
              <FileText className="w-6 h-6 text-premium-black" />
              <h2 className="text-2xl md:text-3xl font-serif font-bold text-black">Departmental Reports</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {['Computer Science', 'Information Systems', 'Software Engineering', 'IT Management'].map((dept) => (
                <div key={dept} className="premium-card p-6 flex items-center justify-between group hover:bg-premium-cream/20 transition-all">
                  <div>
                    <p className="text-sm font-bold text-black">{dept}</p>
                    <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest mt-1">Attendance Summary</p>
                  </div>
                  <button 
                    onClick={() => handleDownloadDeptReport(dept)}
                    className="p-3 bg-premium-cream rounded-xl text-premium-black hover:bg-premium-black hover:text-white transition-all shadow-sm"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      {(view === 'staff' || view === 'students') && (
        <section className="space-y-6 md:space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-black">
              {view === 'staff' ? 'Staff Management' : 'Student Management'}
            </h2>
            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                <input
                  type="text"
                  placeholder={`Search ${view}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-6 py-3 bg-premium-cream/30 border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-premium-gold/20 outline-none transition-all"
                />
              </div>
              <button 
                onClick={() => {
                  setEditingUser(null);
                  setUserForm({ fullName: '', email: '', role: view === 'staff' ? 'instructor' : 'student', department: 'Computer Science', idNumber: '', isActive: true });
                  setIsUserModalOpen(true);
                }}
                className="premium-button flex items-center gap-3"
              >
                <Plus className="w-5 h-5" />
                <span className="text-xs uppercase tracking-widest">Add {view === 'staff' ? 'Staff' : 'Student'}</span>
              </button>
            </div>
          </div>

          <div className="premium-card overflow-hidden border-none">
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[800px]">
                <thead>
                  <tr className="bg-premium-cream/20">
                    <th className="px-4 py-4 md:px-8 md:py-6 text-[11px] uppercase tracking-[0.2em] font-bold text-gray-black/70 whitespace-nowrap">User</th>
                    <th className="px-4 py-4 md:px-8 md:py-6 text-[11px] uppercase tracking-[0.2em] font-bold text-gray-black/70 whitespace-nowrap">Role</th>
                    <th className="px-8 py-6 text-[11px] uppercase tracking-[0.2em] font-bold text-gray-black/70 whitespace-nowrap">Department</th>
                    <th className="px-8 py-6 text-[11px] uppercase tracking-[0.2em] font-bold text-gray-black/70 whitespace-nowrap">Status</th>
                    <th className="px-8 py-6 text-[11px] uppercase tracking-[0.2em] font-bold text-gray-black/70 whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {(view === 'staff' ? filteredStaff : filteredStudents).map((u, i) => (
                    <motion.tr 
                      key={u.userId}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="hover:bg-premium-cream/10 transition-colors group"
                    >
                      <td className="px-8 py-6 whitespace-nowrap">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-premium-black/10 rounded-xl flex items-center justify-center text-premium-black font-bold text-xs shadow-sm">
                            {u.fullName.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-black">{u.fullName}</p>
                            <div className="flex items-center gap-2">
                              <p className="text-[10px] font-medium text-gray-400">{u.email}</p>
                              {u.idNumber && (
                                <>
                                  <span className="text-gray-200">•</span>
                                  <p className="text-[10px] font-bold text-premium-black font-mono">{u.idNumber}</p>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <span className="px-4 py-1.5 bg-premium-black/10 text-black rounded-full text-[10px] font-bold uppercase tracking-widest border border-premium-black/10">
                          {u.role}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-sm font-medium text-gray-400 whitespace-nowrap">{u.department}</td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <span className="flex items-center gap-2 text-[10px] font-bold text-premium-black uppercase tracking-widest">
                          <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", u.isActive ? "bg-premium-black" : "bg-red-500")} />
                          {u.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <div className="flex items-center gap-4">
                          <button 
                            onClick={() => {
                              setEditingUser(u);
                              setUserForm(u);
                              setIsUserModalOpen(true);
                            }}
                            className="p-2 text-gray-300 hover:text-premium-gold transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteUser(u.userId)}
                            className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {view === 'courses' && (
        <section className="space-y-6 md:space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-black">Course Catalog</h2>
            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                <input
                  type="text"
                  placeholder="Search courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-6 py-3 bg-premium-cream/30 border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-premium-gold/20 outline-none transition-all"
                />
              </div>
              <button 
                onClick={() => {
                  setEditingCourse(null);
                  setCourseForm({ courseCode: '', title: '', creditHours: 3, department: 'Computer Science' });
                  setIsCourseModalOpen(true);
                }}
                className="premium-button flex items-center gap-3"
              >
                <Plus className="w-5 h-5" />
                <span className="text-xs uppercase tracking-widest">Add Course</span>
              </button>
            </div>
          </div>

          <div className="premium-card overflow-hidden border-none">
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[800px]">
                <thead>
                  <tr className="bg-premium-cream/20">
                    <th className="px-8 py-6 text-[11px] uppercase tracking-[0.2em] font-bold text-gray-black/70 whitespace-nowrap">Course Code</th>
                    <th className="px-8 py-6 text-[11px] uppercase tracking-[0.2em] font-bold text-gray-black/70 whitespace-nowrap">Title</th>
                    <th className="px-8 py-6 text-[11px] uppercase tracking-[0.2em] font-bold text-gray-black/70 whitespace-nowrap">Credit Hours</th>
                    <th className="px-8 py-6 text-[11px] uppercase tracking-[0.2em] font-bold text-gray-black/70 whitespace-nowrap">Department</th>
                    <th className="px-8 py-6 text-[11px] uppercase tracking-[0.2em] font-bold text-gray-black/70 whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredCourses.map((c, i) => (
                    <motion.tr 
                      key={c.courseId}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="hover:bg-premium-cream/10 transition-colors group"
                    >
                      <td className="px-8 py-6 text-sm font-bold text-premium-black font-mono whitespace-nowrap">{c.courseCode}</td>
                      <td className="px-8 py-6 text-sm font-bold text-black whitespace-nowrap">{c.title}</td>
                      <td className="px-8 py-6 text-sm font-medium text-gray-400 whitespace-nowrap">{c.creditHours} Units</td>
                      <td className="px-8 py-6 text-sm font-medium text-gray-400 whitespace-nowrap">{c.department}</td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <div className="flex items-center gap-4">
                          <button 
                            onClick={() => {
                              setEditingCourse(c);
                              setCourseForm(c);
                              setIsCourseModalOpen(true);
                            }}
                            className="p-2 text-gray-300 hover:text-premium-gold transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteCourse(c.courseId)}
                            className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {view === 'semesters' && (
        <section className="space-y-6 md:space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-black">Academic Semesters</h2>
            <button className="premium-button flex items-center gap-3">
              <Plus className="w-5 h-5" />
              <span className="text-xs uppercase tracking-widest">Add Semester</span>
            </button>
          </div>

          <div className="premium-card overflow-hidden border-none">
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[800px]">
                <thead>
                  <tr className="bg-premium-cream/20">
                    <th className="px-8 py-6 text-[11px] uppercase tracking-[0.2em] font-bold text-gray-black/70 whitespace-nowrap">Name</th>
                    <th className="px-8 py-6 text-[11px] uppercase tracking-[0.2em] font-bold text-gray-black/70 whitespace-nowrap">Start Date</th>
                    <th className="px-8 py-6 text-[11px] uppercase tracking-[0.2em] font-bold text-gray-black/70 whitespace-nowrap">End Date</th>
                    <th className="px-8 py-6 text-[11px] uppercase tracking-[0.2em] font-bold text-gray-black/70 whitespace-nowrap">Status</th>
                    <th className="px-8 py-6 text-[11px] uppercase tracking-[0.2em] font-bold text-gray-black/70 whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {semesters.map((s, i) => (
                    <motion.tr 
                      key={s.semesterId}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="hover:bg-premium-cream/10 transition-colors group"
                    >
                      <td className="px-8 py-6 text-sm font-bold text-black whitespace-nowrap">{s.name}</td>
                      <td className="px-8 py-6 text-sm font-medium text-gray-400 whitespace-nowrap">{s.startDate}</td>
                      <td className="px-8 py-6 text-sm font-medium text-gray-400 whitespace-nowrap">{s.endDate}</td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        {s.isActive ? (
                          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase tracking-widest">Active</span>
                        ) : (
                          <span className="px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-xs font-bold uppercase tracking-widest">Inactive</span>
                        )}
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        {!s.isActive && (
                          <button 
                            onClick={() => {
                              if (window.confirm('Warning: This will archive all current active sections and update the default view for all Instructors and Students. Proceed?')) {
                                setActiveSemester(s.semesterId);
                              }
                            }}
                            className="text-xs font-bold text-premium-gold hover:text-premium-black uppercase tracking-widest transition-colors"
                          >
                            Set Active
                          </button>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {view === 'sections' && (
        <section className="space-y-6 md:space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-black">Section Assignments</h2>
            <button 
              onClick={() => {
                setEditingSection(null);
                setSectionForm({ courseId: '', instructorId: '', room: '', schedule: '' });
                setIsSectionModalOpen(true);
              }}
              className="premium-button flex items-center gap-3"
            >
              <Plus className="w-5 h-5" />
              <span className="text-xs uppercase tracking-widest">Assign Section</span>
            </button>
          </div>

          <div className="premium-card overflow-hidden border-none">
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[800px]">
                <thead>
                  <tr className="bg-premium-cream/20">
                    <th className="px-8 py-6 text-[11px] uppercase tracking-[0.2em] font-bold text-gray-black/70 whitespace-nowrap">Course</th>
                    <th className="px-8 py-6 text-[11px] uppercase tracking-[0.2em] font-bold text-gray-black/70 whitespace-nowrap">Instructor</th>
                    <th className="px-8 py-6 text-[11px] uppercase tracking-[0.2em] font-bold text-gray-black/70 whitespace-nowrap">Room</th>
                    <th className="px-8 py-6 text-[11px] uppercase tracking-[0.2em] font-bold text-gray-black/70 whitespace-nowrap">Schedule</th>
                    <th className="px-8 py-6 text-[11px] uppercase tracking-[0.2em] font-bold text-gray-black/70 whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {sections.map((s, i) => {
                    const course = courses.find(c => c.courseId === s.courseId);
                    const instructor = users.find(u => u.userId === s.instructorId);
                    return (
                      <motion.tr 
                        key={s.sectionId}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="hover:bg-premium-cream/10 transition-colors group"
                      >
                        <td className="px-8 py-6 whitespace-nowrap">
                          <p className="text-sm font-bold text-black">{course?.courseCode}</p>
                          <p className="text-xs text-gray-400 mt-1">{course?.title}</p>
                        </td>
                        <td className="px-8 py-6 text-sm font-bold text-black whitespace-nowrap">{instructor?.fullName}</td>
                        <td className="px-8 py-6 text-sm font-medium text-gray-400 whitespace-nowrap">{s.room}</td>
                        <td className="px-8 py-6 text-sm font-medium text-gray-400 whitespace-nowrap">{s.schedule}</td>
                        <td className="px-8 py-6 whitespace-nowrap">
                          <div className="flex items-center gap-4">
                            <button 
                              onClick={() => {
                                setEditingSection(s);
                                setSectionForm(s);
                                setIsSectionModalOpen(true);
                              }}
                              className="p-2 text-gray-300 hover:text-premium-gold transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteSection(s.sectionId)}
                              className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {view === 'settings' && (
        <section className="space-y-12">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-black">System Configuration</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
            {/* Academic Terms */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-premium-black" />
                <h3 className="text-base md:text-lg font-bold text-black">Academic Terms</h3>
              </div>
              <div className="premium-card p-5 md:p-5 md:p-8 space-y-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-premium-cream/30 rounded-2xl">
                    <div>
                      <p className="text-sm font-bold text-black">2025/26 Semester I</p>
                      <p className="text-[10px] text-gray-400 font-medium">Oct 2025 - Feb 2026</p>
                    </div>
                    <span className="px-3 py-1 bg-premium-black text-white rounded-full text-[9px] font-bold uppercase tracking-widest">Active</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl opacity-60">
                    <div>
                      <p className="text-sm font-bold text-black">2024/25 Semester II</p>
                      <p className="text-[10px] text-gray-400 font-medium">Mar 2025 - Jul 2025</p>
                    </div>
                    <span className="px-3 py-1 bg-gray-200 text-gray-500 rounded-full text-[9px] font-bold uppercase tracking-widest">Archived</span>
                  </div>
                </div>
                <button className="w-full py-4 border-2 border-dashed border-gray-100 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:border-premium-black hover:text-premium-black transition-all">
                  Configure New Term
                </button>
              </div>
            </div>

            {/* Attendance Policies */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-premium-black" />
                <h3 className="text-lg font-bold text-black">Attendance Policies</h3>
              </div>
              <div className="premium-card p-5 md:p-8 space-y-8">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-black">Minimum Threshold</p>
                      <p className="text-xs text-gray-400">Required percentage for exam eligibility.</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <input type="number" defaultValue={80} className="w-16 px-3 py-2 bg-gray-50 rounded-lg text-sm font-bold text-center outline-none" />
                      <span className="text-sm font-bold text-black">%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-black">Geofence Radius</p>
                      <p className="text-xs text-gray-400">Allowed distance from classroom center.</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <input type="number" defaultValue={50} className="w-16 px-3 py-2 bg-gray-50 rounded-lg text-sm font-bold text-center outline-none" />
                      <span className="text-sm font-bold text-black">m</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-black">Token Expiry</p>
                      <p className="text-xs text-gray-400">Minutes before session code expires.</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <input type="number" defaultValue={15} className="w-16 px-3 py-2 bg-gray-50 rounded-lg text-sm font-bold text-center outline-none" />
                      <span className="text-sm font-bold text-black">min</span>
                    </div>
                  </div>
                </div>
                <button className="premium-button w-full py-4 text-xs">Save Policy Updates</button>
              </div>
            </div>
          </div>
        </section>
      )}
      <AnimatePresence>
        {isUserModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsUserModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[32px] shadow-2xl overflow-hidden"
            >
              <div className="p-5 md:p-8 border-b border-gray-100 flex items-center justify-between bg-premium-cream/30">
                <h3 className="text-xl md:text-2xl font-serif font-bold text-black">
                  {editingUser ? 'Edit Personnel' : 'Add New Personnel'}
                </h3>
                <button onClick={() => setIsUserModalOpen(false)} className="p-2 hover:bg-white rounded-xl transition-all">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              <form onSubmit={handleSaveUser} className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Full Name</label>
                    <input
                      required
                      type="text"
                      value={userForm.fullName}
                      onChange={(e) => setUserForm({ ...userForm, fullName: e.target.value })}
                      className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-premium-gold/20 outline-none transition-all"
                      placeholder="e.g. Dr. Abebe Kebede"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Email Address</label>
                    <input
                      required
                      type="email"
                      value={userForm.email}
                      onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                      className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-premium-gold/20 outline-none transition-all"
                      placeholder="email@haramaya.edu.et"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Role</label>
                    <select
                      value={userForm.role}
                      onChange={(e) => setUserForm({ ...userForm, role: e.target.value as UserRole })}
                      className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-premium-gold/20 outline-none transition-all appearance-none"
                    >
                      <option value="student">Student</option>
                      <option value="instructor">Instructor</option>
                      <option value="admin">Administrator</option>
                      <option value="qa">QA Officer</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">ID Number (Optional)</label>
                    <input
                      type="text"
                      value={userForm.idNumber}
                      onChange={(e) => setUserForm({ ...userForm, idNumber: e.target.value })}
                      className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-premium-gold/20 outline-none transition-all"
                      placeholder="e.g. 0328/15"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Department</label>
                    <input
                      required
                      type="text"
                      value={userForm.department}
                      onChange={(e) => setUserForm({ ...userForm, department: e.target.value })}
                      className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-premium-gold/20 outline-none transition-all"
                      placeholder="e.g. Computer Science"
                    />
                  </div>
                </div>
                <div className="pt-4 flex gap-4">
                  <button
                    type="button"
                    onClick={() => setIsUserModalOpen(false)}
                    className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-gray-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-4 bg-premium-black text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-premium-gold transition-all shadow-xl shadow-premium-black/20"
                  >
                    {editingUser ? 'Update Personnel' : 'Create Personnel'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Course Modal */}
      <AnimatePresence>
        {isCourseModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCourseModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[32px] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-premium-cream/30">
                <h3 className="text-2xl font-serif font-bold text-black">
                  {editingCourse ? 'Edit Course' : 'Add New Course'}
                </h3>
                <button onClick={() => setIsCourseModalOpen(false)} className="p-2 hover:bg-white rounded-xl transition-all">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              <form onSubmit={handleSaveCourse} className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Course Code</label>
                    <input
                      required
                      type="text"
                      value={courseForm.courseCode}
                      onChange={(e) => setCourseForm({ ...courseForm, courseCode: e.target.value })}
                      className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-premium-gold/20 outline-none transition-all"
                      placeholder="e.g. CoSc4038"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Course Title</label>
                    <input
                      required
                      type="text"
                      value={courseForm.title}
                      onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                      className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-premium-gold/20 outline-none transition-all"
                      placeholder="e.g. Distributed Systems"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Credit Hours</label>
                    <input
                      required
                      type="number"
                      value={courseForm.creditHours}
                      onChange={(e) => setCourseForm({ ...courseForm, creditHours: parseInt(e.target.value) })}
                      className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-premium-gold/20 outline-none transition-all"
                      min="1"
                      max="6"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Department</label>
                    <input
                      required
                      type="text"
                      value={courseForm.department}
                      onChange={(e) => setCourseForm({ ...courseForm, department: e.target.value })}
                      className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-premium-gold/20 outline-none transition-all"
                      placeholder="e.g. Computer Science"
                    />
                  </div>
                </div>
                <div className="pt-4 flex gap-4">
                  <button
                    type="button"
                    onClick={() => setIsCourseModalOpen(false)}
                    className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-gray-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-4 bg-premium-black text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-premium-gold transition-all shadow-xl shadow-premium-black/20"
                  >
                    {editingCourse ? 'Update Course' : 'Create Course'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Section Modal */}
      <AnimatePresence>
        {isSectionModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSectionModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[32px] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-premium-cream/30">
                <h3 className="text-2xl font-serif font-bold text-black">
                  {editingSection ? 'Edit Section Assignment' : 'Assign New Section'}
                </h3>
                <button onClick={() => setIsSectionModalOpen(false)} className="p-2 hover:bg-white rounded-xl transition-all">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              <form onSubmit={handleSaveSection} className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Course</label>
                    <select
                      required
                      value={sectionForm.courseId}
                      onChange={(e) => setSectionForm({ ...sectionForm, courseId: e.target.value })}
                      className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-premium-gold/20 outline-none transition-all appearance-none"
                    >
                      <option value="">Select Course</option>
                      {courses.map(c => (
                        <option key={c.courseId} value={c.courseId}>{c.courseCode} - {c.title}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Instructor</label>
                    <select
                      required
                      value={sectionForm.instructorId}
                      onChange={(e) => setSectionForm({ ...sectionForm, instructorId: e.target.value })}
                      className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-premium-gold/20 outline-none transition-all appearance-none"
                    >
                      <option value="">Select Instructor</option>
                      {users.filter(u => u.role === 'instructor').map(u => (
                        <option key={u.userId} value={u.userId}>{u.fullName}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Room</label>
                    <input
                      required
                      type="text"
                      value={sectionForm.room}
                      onChange={(e) => setSectionForm({ ...sectionForm, room: e.target.value })}
                      className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-premium-gold/20 outline-none transition-all"
                      placeholder="e.g. Block 24, Room 102"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Schedule</label>
                    <input
                      required
                      type="text"
                      value={sectionForm.schedule}
                      onChange={(e) => setSectionForm({ ...sectionForm, schedule: e.target.value })}
                      className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-premium-gold/20 outline-none transition-all"
                      placeholder="e.g. Mon, Wed • 08:30 AM"
                    />
                  </div>
                </div>
                <div className="pt-4 flex gap-4">
                  <button
                    type="button"
                    onClick={() => setIsSectionModalOpen(false)}
                    className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-gray-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-4 bg-premium-black text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-premium-gold transition-all shadow-xl shadow-premium-black/20"
                  >
                    {editingSection ? 'Update Section' : 'Assign Section'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboard;
