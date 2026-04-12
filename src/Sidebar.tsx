import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  CheckSquare, 
  BarChart3, 
  Settings, 
  UserCircle,
  LogOut,
  ShieldCheck,
  X,
  Briefcase,
  GraduationCap,
  Play,
  CalendarDays,
  FileText,
  ClipboardCheck,
  CheckCircle2,
  Calendar,
  Clock
} from 'lucide-react';
import { cn } from './lib/utils';

interface SidebarProps {
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const { user, logout } = useAuth();

  const menuItems = [
    { name: 'Overview', path: '/', icon: LayoutDashboard, roles: ['student', 'instructor', 'admin', 'qa'] },
    // Admin
    { name: 'Staff', path: '/admin/staff', icon: Briefcase, roles: ['admin'] },
    { name: 'Students', path: '/admin/students', icon: GraduationCap, roles: ['admin'] },
    { name: 'Courses', path: '/admin/courses', icon: BookOpen, roles: ['admin'] },
    { name: 'Settings', path: '/settings', icon: Settings, roles: ['admin'] },
    // Instructor
    { name: 'Live Sessions', path: '/instructor/sessions', icon: Play, roles: ['instructor'] },
    { name: 'My Sections', path: '/instructor/sections', icon: CalendarDays, roles: ['instructor'] },
    { name: 'Reports', path: '/instructor/reports', icon: FileText, roles: ['instructor'] },
    { name: 'Session History', path: '/instructor/history', icon: Clock, roles: ['instructor'] },
    // QA
    { name: 'Audit Logs', path: '/qa/audit', icon: ShieldCheck, roles: ['qa'] },
    { name: 'Corrections', path: '/qa/corrections', icon: ClipboardCheck, roles: ['qa'] },
    { name: 'Reports', path: '/qa/reports', icon: BarChart3, roles: ['qa'] },
    // Student
    { name: 'My Attendance', path: '/student/attendance', icon: CheckCircle2, roles: ['student'] },
    { name: 'Schedule', path: '/student/schedule', icon: Calendar, roles: ['student'] },
    // Common
    { name: 'Profile', path: '/profile', icon: UserCircle, roles: ['student', 'instructor', 'admin', 'qa'] },
  ];

  const filteredItems = menuItems.filter(item => 
    user && item.roles.includes(user.role)
  );

  return (
    <aside className="w-72 bg-white border-r border-gray-100 flex flex-col h-screen sticky top-0">
      <div className="p-5 md:p-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-hu-green rounded-2xl flex items-center justify-center text-white shadow-xl shadow-hu-green/20">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div className="flex flex-col">
            <span className="font-serif font-bold text-2xl tracking-tight text-hu-charcoal leading-none">HU-AMS</span>
            <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-hu-green mt-1">Haramaya University</span>
          </div>
        </div>
        
        {/* Mobile Close Button */}
        <button
          onClick={onClose}
          className="lg:hidden p-2 text-gray-400 hover:bg-hu-cream rounded-xl transition-all"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 px-6 space-y-2 mt-6">
        {filteredItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onClose}
            className={({ isActive }) => cn(
              "flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-semibold transition-all duration-300",
              isActive 
                ? "bg-hu-green/10 text-hu-green shadow-sm" 
                : "text-gray-400 hover:bg-gray-50 hover:text-hu-charcoal"
            )}
          >
            {({ isActive }) => (
              <>
                <item.icon className={cn("w-5 h-5", isActive ? "text-hu-green" : "text-gray-300")} />
                {item.name}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 md:p-6 border-t border-gray-50">
        <div className="bg-hu-cream rounded-3xl p-5 mb-6 border border-hu-green/5">
          <div className="flex items-center gap-4 mb-1">
            <div className="w-10 h-10 bg-white border border-gray-100 rounded-2xl flex items-center justify-center text-sm font-bold text-hu-charcoal shadow-sm">
              {user?.fullName?.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-hu-charcoal truncate">{user?.fullName}</p>
              <p className="text-[10px] font-bold text-hu-green uppercase tracking-widest">{user?.role}</p>
            </div>
          </div>
        </div>
        
        <button
          onClick={() => logout()}
          className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-semibold text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all duration-300"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
