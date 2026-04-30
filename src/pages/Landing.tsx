import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, Variants } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, BookOpen, GraduationCap, Cpu, Layers, Menu, X, ArrowRight, Activity, Users, Database, AlertTriangle } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import Footer from '../components/Footer';

const sectionVariants: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
};

const Header = ({ onLoginClick }: { onLoginClick: (e: React.MouseEvent) => void }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white/80 dark:bg-[#121212]/80 backdrop-blur-md border-b border-brand-border shadow-sm py-2' : 'bg-transparent py-4'}`}>
      <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="https://somali-programmer.github.io/2018_exit_exam-/logo.png" alt="HU Logo" className="w-10 h-10 md:w-12 md:h-12 object-contain drop-shadow-sm" />
          <div className="flex flex-col justify-center">
            <h1 className="font-serif font-bold text-brand-text leading-tight tracking-tight flex flex-col pt-0.5">
              <span className="text-[15px] sm:text-lg md:text-xl lg:text-2xl whitespace-nowrap">Haramaya University</span>
              <span className="text-[9px] sm:text-[10px] lg:text-xs text-brand-muted font-normal whitespace-nowrap">Department of Computer Science</span>
            </h1>
          </div>
        </div>
        
        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-6 xl:gap-8">
          <a href="#about" className="text-xs xl:text-sm font-medium text-brand-text/80 hover:text-brand-primary transition-colors">About</a>
          <a href="#university" className="text-xs xl:text-sm font-medium text-brand-text/80 hover:text-brand-primary transition-colors">University</a>
          <a href="#college" className="text-xs xl:text-sm font-medium text-brand-text/80 hover:text-brand-primary transition-colors">College</a>
          <a href="#department" className="text-xs xl:text-sm font-medium text-brand-text/80 hover:text-brand-primary transition-colors">Department</a>
          <div className="flex items-center gap-3 xl:gap-4 ml-2">
            <ThemeToggle />
            <button onClick={onLoginClick} className="hu-button !py-2 !px-5 xl:!py-2.5 xl:!px-6 !rounded-xl !text-xs xl:!text-sm shadow-md hover:shadow-lg transition-all border border-brand-primary/20">
              Login to Portal
            </button>
          </div>
        </nav>

        {/* Mobile Menu Toggle */}
        <div className="lg:hidden flex items-center gap-4">
          <ThemeToggle />
          <button className="p-2 text-brand-text hover:bg-brand-surface rounded-full transition-colors" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="lg:hidden bg-brand-surface border-b border-brand-border shadow-xl absolute top-full left-0 right-0">
          <div className="flex flex-col p-6 space-y-5">
            <a href="#about" onClick={() => setMobileMenuOpen(false)} className="text-brand-text font-medium text-base hover:text-brand-primary transition-colors">About System</a>
            <a href="#university" onClick={() => setMobileMenuOpen(false)} className="text-brand-text font-medium text-base hover:text-brand-primary transition-colors">University</a>
            <a href="#college" onClick={() => setMobileMenuOpen(false)} className="text-brand-text font-medium text-base hover:text-brand-primary transition-colors">College</a>
            <a href="#department" onClick={() => setMobileMenuOpen(false)} className="text-brand-text font-medium text-base hover:text-brand-primary transition-colors">Department</a>
            <div className="h-px bg-brand-border w-full my-2"></div>
            <button onClick={onLoginClick} className="hu-button justify-center w-full !py-3 !rounded-xl text-base shadow-md">Join HU-AMS now to login</button>
          </div>
        </motion.div>
      )}
    </header>
  );
};

export default function Landing() {
  const [showCautionModal, setShowCautionModal] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text selection:bg-brand-primary selection:text-black font-sans">
      <Header onLoginClick={(e) => { e.preventDefault(); setShowCautionModal(true); }} />

      {/* HERO SECTION */}
      <section className="relative min-h-screen flex items-center pt-28 overflow-hidden">
        {/* Background Image & Overlay */}
        <div className="absolute inset-0 z-0 bg-brand-bg">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-40 dark:opacity-30 scale-105 transform hover:scale-100 transition-transform duration-[20s]"></div>
          
          <div className="absolute inset-0 bg-brand-bg/60 backdrop-blur-[2px] dark:bg-brand-bg/70 dark:backdrop-blur-[1px]"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-brand-bg/40 to-brand-bg"></div>
          
          <div className="absolute right-0 top-1/4 w-1/3 h-1/2 bg-brand-primary/20 rounded-full blur-[120px] pointer-events-none mix-blend-screen"></div>
          <div className="absolute left-0 bottom-0 w-1/2 h-1/3 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none mix-blend-screen"></div>
        </div>

        <div className="max-w-4xl mx-auto px-4 md:px-8 relative z-10 w-full flex flex-col items-center text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1, ease: 'easeOut' }}
              className="flex flex-col items-center"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-surface border border-brand-border text-brand-primary shadow-sm text-xs font-bold tracking-widest uppercase mb-8">
                <span className="w-2 h-2 rounded-full bg-brand-primary animate-pulse"></span>
                Final Year Project Proposal
              </div>
              
              <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-[8rem] font-sans font-bold tracking-tighter text-brand-text leading-[0.9] mb-6 drop-shadow-sm">
                HU-AMS
              </h1>
              
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-serif font-medium text-brand-text/90 mb-8 max-w-3xl mx-auto bg-clip-text text-transparent bg-gradient-to-r from-brand-text to-brand-muted">
                Haramaya University Attendance Management System
              </h2>
              
              <p className="text-base md:text-xl text-brand-muted max-w-2xl mx-auto mb-12 leading-relaxed font-light">
                A state-of-the-art software solution crafted exclusively for Computer Science students and faculty. Designed to streamline academic tracking, enhance integrity, and modernize physical classrooms.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                <button onClick={(e) => { e.preventDefault(); setShowCautionModal(true); }} className="hu-button !py-4 !px-10 !rounded-2xl text-lg group justify-center shadow-lg hover:shadow-xl transition-all border border-brand-primary/20">
                  <span className="font-semibold">Join HU-AMS now to login</span>
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
                
              <div className="flex items-center gap-4 text-sm text-brand-muted font-medium justify-center mt-8">
                <div className="flex -space-x-3">
                  <img src="https://ui-avatars.com/api/?name=St&background=D1FAE5" className="w-10 h-10 rounded-full border-2 border-brand-bg shadow-sm" alt="Student" />
                  <img src="https://ui-avatars.com/api/?name=Fa&background=FEF3C7" className="w-10 h-10 rounded-full border-2 border-brand-bg shadow-sm" alt="Faculty" />
                  <img src="https://ui-avatars.com/api/?name=QA&background=E0E7FF" className="w-10 h-10 rounded-full border-2 border-brand-bg shadow-sm" alt="QA" />
                </div>
                <span>Trusted by CS Dept</span>
              </div>
            </motion.div>
        </div>
      </section>

      {/* SECTION 1: ABOUT HU-AMS */}
      <section id="about" className="py-24 md:py-32 bg-brand-surface relative border-y border-brand-border/50 shadow-[0_-10px_40px_rgba(0,0,0,0.02)] z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brand-primary/5 via-transparent to-transparent opacity-60"></div>
        <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
          <motion.div 
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={sectionVariants}
            className="text-center max-w-3xl mx-auto mb-20 md:mb-24"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-serif font-bold mb-6 text-brand-text tracking-tight">A System Built for <span className="text-brand-primary">Scale</span></h2>
            <p className="text-base sm:text-lg md:text-xl text-brand-muted font-light leading-relaxed">
              HU-AMS is an advanced architectural solution utilizing real-time database syncing, role-based workflows, and uncompromising data integrity to manage the complexity of academic attendance.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 px-2">
            {[
              { icon: Layers, title: "Role-Based Architecture", desc: "Granular access controls for Students, Instructors, Quality Assurance Officers, and Administrators." },
              { icon: Database, title: "Immutable Audit Trails", desc: "Every action is logged. Institutional memory is preserved. Trust is guaranteed through cryptographically sound methodologies." },
              { icon: Users, title: "Seamless Auto-Enrollment", desc: "Database-level triggers map students to courses instantly, eliminating manual data entry delays." }
            ].map((feature, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1, duration: 0.6 }}
                className="hu-card p-8 group hover:-translate-y-2 transition-all duration-300 shadow-sm hover:shadow-xl bg-white dark:bg-black/20"
              >
                <div className="w-16 h-16 rounded-2xl bg-brand-bg border border-brand-border flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-brand-primary/10 transition-all duration-300">
                  <feature.icon className="w-8 h-8 text-brand-primary drop-shadow-sm" />
                </div>
                <h3 className="text-xl md:text-2xl font-bold mb-4 font-sans text-brand-text">{feature.title}</h3>
                <p className="text-brand-muted leading-relaxed font-light">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 2: HARAMAYA UNIVERSITY */}
      <section id="university" className="py-24 md:py-32 bg-brand-bg overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={sectionVariants}>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-surface border border-brand-border text-brand-primary text-xs font-bold tracking-widest uppercase mb-6 shadow-sm">
                 What is Haramaya University
              </div>
              <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-[5rem] font-sans font-bold tracking-tight mb-8 leading-[1.1] text-brand-text">Building the base of<br/>development</h2>
              <p className="text-base md:text-xl text-brand-muted mb-10 leading-relaxed font-light">
                Haramaya University (HU), established in 1954 as a pioneer in agricultural education, is a top public research university in Ethiopia located near Dire Dawa. It offers diverse undergraduate and postgraduate programs, aiming to become a leading African university by 2030, with a focus on agriculture, technology, and health sciences.
              </p>
              <div className="grid grid-cols-2 gap-8 pt-8 border-t border-brand-border/50">
                <div className="group">
                  <p className="text-4xl lg:text-5xl font-light text-brand-text mb-2 group-hover:text-brand-primary transition-colors">1954</p>
                  <p className="text-xs sm:text-sm tracking-widest uppercase text-brand-muted font-bold">Established</p>
                </div>
                <div className="group">
                  <p className="text-4xl lg:text-5xl font-light text-brand-text mb-2 group-hover:text-brand-primary transition-colors">30k+</p>
                  <p className="text-xs sm:text-sm tracking-widest uppercase text-brand-muted font-bold">Students</p>
                </div>
              </div>
            </motion.div>
            
            <motion.div initial={{ opacity: 0, x: 50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="relative h-[600px] rounded-[3rem] overflow-hidden hu-glass p-3 shadow-2xl">
              <div className="absolute inset-0 bg-brand-primary/5 rounded-[3rem] border border-brand-border m-3 pointer-events-none z-10"></div>
              <img src="https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&q=80" alt="Haramaya University" className="w-full h-full object-cover rounded-[2.5rem] opacity-90 transition-transform duration-[10s] hover:scale-105" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* SECTION 3: COLLEGE OF COMPUTING & INFORMATICS */}
      <section id="college" className="py-24 md:py-32 bg-brand-surface relative border-y border-brand-border/50">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-brand-primary/30 to-transparent"></div>
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={sectionVariants} className="text-center mb-16 md:mb-20">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-brand-text mb-6">College of Computing <span className="italic text-brand-muted font-light">& Informatics</span></h2>
            <p className="text-base md:text-xl max-w-2xl mx-auto text-brand-muted font-light">A key academic unit dedicated to training professionals in the fields of information technology and data science. Established in April 2008, it is currently structured into six distinct departments.</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {['Computer Science', 'Information Technology', 'Information System', 'Information Science', 'Software Engineering', 'Statistics'].map((dept, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, scale: 0.95, y: 20 }} whileInView={{ opacity: 1, scale: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1, duration: 0.5 }}
                className="p-8 border border-brand-border rounded-[2rem] bg-brand-bg hover:bg-brand-surface hover:border-brand-primary/30 transition-all duration-300 group shadow-sm hover:shadow-xl cursor-default"
              >
                <div className="w-12 h-12 rounded-full border border-brand-border flex items-center justify-center mb-8 group-hover:bg-brand-primary group-hover:border-brand-primary group-hover:text-brand-bg transition-all duration-300 shadow-sm">
                  <span className="font-mono text-sm leading-none font-bold">{`0${i + 1}`}</span>
                </div>
                <h4 className="text-xl md:text-2xl font-bold font-sans tracking-tight mb-2 text-brand-text group-hover:text-brand-primary transition-colors">{dept}</h4>
                <div className="h-1 w-12 bg-brand-border group-hover:bg-brand-primary group-hover:w-full transition-all duration-500 rounded-full mt-6"></div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4: DEPARTMENT OF COMPUTER SCIENCE */}
      <section id="department" className="py-24 md:py-32 bg-[#0a0a0a] text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-brand-primary/5 rounded-full blur-[120px] pointer-events-none mix-blend-screen"></div>
        <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
          <div className="grid lg:grid-cols-12 gap-16 lg:gap-24">
            <div className="lg:col-span-5">
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={sectionVariants} className="sticky top-32">
                <div className="w-20 h-20 bg-brand-primary/10 rounded-2xl flex items-center justify-center mb-10 border border-brand-primary/20 backdrop-blur-sm mt-8 xl:mt-0">
                  <Cpu className="w-10 h-10 text-brand-primary drop-shadow-md" />
                </div>
                <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-sans font-bold leading-[0.95] tracking-tighter mb-8 text-white">Department of<br/>Computer Science</h2>
                <p className="text-lg md:text-xl lg:text-2xl text-gray-400 font-serif italic max-w-md">
                  Launched in 2003, it has grown into a regional leader in tech education.
                </p>
              </motion.div>
            </div>
            
            <div className="lg:col-span-7 space-y-20 mt-12 lg:mt-0">
              <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.6 }}>
                <h3 className="text-3xl md:text-4xl font-bold mb-6 font-sans tracking-tight text-white">Academic<br/>Programs</h3>
                <div className="h-px w-32 bg-brand-primary/50 mb-8"></div>
                <ul className="text-gray-400 text-base md:text-lg leading-relaxed font-light space-y-5">
                  <li className="flex gap-3 items-start"><div className="w-2 h-2 rounded-full bg-brand-primary mt-2 flex-shrink-0"></div><p><strong className="text-white">BSc in Computer Science:</strong> Focusing on software development, networking, and database administration.</p></li>
                  <li className="flex gap-3 items-start"><div className="w-2 h-2 rounded-full bg-brand-primary mt-2 flex-shrink-0"></div><p><strong className="text-white">MSc in Computer Science:</strong> A graduate program for advanced specialization.</p></li>
                  <li className="flex gap-3 items-start"><div className="w-2 h-2 rounded-full bg-brand-primary mt-2 flex-shrink-0"></div><p><strong className="text-white">MSc in Artificial Intelligence:</strong> Focusing on cutting-edge fields like machine learning and deep learning.</p></li>
                </ul>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.6 }}>
                <h3 className="text-3xl md:text-4xl font-bold mb-6 font-sans tracking-tight text-white">Research &<br/>Innovation</h3>
                <div className="h-px w-32 bg-brand-primary/50 mb-8"></div>
                <p className="text-gray-400 text-base md:text-lg leading-relaxed mb-10 font-light">
                  Research is a core component with ongoing projects in Machine Learning, NLP (Afaan Oromo tools), Agricultural Tech (plant disease ID), and Healthcare AI. The department maintains eight specialized computer labs and serves as a local Cisco Networking Academy.
                </p>
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="bg-white/5 p-8 rounded-[2rem] border border-white/10 hover:border-brand-primary/50 transition-colors group">
                    <p className="text-brand-primary text-sm uppercase tracking-widest font-bold mb-4 flex items-center gap-2">
                       <span className="w-1.5 h-1.5 rounded-full bg-brand-primary"></span>
                       Excellence
                    </p>
                    <p className="text-white font-medium text-base md:text-lg">Top-tier coding standards and ethical software construction.</p>
                  </div>
                  <div className="bg-white/5 p-8 rounded-[2rem] border border-white/10 hover:border-[#FFB81C]/50 transition-colors group">
                    <p className="text-[#FFB81C] text-sm uppercase tracking-widest font-bold mb-4 flex items-center gap-2">
                       <span className="w-1.5 h-1.5 rounded-full bg-[#FFB81C]"></span>
                       Innovation
                    </p>
                    <p className="text-white font-medium text-base md:text-lg">HU-AMS is a direct product of student brilliance and innovation.</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER CTA */}
      <section className="py-32 bg-brand-primary text-black text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=2000&auto=format&fit=crop')] opacity-10 bg-cover bg-center mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={sectionVariants} className="max-w-4xl mx-auto px-4 relative z-10">
          <h2 className="text-3xl sm:text-4xl md:text-6xl lg:text-[5.5rem] font-sans font-bold tracking-tight mb-10 leading-[1.05]">Ready to manage attendance intelligently?</h2>
          <button onClick={(e) => { e.preventDefault(); setShowCautionModal(true); }} className="inline-flex items-center gap-3 bg-black text-white px-10 py-5 rounded-2xl font-bold text-lg md:text-xl hover:bg-gray-900 transition-all hover:scale-105 active:scale-95 duration-300 shadow-2xl hover:shadow-[0_20px_40px_rgba(0,0,0,0.3)]">
            Access HU-AMS Portal
            <ArrowRight className="w-6 h-6" />
          </button>
        </motion.div>
      </section>
      
      {/* Caution Modal */}
      <AnimatePresence>
        {showCautionModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="hu-glass bg-brand-surface/90 border border-brand-border w-full max-w-lg rounded-2xl shadow-2xl p-6 sm:p-8 relative overflow-hidden text-center"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-brand-primary/50"></div>
              
              <div className="w-16 h-16 rounded-full bg-brand-bg border border-brand-border flex items-center justify-center mx-auto mb-6 shadow-sm">
                <AlertTriangle className="w-8 h-8 text-brand-primary" />
              </div>
              
              <h2 className="text-2xl font-bold text-brand-text font-serif mb-4">Security Notice</h2>
              
              <div className="bg-brand-primary/5 border border-brand-primary/20 rounded-xl p-4 mb-8 text-left space-y-3">
                <p className="text-brand-text text-sm leading-relaxed font-medium">
                  This system is strictly restricted to authorized Haramaya University students and staff.
                </p>
                <p className="text-brand-muted text-sm leading-relaxed">
                  For educational auditing and integrity verification, this platform actively logs sensitive metadata upon access. By proceeding, you acknowledge that the system will automatically collect your geographical location, IP address, device fingerprints, and access timestamps.
                </p>
                <p className="text-brand-muted text-sm leading-relaxed">
                  If you are not affiliated with the university, please decline and return to the home page immediately.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row items-center gap-4 justify-center">
                <button 
                  onClick={() => setShowCautionModal(false)}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-brand-text border border-brand-border hover:bg-brand-bg transition-colors font-semibold"
                >
                  Decline
                </button>
                <button 
                  onClick={() => navigate('/login')}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white hover:scale-105 active:scale-95 transition-all font-semibold shadow-lg shadow-red-600/20"
                >
                  I Understand
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}
