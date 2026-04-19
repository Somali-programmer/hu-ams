import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Footer from './components/Footer';
import { Menu, ShieldCheck, LogOut, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { NavLink } from 'react-router-dom';
import { cn } from './lib/utils';
import { useAuth } from './AuthContext';
import { menuItems } from './config/navigation';
import ThemeToggle from './components/ThemeToggle';

const policyContent: Record<string, { title: string, content: React.ReactNode }> = {
  support: {
    title: "Technical Support",
    content: (
      <div className="space-y-4 text-sm text-brand-muted leading-relaxed">
        <p>If you experience any issues with the HU-AMS (Attendance Management System), please reach out to the technical staff through the following channels:</p>
        <ul className="list-disc pl-5 space-y-2 text-brand-text">
          <li><strong>Email:</strong> ams-support@haramaya.edu.et</li>
          <li><strong>Office:</strong> Computer Science Department, Main Campus, Block 4.</li>
          <li><strong>Operating Hours:</strong> Monday to Friday, 8:00 AM - 5:00 PM (EAT).</li>
        </ul>
        <p className="mt-4">Please include your ID number, program details, and a detailed description of the problem along with any relevant screenshots for faster resolution.</p>
      </div>
    )
  },
  attendance: {
    title: "CS Dept. Attendance Policy",
    content: (
      <div className="space-y-4 text-sm text-brand-muted leading-relaxed">
        <p>Haramaya University <strong>Department of Computer Science</strong> strictly enforces the following attendance regulations to uphold academic excellence:</p>
        <ol className="list-decimal pl-5 space-y-3 text-brand-text">
          <li><strong>Mandatory Requirement:</strong> Students must attend a minimum of 85% of all scheduled classes, laboratory sessions, and tutorials to be eligible for final examinations.</li>
          <li><strong>Geofenced Verification:</strong> Attendance is strictly recorded via the HU-AMS using verified location data within the classroom's perimeter. Proxy attendance is a severe violation of academic integrity.</li>
          <li><strong>Tardiness:</strong> Students arriving more than 15 minutes after the scheduled start time will be marked as 'Late'. Three recorded late arrivals constitute one 'Absent' mark.</li>
          <li><strong>Excused Absences:</strong> Medical emergencies or officially sanctioned university activities must be supported by valid documentation (e.g., clinic slip). These must be submitted to the department head or course instructor within 48 hours of return.</li>
          <li><strong>Penalties:</strong> Falling below the 85% threshold without approved documentation will result in an automatic 'F' grade for the course, and barring from all final assessments.</li>
        </ol>
      </div>
    )
  },
  terms: {
    title: "Terms of Service",
    content: (
      <div className="space-y-4 text-sm text-brand-muted leading-relaxed">
        <p>By accessing the Haramaya University Attendance Management System (HU-AMS), you agree to be bound by the following terms:</p>
        <ul className="list-disc pl-5 space-y-3 text-brand-text">
          <li><strong>Authorized Access:</strong> Use of this system is restricted solely to enrolled students, active faculty, and administrative staff. Account sharing or credential delegation is strictly prohibited.</li>
          <li><strong>Academic Integrity:</strong> Any attempt to manipulate, spoof location, or deliberately bypass the system's tracking protocols will result in immediate disciplinary action by the University Disciplinary Committee.</li>
          <li><strong>System Accessibility:</strong> While we strive for 99.9% uptime, the university reserves the right to perform scheduled maintenance. Instructors will provide alternative attendance methods during unforeseen outages.</li>
        </ul>
      </div>
    )
  },
  privacy: {
    title: "Privacy Policy",
    content: (
      <div className="space-y-4 text-sm text-brand-muted leading-relaxed">
        <p>Haramaya University is deeply committed to protecting the privacy and personal data of our academic community.</p>
        <ul className="list-disc pl-5 space-y-3 text-brand-text">
          <li><strong>Data Collection:</strong> The HU-AMS collects strictly necessary operational data, including timestamps, geographical location (solely during active session check-ins), and device identifiers to prevent fraudulent activities.</li>
          <li><strong>Data Usage:</strong> Location data is <em>never</em> tracked or logged outside of the designated check-in window. Attendance logs are used exclusively for academic evaluation, compliance tracking, and internal auditing.</li>
          <li><strong>Data Security:</strong> All network communications are heavily encrypted. Access to detailed attendance records is limited strictly to authorized course instructors, QA officers, and system administrators. Your data is never sold or transferred to third parties.</li>
        </ul>
      </div>
    )
  }
};

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const { user, logout } = useAuth();


  const filteredItems = menuItems.filter(item => 
    user && item.roles.includes(user.role)
  );

  return (
    <div className="flex flex-col min-h-screen bg-brand-bg transition-colors duration-500">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Mobile Drawer */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 lg:hidden",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <Sidebar onClose={() => setIsSidebarOpen(false)} />
      </div>

      {/* Desktop & Mobile Header */}
      <header className="bg-brand-surface border-b border-brand-border sticky top-0 z-30 transition-colors">
        <div className="max-w-[1800px] mx-auto px-4 md:px-6 lg:px-10">
          <div className="flex items-center justify-between h-14 md:h-16 lg:h-20">
            <div className="flex items-center gap-4 xl:gap-12">
              <div className="flex items-center gap-3 pr-4 md:pr-10 xl:border-r border-brand-border h-10">
                <div className="w-9 h-9 bg-brand-primary rounded-xl flex items-center justify-center text-brand-text dark:text-hu-charcoal shadow-lg shadow-brand-primary/20 transition-all duration-500 shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="hidden sm:flex flex-col">
                  <span className="font-serif font-bold text-base md:text-lg tracking-tight text-brand-text leading-tight">HU-AMS</span>
                  <span className="hidden xl:block text-[7px] uppercase tracking-[0.4em] font-bold text-brand-primary mt-0.5">Haramaya University</span>
                </div>
              </div>

              {/* Desktop Navigation */}
              <nav className="hidden lg:flex items-center gap-0.5 xl:gap-1">
                {filteredItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) => cn(
                      "flex flex-col items-center gap-0.5 px-2 xl:px-4 py-1 xl:py-1.5 rounded-xl transition-all duration-300 group",
                      isActive 
                        ? "bg-brand-primary/10 text-brand-primary shadow-sm" 
                        : "text-brand-muted hover:bg-brand-primary/5 hover:text-brand-text"
                    )}
                  >
                    {({ isActive }) => (
                      <>
                        <item.icon className={cn("w-4 h-4 xl:w-4.5 xl:h-4.5 transition-colors", isActive ? "text-brand-primary" : "text-brand-muted/60 group-hover:text-brand-primary/80")} />
                        <span className="text-[7.5px] xl:text-[8px] font-bold uppercase tracking-[0.15em] whitespace-nowrap">{item.name}</span>
                      </>
                    )}
                  </NavLink>
                ))}
              </nav>
            </div>

            <div className="flex items-center gap-2 md:gap-4 flex-1">
              <div className="flex flex-col items-start mr-auto block lg:hidden">
                <span className="text-brand-text font-serif font-bold text-sm sm:text-base leading-tight">
                  HU-CS Department
                </span>
                <span className="text-[8px] sm:text-[9px] uppercase tracking-widest text-brand-primary font-bold">
                  Development Portal
                </span>
              </div>
              
              <div className="scale-75">
                <ThemeToggle />
              </div>
              
              {/* Desktop Profile & Logout */}
              <div className="hidden lg:flex items-center gap-3 pl-4 xl:pl-8 border-l border-brand-border h-8">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-brand-primary/10 border border-brand-primary/20 rounded-lg flex items-center justify-center text-[10px] font-bold text-brand-primary shadow-sm">
                    {user?.fullName?.charAt(0)}
                  </div>
                  <div className="hidden xl:block">
                    <p className="text-[11px] font-bold text-brand-text truncate max-w-[120px]">{user?.fullName}</p>
                    <p className="text-[7px] font-bold text-brand-primary uppercase tracking-[0.2em]">{user?.role}</p>
                  </div>
                </div>
                <button
                  onClick={() => logout()}
                  className="p-1 text-brand-muted hover:text-red-500 hover:bg-red-500/10 rounded transition-all"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden p-1.5 text-brand-text bg-brand-primary/10 rounded-lg transition-all"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-[1800px] w-full mx-auto pb-12 px-4 sm:px-6 lg:px-10 pt-4 md:pt-6">
        {children}
      </main>

      <Footer />

      {/* Policy Modals */}
      <AnimatePresence>
        {activeModal && policyContent[activeModal] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 md:p-6"
            onClick={() => setActiveModal(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-2xl max-h-[85vh] bg-brand-surface rounded-3xl overflow-hidden flex flex-col shadow-2xl shadow-black/50 border border-brand-border"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 md:p-8 flex items-center justify-between border-b border-brand-border bg-brand-bg/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl md:text-2xl font-serif font-bold text-brand-text mb-1">
                      {policyContent[activeModal].title}
                    </h3>
                    <p className="text-[10px] uppercase tracking-widest font-bold text-brand-primary">
                      Haramaya University
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveModal(null)}
                  className="p-2 text-brand-muted hover:bg-brand-border hover:text-brand-text rounded-xl transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-6 md:p-8 overflow-y-auto">
                {policyContent[activeModal].content}
              </div>
              
              <div className="p-6 border-t border-brand-border bg-brand-bg/50 flex justify-end">
                <button
                  onClick={() => setActiveModal(null)}
                  className="px-8 py-3 bg-brand-primary text-white dark:text-hu-charcoal rounded-xl text-xs font-bold uppercase tracking-widest hover:brightness-110 transition-all shadow-lg shadow-brand-primary/20"
                >
                  Understood
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Layout;
