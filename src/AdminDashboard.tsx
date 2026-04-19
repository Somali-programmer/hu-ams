import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { User, Course, Section, UserRole, Semester, ProgramType, Center, DayOfWeek, CenterInfo, ProgramInfo, BatchInfo } from './types';
import { cn } from './lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Users, 
  BookOpen, 
  Settings, 
  ShieldCheck, 
  Database, 
  Search, 
  Trash2, 
  Edit2, 
  Eye,
  MapPin,
  Clock,
  AlertCircle,
  CheckCircle2, 
  X,
  LayoutDashboard,
  GraduationCap,
  Briefcase,
  Download,
  Upload,
  FileSpreadsheet,
  Calendar,
  Lock,
  FileText,
  Layers
} from 'lucide-react';
import Papa from 'papaparse';
import AnalyticsCard from './components/AnalyticsCard';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, PieChart, Pie } from 'recharts';

import { useNavigate } from 'react-router-dom';
import { useAppData } from './AppDataContext';

interface AdminDashboardProps {
  view?: 'overview' | 'staff' | 'students' | 'courses' | 'sections' | 'semesters' | 'settings' | 'audit' | 'centers' | 'programs' | 'batches';
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ view = 'overview' }) => {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const { 
    users, courses, sections, semesters, auditLogs, centers, programs, batches,
    addSemester, setActiveSemester, addSection, updateSection, deleteSection,
    addUser, updateUser, deleteUser, addCourse, updateCourse, deleteCourse, addAuditLog,
    addCenter, updateCenter, deleteCenter, addProgram, updateProgram, deleteProgram,
    addBatch, updateBatch, deleteBatch
  } = useAppData();
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleBackup = () => {
    alert('System data backup initiated... (Mock Action)');
  };

  const handleDownloadTemplate = () => {
    const csvContent = "fullName,email,idNumber,programType,center,batch\nMawlid Mahamed Abdi,mawlid.mahamed@haramaya.edu.et,0331/15,regular,main,2023 Batch\nMustafe Kadar Kalif,mustafe.kadar@haramaya.edu.et,0328/15,regular,main,2023 Batch";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "student_import_template.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as any[];
        const errors: string[] = [];
        
        // Basic validation
        data.forEach((row, index) => {
          if (!row.fullName || !row.email) {
            errors.push(`Row ${index + 1}: Name and Email are required.`);
          }
        });

        setImportData(data);
        setImportErrors(errors);
      }
    });
  };

  const processImport = () => {
    if (importErrors.length > 0) {
      alert("Please fix errors before importing.");
      return;
    }

    importData.forEach(student => {
      const newUser: User = {
        userId: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        fullName: student.fullName,
        email: student.email,
        idNumber: student.idNumber,
        role: 'student',
        department: 'Computer Science',
        programType: (programs.find(p => p.name.toLowerCase() === student.programType?.toLowerCase())?.programId || (programs.length > 0 ? programs[0].programId : 'regular')) as ProgramType,
        center: (centers.find(c => c.name.toLowerCase() === student.center?.toLowerCase())?.centerId || (centers.length > 0 ? centers[0].centerId : 'main')) as Center,
        batch: batches.find(b => b.name.toLowerCase() === student.batch?.toLowerCase())?.batchId || student.batch,
        isActive: true,
        createdAt: new Date().toISOString()
      };
      addUser(newUser);
    });

    addAuditLog({
      action: 'CREATE',
      entityType: 'USER',
      entityId: 'bulk-import',
      entityName: 'Bulk Student Import',
      performedBy: currentUser?.fullName || 'Admin',
      details: `Imported ${importData.length} students via CSV`
    });

    setIsImportModalOpen(false);
    setImportData([]);
    setImportErrors([]);
    alert(`Successfully imported ${importData.length} students.`);
  };

  const handleDownloadDeptReport = (dept: string) => {
    alert(`Generating department-level report for ${dept}... (Mock Download)`);
  };

  // Modal States
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    type?: 'danger' | 'warning';
  } | null>(null);
  const [isSemesterModalOpen, setIsSemesterModalOpen] = useState(false);
  const [isCenterModalOpen, setIsCenterModalOpen] = useState(false);
  const [isProgramModalOpen, setIsProgramModalOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importData, setImportData] = useState<any[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [selectedSectionDetails, setSelectedSectionDetails] = useState<Section | null>(null);
  const [editingCenter, setEditingCenter] = useState<CenterInfo | null>(null);
  const [editingProgram, setEditingProgram] = useState<ProgramInfo | null>(null);
  const [editingBatch, setEditingBatch] = useState<BatchInfo | null>(null);

  // Student Management Filters
  const [filterCenter, setFilterCenter] = useState<Center | 'all'>('all');
  const [filterProgram, setFilterProgram] = useState<ProgramType | 'all'>('all');
  const [filterBatch, setFilterBatch] = useState<string>('all');

  // Form States
  const [userForm, setUserForm] = useState<Partial<User>>({
    fullName: '',
    email: '',
    role: 'student',
    department: 'Computer Science',
    idNumber: '',
    isActive: true,
    programType: programs.length > 0 ? programs[0].programId : 'regular',
    center: centers.length > 0 ? centers[0].centerId : 'main',
    batch: ''
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
    programType: programs.length > 0 ? programs[0].programId : 'regular',
    center: centers.length > 0 ? centers[0].centerId : 'main',
    startDate: '',
    endDate: '',
    schedule: [],
    meetingDates: [],
    midExamDates: [],
    finalExamDates: []
  });

  const [semesterForm, setSemesterForm] = useState<Partial<Semester>>({
    name: '',
    startDate: '',
    endDate: '',
    isActive: false
  });

  const [centerForm, setCenterForm] = useState({ name: '', location: '', description: '' });
  const [programForm, setProgramForm] = useState({ name: '', durationYears: 4, description: '' });
  const [batchForm, setBatchForm] = useState({ name: '', entryYear: '', currentYear: 1, expectedGraduation: '' });

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      updateUser(editingUser.userId, userForm);
      addAuditLog({
        action: 'UPDATE',
        entityType: 'USER',
        entityId: editingUser.userId,
        entityName: userForm.fullName || editingUser.fullName,
        performedBy: currentUser?.fullName || 'Admin',
        details: `Updated user ${userForm.role}`
      });
    } else {
      const newUser: User = {
        ...userForm,
        userId: `user-${Date.now()}`,
        createdAt: new Date().toISOString(),
        isActive: true
      } as User;
      addUser(newUser);
      addAuditLog({
        action: 'CREATE',
        entityType: 'USER',
        entityId: newUser.userId,
        entityName: newUser.fullName,
        performedBy: currentUser?.fullName || 'Admin',
        details: `Created new ${newUser.role}`
      });
    }
    setIsUserModalOpen(false);
    setEditingUser(null);
    setUserForm({ fullName: '', email: '', role: 'student', department: 'Computer Science', idNumber: '', isActive: true });
  };

  const handleDeleteUser = (userId: string) => {
    setConfirmConfig({
      title: 'Delete User',
      message: 'Are you sure you want to delete this user? This action cannot be undone.',
      type: 'danger',
      confirmText: 'Delete User',
      onConfirm: () => {
        const userToDelete = users.find(u => u.userId === userId);
        deleteUser(userId);
        if (userToDelete) {
          addAuditLog({
            action: 'DELETE',
            entityType: 'USER',
            entityId: userId,
            entityName: userToDelete.fullName,
            performedBy: currentUser?.fullName || 'Admin',
            details: `Deleted user ${userToDelete.role}`
          });
        }
        setIsConfirmModalOpen(false);
      }
    });
    setIsConfirmModalOpen(true);
  };

  const handleSaveCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCourse) {
      updateCourse(editingCourse.courseId, courseForm);
      addAuditLog({
        action: 'UPDATE',
        entityType: 'COURSE',
        entityId: editingCourse.courseId,
        entityName: courseForm.title || editingCourse.title,
        performedBy: currentUser?.fullName || 'Admin',
        details: `Updated course ${courseForm.courseCode}`
      });
    } else {
      const newCourse: Course = {
        ...courseForm,
        courseId: `course-${Date.now()}`
      } as Course;
      addCourse(newCourse);
      addAuditLog({
        action: 'CREATE',
        entityType: 'COURSE',
        entityId: newCourse.courseId,
        entityName: newCourse.title,
        performedBy: currentUser?.fullName || 'Admin',
        details: `Created course ${newCourse.courseCode}`
      });
    }
    setIsCourseModalOpen(false);
    setEditingCourse(null);
    setCourseForm({ courseCode: '', title: '', creditHours: 3, department: 'Computer Science' });
  };

  const handleDeleteCourse = (courseId: string) => {
    setConfirmConfig({
      title: 'Delete Course',
      message: 'Are you sure you want to delete this course? All associated sections may be affected.',
      type: 'danger',
      confirmText: 'Delete Course',
      onConfirm: () => {
        const courseToDelete = courses.find(c => c.courseId === courseId);
        deleteCourse(courseId);
        if (courseToDelete) {
          addAuditLog({
            action: 'DELETE',
            entityType: 'COURSE',
            entityId: courseId,
            entityName: courseToDelete.title,
            performedBy: currentUser?.fullName || 'Admin',
            details: `Deleted course ${courseToDelete.courseCode}`
          });
        }
        setIsConfirmModalOpen(false);
      }
    });
    setIsConfirmModalOpen(true);
  };

  const handleSaveSemester = (e: React.FormEvent) => {
    e.preventDefault();
    const newSemester = {
      ...semesterForm,
      semesterId: `sem-${Date.now()}`
    } as Semester;
    
    addSemester(newSemester);
    if (newSemester.isActive) {
      setActiveSemester(newSemester.semesterId);
    }
    
    addAuditLog({
      action: 'CREATE',
      entityType: 'SEMESTER',
      entityId: newSemester.semesterId,
      entityName: newSemester.name,
      performedBy: currentUser?.fullName || 'Admin',
      details: `Created semester (Active: ${newSemester.isActive})`
    });
    
    setIsSemesterModalOpen(false);
    setSemesterForm({ name: '', startDate: '', endDate: '', isActive: false });
  };

  const handleSaveCenter = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCenter) {
      updateCenter(editingCenter.centerId, centerForm);
      addAuditLog({
        action: 'UPDATE',
        entityType: 'CENTER',
        entityId: editingCenter.centerId,
        entityName: centerForm.name,
        performedBy: currentUser?.fullName || 'Admin',
        details: `Updated center ${centerForm.name}`
      });
    } else {
      const newCenter = {
        ...centerForm,
        centerId: centerForm.name.toLowerCase().replace(/\s+/g, '-'),
        createdAt: new Date().toISOString()
      };
      addCenter(newCenter);
      addAuditLog({
        action: 'CREATE',
        entityType: 'CENTER',
        entityId: newCenter.centerId,
        entityName: newCenter.name,
        performedBy: currentUser?.fullName || 'Admin',
        details: `Created center ${newCenter.name}`
      });
    }
    setIsCenterModalOpen(false);
    setCenterForm({ name: '', location: '', description: '' });
    setEditingCenter(null);
  };

  const handleSaveProgram = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProgram) {
      updateProgram(editingProgram.programId, programForm);
      addAuditLog({
        action: 'UPDATE',
        entityType: 'PROGRAM',
        entityId: editingProgram.programId,
        entityName: programForm.name,
        performedBy: currentUser?.fullName || 'Admin',
        details: `Updated program ${programForm.name}`
      });
    } else {
      const newProgram: ProgramInfo = {
        ...programForm,
        programId: `prog-${Date.now()}`,
        createdAt: new Date().toISOString()
      };
      addProgram(newProgram);
      addAuditLog({
        action: 'CREATE',
        entityType: 'PROGRAM',
        entityId: newProgram.programId,
        entityName: newProgram.name,
        performedBy: currentUser?.fullName || 'Admin',
        details: `Created program ${newProgram.name}`
      });
    }
    setIsProgramModalOpen(false);
    setProgramForm({ name: '', durationYears: 4, description: '' });
    setEditingProgram(null);
  };

  const handleDeleteProgram = (programId: string) => {
    setConfirmConfig({
      title: 'Delete Program',
      message: 'Are you sure you want to delete this program? This may affect students and sections assigned to it.',
      type: 'danger',
      confirmText: 'Delete Program',
      onConfirm: () => {
        const programToDelete = programs.find(p => p.programId === programId);
        deleteProgram(programId);
        if (programToDelete) {
          addAuditLog({
            action: 'DELETE',
            entityType: 'PROGRAM',
            entityId: programId,
            entityName: programToDelete.name,
            performedBy: currentUser?.fullName || 'Admin',
            details: `Deleted program ${programToDelete.name}`
          });
        }
      }
    });
    setIsConfirmModalOpen(true);
  };

  const handleSaveBatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingBatch) {
      updateBatch(editingBatch.batchId, batchForm);
      addAuditLog({
        action: 'UPDATE',
        entityType: 'BATCH',
        entityId: editingBatch.batchId,
        entityName: batchForm.name,
        performedBy: currentUser?.fullName || 'Admin',
        details: `Updated batch ${batchForm.name}`
      });
    } else {
      const newBatch: BatchInfo = {
        ...batchForm,
        batchId: `batch-${Date.now()}`,
        createdAt: new Date().toISOString()
      };
      addBatch(newBatch);
      addAuditLog({
        action: 'CREATE',
        entityType: 'BATCH',
        entityId: newBatch.batchId,
        entityName: newBatch.name,
        performedBy: currentUser?.fullName || 'Admin',
        details: `Created batch ${newBatch.name}`
      });
    }
    setIsBatchModalOpen(false);
    setBatchForm({ name: '', entryYear: '', currentYear: 1, expectedGraduation: '' });
    setEditingBatch(null);
  };

  const handleDeleteBatch = (batchId: string) => {
    setConfirmConfig({
      title: 'Delete Batch',
      message: 'Are you sure you want to delete this batch? This may affect students assigned to it.',
      type: 'danger',
      confirmText: 'Delete Batch',
      onConfirm: () => {
        const batchToDelete = batches.find(b => b.batchId === batchId);
        deleteBatch(batchId);
        if (batchToDelete) {
          addAuditLog({
            action: 'DELETE',
            entityType: 'BATCH',
            entityId: batchId,
            entityName: batchToDelete.name,
            performedBy: currentUser?.fullName || 'Admin',
            details: `Deleted batch ${batchToDelete.name}`
          });
        }
      }
    });
    setIsConfirmModalOpen(true);
  };

  const handleSaveSection = (e: React.FormEvent) => {
    e.preventDefault();
    const activeSemester = semesters.find(s => s.isActive);
    if (!activeSemester) {
      alert('Please set an active semester first.');
      return;
    }

    // Uniqueness Check: Prevent duplicate course sections for the same batch EVER (as per requirement: "can't have repetitive Bach if they take before now")
    const existingEntry = sections.find(s => 
      s.courseId === sectionForm.courseId && 
      s.batchId === sectionForm.batchId && 
      s.sectionId !== editingSection?.sectionId
    );

    if (existingEntry) {
      const course = courses.find(c => c.courseId === sectionForm.courseId);
      const batch = batches.find(b => b.batchId === sectionForm.batchId);
      const semester = semesters.find(sem => sem.semesterId === existingEntry.semesterId);
      alert(`Conflict Error: A section for "${course?.title}" and "${batch?.name || 'All Batches'}" was already assigned in ${semester?.name || 'the system'}. Repetitive course assignments for the same batch are prohibited.`);
      return;
    }

    if (editingSection) {
      updateSection(editingSection.sectionId, sectionForm);

      addAuditLog({
        action: 'UPDATE',
        entityType: 'SECTION',
        entityId: editingSection.sectionId,
        entityName: sectionForm.room || editingSection.room,
        performedBy: currentUser?.fullName || 'Admin',
        details: `Updated section for course ${sectionForm.courseId}`
      });
    } else {
      const newSection: Section = {
        ...sectionForm,
        sectionId: `section-${Date.now()}`,
        semesterId: activeSemester.semesterId,
        geofenceCenter: { latitude: 0, longitude: 0 }, // Default, instructor sets this
        geofenceRadius: 50
      } as Section;
      addSection(newSection);
      
      addAuditLog({
        action: 'CREATE',
        entityType: 'SECTION',
        entityId: newSection.sectionId,
        entityName: newSection.room,
        performedBy: currentUser?.fullName || 'Admin',
        details: `Created section for course ${newSection.courseId}`
      });
    }
    setIsSectionModalOpen(false);
    setEditingSection(null);
    setSectionForm({ courseId: '', instructorId: '', room: '', programType: programs.length > 0 ? programs[0].programId : 'regular', center: centers.length > 0 ? centers[0].centerId : 'main', startDate: '', endDate: '', schedule: [] });
  };

  const handleDeleteCenter = (centerId: string) => {
    setConfirmConfig({
      title: 'Delete Center',
      message: 'Are you sure you want to delete this center? This may affect students and sections assigned to it.',
      type: 'danger',
      confirmText: 'Delete Center',
      onConfirm: () => {
        const centerToDelete = centers.find(c => c.centerId === centerId);
        deleteCenter(centerId);
        if (centerToDelete) {
          addAuditLog({
            action: 'DELETE',
            entityType: 'CENTER',
            entityId: centerId,
            entityName: centerToDelete.name,
            performedBy: currentUser?.fullName || 'Admin',
            details: `Deleted center ${centerToDelete.name}`
          });
        }
        setIsConfirmModalOpen(false);
      }
    });
    setIsConfirmModalOpen(true);
  };

  const handleDeleteSection = (sectionId: string) => {
    setConfirmConfig({
      title: 'Delete Section Assignment',
      message: 'Are you sure you want to delete this section assignment?',
      type: 'danger',
      confirmText: 'Delete Assignment',
      onConfirm: () => {
        const sectionToDelete = sections.find(s => s.sectionId === sectionId);
        deleteSection(sectionId);
        if (sectionToDelete) {
          addAuditLog({
            action: 'DELETE',
            entityType: 'SECTION',
            entityId: sectionId,
            entityName: sectionToDelete.room,
            performedBy: currentUser?.fullName || 'Admin',
            details: `Deleted section for course ${sectionToDelete.courseId}`
          });
        }
        setIsConfirmModalOpen(false);
      }
    });
    setIsConfirmModalOpen(true);
  };

  const filteredStaff = users.filter(u => 
    u.role !== 'student' && (
      u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.idNumber?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const filteredStudents = users.filter(u => 
    u.role === 'student' && 
    (filterCenter === 'all' || u.center === filterCenter) &&
    (filterProgram === 'all' || u.programType === filterProgram) &&
    (filterBatch === 'all' || u.batch === filterBatch) &&
    (
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

  const COLORS = ['var(--primary)', '#005696', '#6B7280', '#E5E7EB'];

  return (
    <div className="w-full space-y-6 md:space-y-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-4 md:gap-6">
        <div className="text-left">
          <p className="hu-label">Administrative Portal</p>
          <h1 className="text-2xl md:text-4xl font-serif font-bold text-brand-text tracking-tight transition-colors">
            System <span className="text-brand-muted/40 italic">Architecture</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          {/* Removed internal tab buttons */}
        </div>
      </div>

      {view === 'overview' && (
        <>
          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {[
              { label: 'Total Users', value: users.length, icon: Users, color: 'text-brand-primary', bg: 'bg-brand-primary/10' },
              { label: 'Active Courses', value: courses.length, icon: BookOpen, color: 'text-brand-primary', bg: 'bg-brand-primary/10' },
              { label: 'Total Sections', value: sections.length, icon: Database, color: 'text-brand-primary', bg: 'bg-brand-primary/10' },
              { label: 'System Status', value: 'Operational', icon: ShieldCheck, color: 'text-brand-primary', bg: 'bg-brand-primary/10' }
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="hu-card p-4 md:p-6 flex flex-col items-center justify-center text-center"
              >
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-3 shadow-inner", stat.bg, stat.color)}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <p className="hu-label mb-1 font-bold text-[9px] uppercase tracking-widest">{stat.label}</p>
                <p className={cn("text-xl md:text-2xl font-serif font-bold", stat.label === 'System Status' ? 'text-brand-primary' : 'text-brand-text')}>
                  {stat.value}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Visual Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
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
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: 'var(--text-dim)' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: 'var(--text-dim)' }} />
                  <Tooltip 
                    cursor={{ fill: 'var(--primary-light)' }}
                    contentStyle={{ 
                      borderRadius: '16px', 
                      border: 'none', 
                      boxShadow: 'var(--chart-tooltip-shadow)', 
                      fontSize: '12px', 
                      fontWeight: 700,
                      backgroundColor: 'var(--surface)',
                      color: 'var(--text-main)'
                    }}
                  />
                  <Bar dataKey="value" fill="var(--primary)" radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </AnalyticsCard>
          </div>

          {/* Quick Actions Grid */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {[
              { title: 'Course Catalog', desc: 'Architect the academic curriculum and course structures.', icon: BookOpen, color: 'text-brand-primary', bg: 'bg-brand-primary/10', path: '/admin/courses' },
              { title: 'Section Assignments', desc: 'Assign courses to instructors and set schedules.', icon: LayoutDashboard, color: 'text-brand-primary', bg: 'bg-brand-primary/10', path: '/admin/sections' },
              { title: 'Batch Management', desc: 'Manage student cohorts, entries, and graduations.', icon: Users, color: 'text-brand-primary', bg: 'bg-brand-primary/10', path: '/admin/batches' },
              { title: 'Program Types', desc: 'Define regular, extension, and summer program structures.', icon: Layers, color: 'text-brand-primary', bg: 'bg-brand-primary/10', path: '/admin/programs' },
              { title: 'Center Management', desc: 'Manage university campuses and teaching centers.', icon: MapPin, color: 'text-brand-primary', bg: 'bg-brand-primary/10', path: '/admin/centers' },
              { title: 'Staff Management', desc: 'Manage instructors and administrative staff.', icon: Briefcase, color: 'text-brand-primary', bg: 'bg-brand-primary/10', path: '/admin/staff' },
              { title: 'Student Management', desc: 'Manage student enrollment and records.', icon: GraduationCap, color: 'text-brand-primary', bg: 'bg-brand-primary/10', path: '/admin/students' },
              { title: 'Audit Trail', desc: 'Review system activity and administrative logs.', icon: ShieldCheck, color: 'text-brand-primary', bg: 'bg-brand-primary/10', path: '/admin/audit' },
              { title: 'System Backup', desc: 'Securely archive all system data and configurations.', icon: Database, color: 'text-brand-primary', bg: 'bg-brand-primary/10', action: handleBackup }
            ].map((action) => (
              <div key={action.title} className="hu-card-alt p-4 md:p-8 flex flex-col h-full space-y-6">
                <div className="flex items-center gap-4">
                  <div className={cn("w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center shadow-inner", action.bg, action.color)}>
                    <action.icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-serif font-bold text-lg md:text-xl text-brand-text">{action.title}</h3>
                </div>
                <p className="flex-1 text-xs md:text-sm text-brand-muted font-medium leading-relaxed">{action.desc}</p>
                <button 
                  onClick={() => action.path ? navigate(action.path) : action.action?.()}
                  className="w-full py-3 bg-brand-primary/10 hover:bg-brand-primary hover:text-white dark:hover:text-hu-charcoal text-brand-primary rounded-xl font-bold text-[10px] uppercase tracking-[0.2em] transition-all duration-300"
                >
                  {action.action ? 'Execute Backup' : `Manage ${action.title.split(' ')[0]}`}
                </button>
              </div>
            ))}
          </section>

          {/* Department Reports Section */}
          <section className="space-y-6 md:space-y-8">
            <div className="flex items-center gap-4">
              <FileText className="w-6 h-6 text-brand-primary" />
              <h2 className="text-2xl md:text-3xl font-serif font-bold text-brand-text">Departmental Reports</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {['Computer Science', 'Information Systems', 'Software Engineering', 'IT Management'].map((dept) => (
                <div key={dept} className="hu-card-alt p-5 md:p-6 flex items-center justify-between group hover:bg-brand-surface transition-all">
                  <div>
                    <p className="text-sm font-bold text-brand-text">{dept}</p>
                    <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest mt-1">Attendance Summary</p>
                  </div>
                  <button 
                    onClick={() => handleDownloadDeptReport(dept)}
                    className="p-3 bg-hu-cream rounded-xl text-brand-primary hover:bg-brand-primary hover:text-white dark:text-hu-charcoal transition-all shadow-sm"
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
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-brand-text transition-colors">
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
                  className="w-full pl-12 pr-6 py-3 bg-brand-primary/5 border-none rounded-xl text-xs font-bold text-brand-text focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all"
                />
              </div>
              <button 
                onClick={() => {
                  setEditingUser(null);
                  setUserForm({ fullName: '', email: '', role: view === 'staff' ? 'instructor' : 'student', department: 'Computer Science', idNumber: '', isActive: true, batch: '' });
                  setIsUserModalOpen(true);
                }}
                className="hu-button-rounded flex items-center gap-3"
              >
                <Plus className="w-5 h-5" />
                <span className="text-xs uppercase tracking-widest">Add {view === 'staff' ? 'Staff' : 'Student'}</span>
              </button>
            </div>
          </div>

          {view === 'students' && (
            <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6">
              <div className="hu-card-alt p-6 bg-brand-primary/5">
                <p className="text-[10px] font-bold text-brand-primary uppercase tracking-widest">Total Students</p>
                <p className="text-3xl font-serif font-bold text-brand-text mt-2">{filteredStudents.length}</p>
                <p className="text-xs text-brand-muted mt-1">In current filter</p>
              </div>
              <div className="hu-card-alt p-6 bg-brand-primary/5">
                <p className="text-[10px] font-bold text-brand-primary uppercase tracking-widest">Active Status</p>
                <p className="text-3xl font-serif font-bold text-brand-text mt-2">
                  {filteredStudents.filter(s => s.isActive).length}
                </p>
                <p className="text-xs text-brand-muted mt-1">Currently enrolled</p>
              </div>
              <div className="hu-card-alt p-6 bg-brand-primary/5">
                <p className="text-[10px] font-bold text-brand-muted uppercase tracking-widest">Selected Context</p>
                <p className="text-sm font-bold text-brand-text mt-2 capitalize">
                  {filterCenter === 'all' ? 'All Centers' : filterCenter} • {filterProgram === 'all' ? 'All Programs' : filterProgram}
                </p>
                <p className="text-xs text-brand-muted mt-1">Batch: {filterBatch === 'all' ? 'All' : filterBatch}</p>
              </div>
            </div>
          )}

          {view === 'students' && (
            <div className="flex flex-wrap items-center gap-4 p-6 bg-brand-bg rounded-[24px]">
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-bold uppercase tracking-widest text-gray-400 ml-1">Center</label>
                <select 
                  value={filterCenter}
                  onChange={(e) => setFilterCenter(e.target.value as any)}
                  className="px-4 py-2 bg-brand-bg dark:bg-brand-surface border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-hu-gold/20 outline-none transition-all shadow-sm"
                >
                  <option value="all">All Centers</option>
                  {centers.map(c => (
                    <option key={c.centerId} value={c.centerId}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-bold uppercase tracking-widest text-gray-400 ml-1">Program</label>
                <select 
                  value={filterProgram}
                  onChange={(e) => setFilterProgram(e.target.value as any)}
                  className="px-4 py-2 bg-brand-bg dark:bg-brand-surface border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-hu-gold/20 outline-none transition-all shadow-sm"
                >
                  <option value="all">All Programs</option>
                  {programs.map(p => (
                    <option key={p.programId} value={p.programId}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-bold uppercase tracking-widest text-gray-400 ml-1">Batch</label>
                <select 
                  value={filterBatch}
                  onChange={(e) => setFilterBatch(e.target.value)}
                  className="px-4 py-2 bg-brand-bg dark:bg-brand-surface border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-hu-gold/20 outline-none transition-all shadow-sm"
                >
                  <option value="all">All Batches</option>
                  {batches.map(b => (
                    <option key={b.batchId} value={b.batchId}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div className="ml-auto flex items-center gap-3">
                <button 
                  onClick={() => setIsImportModalOpen(true)}
                  className="px-4 py-2 bg-white text-hu-charcoal rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-hu-gold transition-all shadow-md flex items-center gap-2"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Import Students
                </button>
                <button className="px-4 py-2 bg-hu-cream text-brand-primary rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-brand-primary hover:text-white dark:text-hu-charcoal transition-all shadow-sm">
                  Export List
                </button>
              </div>
            </div>
          )}

          <div className="hu-card-alt overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[800px]">
                <thead>
                  <tr className="bg-brand-surface">
                    <th className="px-4 py-4 md:px-8 md:py-6 text-[11px] uppercase tracking-[0.2em] font-bold text-brand-muted whitespace-nowrap">User</th>
                    <th className="px-4 py-4 md:px-8 md:py-6 text-[11px] uppercase tracking-[0.2em] font-bold text-brand-muted whitespace-nowrap">
                      {view === 'staff' ? 'Role' : 'Program & Center'}
                    </th>
                    <th className="px-8 py-6 text-[11px] uppercase tracking-[0.2em] font-bold text-brand-muted whitespace-nowrap">
                      {view === 'staff' ? 'Department' : 'Batch'}
                    </th>
                    <th className="px-8 py-6 text-[11px] uppercase tracking-[0.2em] font-bold text-brand-muted whitespace-nowrap">Status</th>
                    <th className="px-8 py-6 text-[11px] uppercase tracking-[0.2em] font-bold text-brand-muted whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border">
                  {(view === 'staff' ? filteredStaff : filteredStudents).map((u, i) => (
                    <motion.tr 
                      key={u.userId}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="hover:bg-hu-cream/10 transition-colors group"
                    >
                      <td className="px-8 py-6 whitespace-nowrap">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-brand-primary/10 rounded-xl flex items-center justify-center text-brand-primary font-bold text-xs shadow-sm">
                            {u.fullName.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-brand-text transition-colors">{u.fullName}</p>
                            <div className="flex items-center gap-2">
                              <p className="text-[10px] font-medium text-brand-muted transition-colors">{u.email}</p>
                              {u.idNumber && (
                                <>
                                  <span className="text-brand-muted/20 transition-colors">•</span>
                                  <p className="text-[10px] font-bold text-brand-primary font-mono transition-colors">{u.idNumber}</p>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        {view === 'staff' ? (
                          <span className="px-4 py-1.5 bg-brand-primary/10 text-brand-text rounded-full text-[10px] font-bold uppercase tracking-widest border border-brand-primary/10">
                            {u.role}
                          </span>
                        ) : (
                          <div className="flex flex-col gap-1">
                            <span className={cn(
                              "px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-widest w-fit",
                              programs.find(p => p.programId === u.programType)?.name.toLowerCase() === 'regular' ? 'bg-brand-primary/10 text-brand-primary' : 'bg-hu-gold/10 text-hu-gold'
                            )}>
                              {programs.find(p => p.programId === u.programType)?.name || u.programType}
                            </span>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                              {centers.find(c => c.centerId === u.center)?.name || u.center}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        {view === 'staff' ? (
                          <p className="text-sm font-medium text-gray-400">{u.department}</p>
                        ) : (
                          <p className="text-sm font-bold text-brand-text">{batches.find(b => b.batchId === u.batch)?.name || u.batch || 'N/A'}</p>
                        )}
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <span className="flex items-center gap-2 text-[10px] font-bold text-brand-primary uppercase tracking-widest transition-colors">
                          <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", u.isActive ? "bg-brand-primary" : "bg-red-500")} />
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
                            className="p-2 text-gray-300 hover:text-hu-gold transition-colors"
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
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-brand-text">Course Catalog</h2>
            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                <input
                  type="text"
                  placeholder="Search courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-6 py-3 bg-hu-cream/30 border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-hu-gold/20 outline-none transition-all"
                />
              </div>
              <button 
                onClick={() => {
                  setEditingCourse(null);
                  setCourseForm({ courseCode: '', title: '', creditHours: 3, department: 'Computer Science' });
                  setIsCourseModalOpen(true);
                }}
                className="hu-button-rounded flex items-center gap-3"
              >
                <Plus className="w-5 h-5" />
                <span className="text-xs uppercase tracking-widest">Add Course</span>
              </button>
            </div>
          </div>

          <div className="hu-card-alt overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[800px]">
                <thead>
                  <tr className="bg-brand-surface">
                    <th className="px-8 py-6 text-[11px] uppercase tracking-[0.2em] font-bold text-brand-muted whitespace-nowrap">Course Code</th>
                    <th className="px-8 py-6 text-[11px] uppercase tracking-[0.2em] font-bold text-brand-muted whitespace-nowrap">Title</th>
                    <th className="px-8 py-6 text-[11px] uppercase tracking-[0.2em] font-bold text-brand-muted whitespace-nowrap">Credit Hours</th>
                    <th className="px-8 py-6 text-[11px] uppercase tracking-[0.2em] font-bold text-brand-muted whitespace-nowrap">Department</th>
                    <th className="px-8 py-6 text-[11px] uppercase tracking-[0.2em] font-bold text-brand-muted whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border">
                  {filteredCourses.map((c, i) => (
                    <motion.tr 
                      key={c.courseId}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="hover:bg-hu-cream/10 transition-colors group"
                    >
                      <td className="px-8 py-6 text-sm font-bold text-brand-primary font-mono whitespace-nowrap">{c.courseCode}</td>
                      <td className="px-8 py-6 text-sm font-bold text-brand-text whitespace-nowrap">{c.title}</td>
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
                            className="p-2 text-gray-300 hover:text-hu-gold transition-colors"
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

      {view === 'centers' && (
        <section className="space-y-6 md:space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-brand-text">University Centers</h2>
            <button 
              onClick={() => {
                setEditingCenter(null);
                setCenterForm({ name: '', location: '', description: '' });
                setIsCenterModalOpen(true);
              }}
              className="hu-button-rounded flex items-center gap-3"
            >
              <Plus className="w-5 h-5" />
              <span className="text-xs uppercase tracking-widest">Add Center</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {centers.map((center, i) => (
              <motion.div
                key={center.centerId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="hu-card group p-5 md:p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-brand-primary/10 rounded-xl flex items-center justify-center text-brand-primary group-hover:bg-brand-primary group-hover:text-white dark:hover:text-hu-charcoal transition-all duration-300">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => {
                        setEditingCenter(center);
                        setCenterForm({ name: center.name, location: center.location || '', description: center.description || '' });
                        setIsCenterModalOpen(true);
                      }}
                      className="p-2 text-gray-300 hover:text-hu-gold transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteCenter(center.centerId)}
                      className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-brand-text mb-1">{center.name}</h3>
                <p className="text-xs font-bold text-brand-primary uppercase tracking-widest mb-4">{center.location || 'No Location Set'}</p>
                <p className="text-sm text-brand-muted line-clamp-2 mb-6">{center.description || 'No description provided.'}</p>
                
                <div className="pt-6 border-t border-brand-border flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-widest font-bold text-brand-muted/40">Created At</span>
                    <span className="text-xs font-bold text-brand-text">{new Date(center.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex flex-col md:items-end">
                    <span className="text-[10px] uppercase tracking-widest font-bold text-brand-muted/40">ID</span>
                    <span className="text-xs font-mono font-bold text-brand-primary">{center.centerId}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {view === 'programs' && (
        <section className="space-y-6 md:space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-brand-text transition-colors">Academic Programs</h2>
            <button 
              onClick={() => {
                setEditingProgram(null);
                setProgramForm({ name: '', durationYears: 4, description: '' });
                setIsProgramModalOpen(true);
              }}
              className="hu-button-rounded flex items-center gap-3"
            >
              <Plus className="w-5 h-5" />
              <span className="text-xs uppercase tracking-widest">Add Program</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {programs.map((program, i) => (
              <motion.div
                key={program.programId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="hu-card group p-5 md:p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-brand-primary/10 rounded-xl flex items-center justify-center text-brand-primary group-hover:bg-brand-primary group-hover:text-white dark:hover:text-hu-charcoal transition-all duration-300">
                    <Layers className="w-6 h-6" />
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => {
                        setEditingProgram(program);
                        setProgramForm({ name: program.name, durationYears: program.durationYears, description: program.description || '' });
                        setIsProgramModalOpen(true);
                      }}
                      className="p-2 text-gray-300 hover:text-hu-gold transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteProgram(program.programId)}
                      className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-brand-text mb-1">{program.name}</h3>
                <p className="text-xs font-bold text-brand-primary uppercase tracking-widest mb-4">{program.durationYears} Years Duration</p>
                <p className="text-sm text-brand-muted line-clamp-2 mb-6">{program.description || 'No description provided.'}</p>
                
                <div className="pt-6 border-t border-brand-border flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-widest font-bold text-brand-muted/40">Created At</span>
                    <span className="text-xs font-bold text-brand-text">{new Date(program.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex flex-col md:items-end">
                    <span className="text-[10px] uppercase tracking-widest font-bold text-brand-muted/40">ID</span>
                    <span className="text-xs font-mono font-bold text-brand-primary">{program.programId}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {view === 'batches' && (
        <section className="space-y-6 md:space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-brand-text transition-colors">Student Batches</h2>
            <button 
              onClick={() => {
                setEditingBatch(null);
                setBatchForm({ name: '', entryYear: '', currentYear: 1, expectedGraduation: '' });
                setIsBatchModalOpen(true);
              }}
              className="hu-button-rounded flex items-center gap-3"
            >
              <Plus className="w-5 h-5" />
              <span className="text-xs uppercase tracking-widest">Add Batch</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {batches.map((batch, i) => (
              <motion.div
                key={batch.batchId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="hu-card group p-5 md:p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-brand-primary/10 rounded-xl flex items-center justify-center text-brand-primary group-hover:bg-brand-primary group-hover:text-white dark:hover:text-hu-charcoal transition-all duration-300">
                    <Users className="w-6 h-6" />
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => {
                        setEditingBatch(batch);
                        setBatchForm({ name: batch.name, entryYear: batch.entryYear, currentYear: batch.currentYear, expectedGraduation: batch.expectedGraduation });
                        setIsBatchModalOpen(true);
                      }}
                      className="p-2 text-gray-300 hover:text-hu-gold transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteBatch(batch.batchId)}
                      className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <h3 className="text-xl font-serif font-bold text-brand-text mb-1">{batch.name}</h3>
                <p className="text-xs font-bold text-brand-primary uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Clock className="w-3 h-3" />
                  Academic Year {batch.currentYear}
                </p>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-brand-primary/5 rounded-xl p-3">
                    <span className="text-[10px] uppercase tracking-widest font-bold text-brand-primary block mb-1">Entry Year</span>
                    <span className="text-sm font-bold text-brand-text">{batch.entryYear}</span>
                  </div>
                  <div className="bg-brand-primary/5 rounded-xl p-3">
                    <span className="text-[10px] uppercase tracking-widest font-bold text-brand-primary block mb-1">Graduation</span>
                    <span className="text-sm font-bold text-brand-text">{batch.expectedGraduation}</span>
                  </div>
                </div>
                
                <div className="pt-6 border-t border-brand-border flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-widest font-bold text-brand-muted/40">Created At</span>
                    <span className="text-xs font-bold text-brand-text">{new Date(batch.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex flex-col md:items-end">
                    <span className="text-[10px] uppercase tracking-widest font-bold text-brand-muted/40">ID</span>
                    <span className="text-xs font-mono font-bold text-brand-primary">{batch.batchId}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {view === 'semesters' && (
        <section className="space-y-6 md:space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-brand-text transition-colors">Academic Semesters</h2>
            <button 
              onClick={() => setIsSemesterModalOpen(true)}
              className="hu-button-rounded flex items-center gap-3"
            >
              <Plus className="w-5 h-5" />
              <span className="text-xs uppercase tracking-widest">Add Semester</span>
            </button>
          </div>

          <div className="hu-card-alt overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[800px]">
                <thead>
                  <tr className="bg-brand-surface">
                    <th className="px-8 py-6 text-[11px] uppercase tracking-[0.2em] font-bold text-brand-muted whitespace-nowrap">Name</th>
                    <th className="px-8 py-6 text-[11px] uppercase tracking-[0.2em] font-bold text-brand-muted whitespace-nowrap">Start Date</th>
                    <th className="px-8 py-6 text-[11px] uppercase tracking-[0.2em] font-bold text-brand-muted whitespace-nowrap">End Date</th>
                    <th className="px-8 py-6 text-[11px] uppercase tracking-[0.2em] font-bold text-brand-muted whitespace-nowrap">Status</th>
                    <th className="px-8 py-6 text-[11px] uppercase tracking-[0.2em] font-bold text-brand-muted whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border">
                  {semesters.map((s, i) => (
                    <motion.tr 
                      key={s.semesterId}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="hover:bg-hu-cream/10 transition-colors group"
                    >
                      <td className="px-8 py-6 text-sm font-bold text-brand-text transition-colors whitespace-nowrap">{s.name}</td>
                      <td className="px-8 py-6 text-sm font-medium text-brand-muted transition-colors whitespace-nowrap">{s.startDate}</td>
                      <td className="px-8 py-6 text-sm font-medium text-brand-muted transition-colors whitespace-nowrap">{s.endDate}</td>
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
                              setConfirmConfig({
                                title: 'Change Active Semester',
                                message: 'Warning: This will archive all current active sections and update the default view for all Instructors and Students. Proceed?',
                                type: 'warning',
                                confirmText: 'Set Active',
                                onConfirm: () => {
                                  setActiveSemester(s.semesterId);
                                  setIsConfirmModalOpen(false);
                                }
                              });
                              setIsConfirmModalOpen(true);
                            }}
                            className="text-xs font-bold text-hu-gold hover:text-brand-primary uppercase tracking-widest transition-colors"
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

      {view === 'audit' && (
        <section className="space-y-6 md:space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-brand-text transition-colors">Audit Trail</h2>
          </div>

          <div className="hu-card-alt overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[800px]">
                <thead>
                  <tr className="bg-brand-surface">
                    <th className="px-8 py-6 text-[11px] uppercase tracking-[0.2em] font-bold text-brand-muted whitespace-nowrap">Timestamp</th>
                    <th className="px-8 py-6 text-[11px] uppercase tracking-[0.2em] font-bold text-brand-muted whitespace-nowrap">Action</th>
                    <th className="px-8 py-6 text-[11px] uppercase tracking-[0.2em] font-bold text-brand-muted whitespace-nowrap">Entity Type</th>
                    <th className="px-8 py-6 text-[11px] uppercase tracking-[0.2em] font-bold text-brand-muted whitespace-nowrap">Entity Name</th>
                    <th className="px-8 py-6 text-[11px] uppercase tracking-[0.2em] font-bold text-brand-muted whitespace-nowrap">Performed By</th>
                    <th className="px-8 py-6 text-[11px] uppercase tracking-[0.2em] font-bold text-brand-muted whitespace-nowrap">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border">
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-8 py-12 text-center text-sm font-medium text-gray-400">
                        No audit logs available.
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map((log, i) => (
                      <motion.tr 
                        key={log.logId}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="hover:bg-hu-cream/10 transition-colors group"
                      >
                        <td className="px-8 py-6 text-sm font-medium text-gray-400 whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap">
                          <span className={cn(
                            "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest",
                            log.action === 'CREATE' ? 'bg-green-100 text-green-700' :
                            log.action === 'UPDATE' ? 'bg-blue-100 text-blue-700' :
                            'bg-red-100 text-red-700'
                          )}>
                            {log.action}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-sm font-bold text-brand-text whitespace-nowrap">{log.entityType}</td>
                        <td className="px-8 py-6 text-sm font-bold text-brand-primary whitespace-nowrap">{log.entityName}</td>
                        <td className="px-8 py-6 text-sm font-medium text-gray-500 whitespace-nowrap">{log.performedBy}</td>
                        <td className="px-8 py-6 text-sm font-medium text-gray-400">{log.details}</td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {view === 'sections' && (
        <section className="space-y-6 md:space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-brand-text">Section Assignments</h2>
            <button 
              onClick={() => {
                setEditingSection(null);
                setSectionForm({ courseId: '', instructorId: '', room: '', programType: programs.length > 0 ? programs[0].programId : 'regular', center: centers.length > 0 ? centers[0].centerId : 'main', startDate: '', endDate: '', schedule: [] });
                setIsSectionModalOpen(true);
              }}
              className="hu-button-rounded flex items-center gap-3"
            >
              <Plus className="w-5 h-5" />
              <span className="text-xs uppercase tracking-widest">Assign Section</span>
            </button>
          </div>

          <div className="hu-card-alt overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[800px]">
                <thead>
                  <tr className="bg-brand-surface">
                    <th className="px-8 py-6 text-[11px] uppercase tracking-[0.2em] font-bold text-brand-muted whitespace-nowrap">Section</th>
                    <th className="px-8 py-6 text-[11px] uppercase tracking-[0.2em] font-bold text-brand-muted whitespace-nowrap">Program & Center</th>
                    <th className="px-8 py-6 text-[11px] uppercase tracking-[0.2em] font-bold text-brand-muted whitespace-nowrap">Course Details</th>
                    <th className="px-8 py-6 text-[11px] uppercase tracking-[0.2em] font-bold text-brand-muted whitespace-nowrap">Instructor</th>
                    <th className="px-8 py-6 text-[11px] uppercase tracking-[0.2em] font-bold text-brand-muted whitespace-nowrap">Room</th>
                    <th className="px-8 py-6 text-[11px] uppercase tracking-[0.2em] font-bold text-brand-muted whitespace-nowrap">Schedule</th>
                    <th className="px-8 py-6 text-[11px] uppercase tracking-[0.2em] font-bold text-brand-muted whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border">
                  {sections.map((s, i) => {
                    const course = courses.find(c => c.courseId === s.courseId);
                    const instructor = users.find(u => u.userId === s.instructorId);
                    return (
                      <motion.tr 
                        key={s.sectionId}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="hover:bg-hu-cream/10 transition-colors group"
                      >
                        <td className="px-8 py-6 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">ID: {s.sectionId.split('-')[1] || s.sectionId}</span>
                            <span className="text-sm font-bold text-brand-text mt-1">Section {s.sectionId.split('-')[1] || s.sectionId}</span>
                          </div>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap">
                          <div className="flex flex-col gap-1">
                            <span className={cn(
                              "px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-widest w-fit",
                              programs.find(p => p.programId === s.programType)?.name.toLowerCase() === 'regular' ? 'bg-brand-primary/10 text-brand-primary' : 'bg-hu-gold/10 text-hu-gold'
                            )}>
                              {programs.find(p => p.programId === s.programType)?.name || s.programType}
                            </span>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                              {centers.find(c => c.centerId === s.center)?.name || s.center}
                            </span>
                          </div>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap">
                          <p className="text-sm font-bold text-brand-text">{course?.courseCode || 'N/A'}</p>
                          <p className="text-xs text-gray-400 mt-1 font-medium italic">{course?.title || 'Course title not found'}</p>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap">
                          <p className="text-sm font-bold text-brand-text">{instructor?.fullName || 'Unassigned'}</p>
                          <p className="text-[10px] text-gray-400 mt-1 font-medium uppercase tracking-widest">{instructor?.userId || 'No Instructor ID'}</p>
                        </td>
                        <td className="px-8 py-6 text-sm font-medium text-gray-400 whitespace-nowrap">{s.room}</td>
                        <td className="px-8 py-6 text-sm font-medium text-gray-400 whitespace-nowrap">
                          {s.schedule.map((sch, idx) => (
                            <div key={idx}>{sch.dayOfWeek} • {sch.startTime} - {sch.endTime}</div>
                          ))}
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap">
                          <div className="flex items-center gap-4">
                            <button 
                              onClick={() => {
                                setSelectedSectionDetails(s);
                                setIsDetailsModalOpen(true);
                              }}
                              className="p-2 text-gray-300 hover:text-brand-primary transition-colors"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => {
                                setEditingSection(s);
                                setSectionForm(s);
                                setIsSectionModalOpen(true);
                              }}
                              className="p-2 text-gray-300 hover:text-hu-gold transition-colors"
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
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-brand-text">System Configuration</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-8">
            {/* Academic Terms */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-brand-primary" />
                  <h3 className="text-base md:text-lg font-bold text-brand-text">Academic Terms</h3>
                </div>
                <button 
                  onClick={() => {
                    setSemesterForm({ name: '', startDate: '', endDate: '', isActive: false });
                    setIsSemesterModalOpen(true);
                  }}
                  className="px-4 py-2 bg-brand-primary/10 text-brand-primary rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-brand-primary hover:text-white  transition-all"
                >
                  + Add Term
                </button>
              </div>
              <div className="hu-card-alt p-4 md:p-6 space-y-6">
                <div className="space-y-4">
                  {semesters.length > 0 ? semesters.map((sem) => (
                    <div 
                      key={sem.semesterId} 
                      className={cn(
                        "flex justify-between items-center p-5 rounded-xl transition-all border",
                        sem.isActive 
                          ? "bg-brand-primary/5 border-brand-primary/20" 
                          : "bg-brand-bg border-brand-border opacity-70"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center",
                          sem.isActive ? "bg-brand-primary text-white dark:text-hu-charcoal" : "bg-white text-gray-400 shadow-sm"
                        )}>
                          <Calendar className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-brand-text">{sem.name}</p>
                          <p className="text-[10px] text-gray-400 font-medium">
                            {new Date(sem.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} - {new Date(sem.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {sem.isActive ? (
                          <span className="px-3 py-1 bg-brand-primary text-white dark:text-hu-charcoal rounded-full text-[9px] font-bold uppercase tracking-widest shadow-sm">Active</span>
                        ) : (
                          <button 
                            onClick={() => {
                              setConfirmConfig({
                                title: 'Activate Semester',
                                message: `Are you sure you want to set "${sem.name}" as the active semester? This will deactivate the current one.`,
                                type: 'warning',
                                confirmText: 'Activate',
                                onConfirm: () => {
                                  setActiveSemester(sem.semesterId);
                                  setIsConfirmModalOpen(false);
                                  addAuditLog({
                                    action: 'UPDATE',
                                    entityType: 'SEMESTER',
                                    entityId: sem.semesterId,
                                    entityName: sem.name,
                                    performedBy: currentUser?.fullName || 'Admin',
                                    details: `Activated semester ${sem.name}`
                                  });
                                }
                              });
                              setIsConfirmModalOpen(true);
                            }}
                            className="px-3 py-1 bg-white text-gray-400 border border-brand-border rounded-full text-[9px] font-bold uppercase tracking-widest hover:bg-brand-primary hover:text-white dark:text-hu-charcoal hover:border-brand-primary transition-all"
                          >
                            Activate
                          </button>
                        )}
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-8 border-2 border-dashed border-brand-border rounded-xl">
                      <p className="text-xs text-gray-400 font-medium italic">No academic terms configured yet.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Attendance Policies */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-brand-primary" />
                <h3 className="text-lg font-bold text-brand-text">Attendance Policies</h3>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Regular Program Policy */}
                <div className="hu-card-alt p-4 md:p-6 space-y-6">
                  <div className="flex items-center justify-between border-b border-brand-border pb-4">
                    <h4 className="font-serif font-bold text-brand-primary">Regular Program</h4>
                    <span className="px-2 py-0.5 bg-brand-primary/10 text-brand-primary text-[9px] font-bold uppercase tracking-widest rounded-md">Standard</span>
                  </div>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-brand-text">Threshold</p>
                        <p className="text-[10px] text-gray-400">Exam eligibility.</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="number" defaultValue={80} className="w-14 px-2 py-1.5 bg-brand-bg rounded-lg text-xs font-bold text-center outline-none" />
                        <span className="text-xs font-bold text-brand-text">%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-brand-text">Geofence</p>
                        <p className="text-[10px] text-gray-400">Radius in meters.</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="number" defaultValue={50} className="w-14 px-2 py-1.5 bg-brand-bg rounded-lg text-xs font-bold text-center outline-none" />
                        <span className="text-xs font-bold text-brand-text">m</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-brand-text">Token Expiry</p>
                        <p className="text-[10px] text-gray-400">Minutes.</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="number" defaultValue={15} className="w-14 px-2 py-1.5 bg-brand-bg rounded-lg text-xs font-bold text-center outline-none" />
                        <span className="text-xs font-bold text-brand-text">min</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Extension Program Policy */}
                <div className="hu-card-alt p-4 md:p-6 space-y-6">
                  <div className="flex items-center justify-between border-b border-brand-border pb-4">
                    <h4 className="font-serif font-bold text-hu-gold">Extension Program</h4>
                    <span className="px-2 py-0.5 bg-hu-gold/10 text-hu-gold text-[9px] font-bold uppercase tracking-widest rounded-md">Weekend</span>
                  </div>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-brand-text">Threshold</p>
                        <p className="text-[10px] text-gray-400">Exam eligibility.</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="number" defaultValue={75} className="w-14 px-2 py-1.5 bg-brand-bg rounded-lg text-xs font-bold text-center outline-none" />
                        <span className="text-xs font-bold text-brand-text">%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-brand-text">Geofence</p>
                        <p className="text-[10px] text-gray-400">Radius in meters.</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="number" defaultValue={100} className="w-14 px-2 py-1.5 bg-brand-bg rounded-lg text-xs font-bold text-center outline-none" />
                        <span className="text-xs font-bold text-brand-text">m</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-brand-text">Token Expiry</p>
                        <p className="text-[10px] text-gray-400">Minutes.</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="number" defaultValue={30} className="w-14 px-2 py-1.5 bg-brand-bg rounded-lg text-xs font-bold text-center outline-none" />
                        <span className="text-xs font-bold text-brand-text">min</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <button className="hu-button-rounded py-3 px-8 text-[10px]">Save Policy Updates</button>
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
              className="relative w-full max-w-2xl bg-brand-surface rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-4 md:p-6 border-b border-brand-border flex items-center justify-between bg-hu-cream/30">
                <h3 className="text-xl md:text-2xl font-serif font-bold text-brand-text">
                  {editingUser ? 'Edit Personnel' : 'Add New Personnel'}
                </h3>
                <button onClick={() => setIsUserModalOpen(false)} className="p-2 hover:bg-white rounded-xl transition-all">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              <form onSubmit={handleSaveUser} className="p-8 space-y-6 overflow-y-auto flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Full Name</label>
                    <input
                      required
                      type="text"
                      value={userForm.fullName || ''}
                      onChange={(e) => setUserForm({ ...userForm, fullName: e.target.value })}
                      className="w-full px-6 py-4 bg-brand-bg border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-hu-gold/20 outline-none transition-all"
                      placeholder="e.g. Dr. Abebe Kebede"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Email Address</label>
                    <input
                      required
                      type="email"
                      value={userForm.email || ''}
                      onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                      className="w-full px-6 py-4 bg-brand-bg border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-hu-gold/20 outline-none transition-all"
                      placeholder="email@haramaya.edu.et"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Role</label>
                    <select
                      value={userForm.role || 'student'}
                      onChange={(e) => setUserForm({ ...userForm, role: e.target.value as UserRole })}
                      className="w-full px-6 py-4 bg-brand-bg border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-hu-gold/20 outline-none transition-all appearance-none"
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
                      value={userForm.idNumber || ''}
                      onChange={(e) => setUserForm({ ...userForm, idNumber: e.target.value })}
                      className="w-full px-6 py-4 bg-brand-bg border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-hu-gold/20 outline-none transition-all"
                      placeholder="e.g. 0328/15"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Department</label>
                    <input
                      required
                      type="text"
                      value={userForm.department || ''}
                      onChange={(e) => setUserForm({ ...userForm, department: e.target.value })}
                      className="w-full px-6 py-4 bg-brand-bg border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-hu-gold/20 outline-none transition-all"
                      placeholder="e.g. Computer Science"
                    />
                  </div>

                  {userForm.role === 'student' && (
                    <>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Program Type</label>
                        <select
                          value={userForm.programType || (programs.length > 0 ? programs[0].programId : '')}
                          onChange={(e) => setUserForm({ ...userForm, programType: e.target.value as ProgramType })}
                          className="w-full px-6 py-4 bg-brand-bg border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-hu-gold/20 outline-none transition-all appearance-none"
                        >
                          {programs.map(p => (
                            <option key={p.programId} value={p.programId}>{p.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Center</label>
                        <select
                          value={userForm.center || (centers.length > 0 ? centers[0].centerId : 'main')}
                          onChange={(e) => setUserForm({ ...userForm, center: e.target.value as Center })}
                          className="w-full px-6 py-4 bg-brand-bg border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-hu-gold/20 outline-none transition-all appearance-none"
                        >
                          {centers.map(c => (
                            <option key={c.centerId} value={c.centerId}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Batch / Cohort</label>
                        <select
                          value={userForm.batch || (batches.length > 0 ? batches[0].batchId : '')}
                          onChange={(e) => setUserForm({ ...userForm, batch: e.target.value })}
                          className="w-full px-6 py-4 bg-brand-bg border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-hu-gold/20 outline-none transition-all appearance-none"
                        >
                          <option value="">Select a Batch</option>
                          {batches.map(b => (
                            <option key={b.batchId} value={b.batchId}>{b.name}</option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}
                </div>
                <div className="pt-4 flex gap-4">
                  <button
                    type="button"
                    onClick={() => setIsUserModalOpen(false)}
                    className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-gray-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-4 bg-brand-primary text-white dark:text-hu-charcoal rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-hu-gold transition-all shadow-xl shadow-brand-primary/20"
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
              className="relative w-full max-w-2xl bg-brand-surface rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-brand-border flex items-center justify-between bg-hu-cream/30 dark:bg-brand-surface/20">
                <h3 className="text-2xl font-serif font-bold text-brand-text">
                  {editingCourse ? 'Edit Course' : 'Add New Course'}
                </h3>
                <button onClick={() => setIsCourseModalOpen(false)} className="p-2 hover:bg-white rounded-xl transition-all">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              <form onSubmit={handleSaveCourse} className="p-8 space-y-6 overflow-y-auto flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Course Code</label>
                    <input
                      required
                      type="text"
                      value={courseForm.courseCode || ''}
                      onChange={(e) => setCourseForm({ ...courseForm, courseCode: e.target.value })}
                      className="w-full px-6 py-4 bg-brand-bg border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-hu-gold/20 outline-none transition-all"
                      placeholder="e.g. CoSc4038"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Course Title</label>
                    <input
                      required
                      type="text"
                      value={courseForm.title || ''}
                      onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                      className="w-full px-6 py-4 bg-brand-bg border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-hu-gold/20 outline-none transition-all"
                      placeholder="e.g. Distributed Systems"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Credit Hours</label>
                    <input
                      required
                      type="number"
                      value={courseForm.creditHours ?? ''}
                      onChange={(e) => setCourseForm({ ...courseForm, creditHours: parseInt(e.target.value) })}
                      className="w-full px-6 py-4 bg-brand-bg border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-hu-gold/20 outline-none transition-all"
                      min="1"
                      max="6"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Department</label>
                    <input
                      required
                      type="text"
                      value={courseForm.department || ''}
                      onChange={(e) => setCourseForm({ ...courseForm, department: e.target.value })}
                      className="w-full px-6 py-4 bg-brand-bg border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-hu-gold/20 outline-none transition-all"
                      placeholder="e.g. Computer Science"
                    />
                  </div>
                </div>
                <div className="pt-4 flex gap-4">
                  <button
                    type="button"
                    onClick={() => setIsCourseModalOpen(false)}
                    className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-gray-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-4 bg-brand-primary text-white dark:text-hu-charcoal rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-hu-gold transition-all shadow-xl shadow-brand-primary/20"
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
              className="relative w-full max-w-2xl bg-brand-surface rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-brand-border flex items-center justify-between bg-hu-cream/30 dark:bg-brand-surface/20">
                <h3 className="text-2xl font-serif font-bold text-brand-text">
                  {editingSection ? 'Edit Section Assignment' : 'Assign New Section'}
                </h3>
                <button onClick={() => setIsSectionModalOpen(false)} className="p-2 hover:bg-brand-bg rounded-xl transition-all">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              <form onSubmit={handleSaveSection} className="p-8 space-y-6 overflow-y-auto flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Course</label>
                    <select
                      required
                      value={sectionForm.courseId || ''}
                      onChange={(e) => setSectionForm({ ...sectionForm, courseId: e.target.value })}
                      className="w-full px-6 py-4 bg-brand-bg border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-hu-gold/20 outline-none transition-all appearance-none"
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
                      value={sectionForm.instructorId || ''}
                      onChange={(e) => setSectionForm({ ...sectionForm, instructorId: e.target.value })}
                      className="w-full px-6 py-4 bg-brand-bg border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-hu-gold/20 outline-none transition-all appearance-none"
                    >
                      <option value="">Select Instructor</option>
                      {users.filter(u => u.role === 'instructor').map(u => (
                        <option key={u.userId} value={u.userId}>{u.fullName}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">Room</label>
                    <input
                      required
                      type="text"
                      value={sectionForm.room || ''}
                      onChange={(e) => setSectionForm({ ...sectionForm, room: e.target.value })}
                      className="w-full px-6 py-4 bg-brand-bg dark:bg-brand-bg/50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-hu-gold/20 outline-none transition-all"
                      placeholder="e.g. Block 24, Room 102"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Program Type</label>
                    <select
                      required
                      value={sectionForm.programType || (programs.length > 0 ? programs[0].programId : '')}
                      onChange={(e) => setSectionForm({ ...sectionForm, programType: e.target.value as ProgramType })}
                      className="w-full px-6 py-4 bg-brand-bg border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-hu-gold/20 outline-none transition-all appearance-none"
                    >
                      {programs.map(p => (
                        <option key={p.programId} value={p.programId}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Center</label>
                    <select
                      required
                      value={sectionForm.center || (centers.length > 0 ? centers[0].centerId : 'main')}
                      onChange={(e) => setSectionForm({ ...sectionForm, center: e.target.value as Center })}
                      className="w-full px-6 py-4 bg-brand-bg border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-hu-gold/20 outline-none transition-all appearance-none"
                    >
                      {centers.map(c => (
                        <option key={c.centerId} value={c.centerId}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Batch / Cohort</label>
                    <select
                      value={sectionForm.batchId || ''}
                      onChange={(e) => setSectionForm({ ...sectionForm, batchId: e.target.value })}
                      className="w-full px-6 py-4 bg-brand-bg border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-hu-gold/20 outline-none transition-all appearance-none"
                    >
                      <option value="">Select a Batch (Optional)</option>
                      {batches.map(b => (
                        <option key={b.batchId} value={b.batchId}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Start Date</label>
                    <input
                      required
                      type="date"
                      value={sectionForm.startDate || ''}
                      onChange={(e) => setSectionForm({ ...sectionForm, startDate: e.target.value })}
                      className="w-full px-6 py-4 bg-brand-bg border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-hu-gold/20 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">End Date</label>
                    <input
                      required
                      type="date"
                      value={sectionForm.endDate || ''}
                      onChange={(e) => setSectionForm({ ...sectionForm, endDate: e.target.value })}
                      className="w-full px-6 py-4 bg-brand-bg border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-hu-gold/20 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Schedule Blocks</label>
                    <div className="flex gap-2">
                      {programs.find(p => p.programId === sectionForm.programType)?.name.toLowerCase() === 'extension' && (
                        <button
                          type="button"
                          onClick={() => setSectionForm({
                            ...sectionForm,
                            schedule: [
                              { dayOfWeek: 'Saturday', startTime: '09:00', endTime: '12:00' },
                              { dayOfWeek: 'Saturday', startTime: '14:00', endTime: '16:00' },
                              { dayOfWeek: 'Sunday', startTime: '08:30', endTime: '11:30' }
                            ]
                          })}
                          className="text-[10px] font-bold text-hu-gold hover:text-brand-primary transition-colors border border-hu-gold/20 px-2 py-1 rounded-lg"
                        >
                          Weekend Preset
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setSectionForm({
                          ...sectionForm,
                          schedule: [...(sectionForm.schedule || []), { dayOfWeek: 'Monday', startTime: '08:00', endTime: '10:00' }]
                        })}
                        className="text-xs font-bold text-brand-primary hover:text-hu-gold transition-colors"
                      >
                        + Add Block
                      </button>
                    </div>
                  </div>

                  {sectionForm.schedule?.map((block, index) => (
                    <div key={index} className="grid grid-cols-2 md:grid-cols-4 items-center gap-2 bg-brand-bg dark:bg-brand-surface/50 p-3 rounded-xl">
                      <select
                        value={block.dayOfWeek || 'Monday'}
                        onChange={(e) => {
                          const newSchedule = [...(sectionForm.schedule || [])];
                          newSchedule[index].dayOfWeek = e.target.value as DayOfWeek;
                          setSectionForm({ ...sectionForm, schedule: newSchedule });
                        }}
                        className="col-span-2 md:col-span-1 px-3 py-2 bg-brand-bg dark:bg-brand-surface border-none rounded-lg text-sm font-bold focus:ring-2 focus:ring-hu-gold/20 outline-none transition-all dark:text-brand-text"
                      >
                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                          <option key={day} value={day}>{day}</option>
                        ))}
                      </select>
                      <input
                        type="time"
                        value={block.startTime || ''}
                        onChange={(e) => {
                          const newSchedule = [...(sectionForm.schedule || [])];
                          newSchedule[index].startTime = e.target.value;
                          setSectionForm({ ...sectionForm, schedule: newSchedule });
                        }}
                        className="col-span-1 px-3 py-2 bg-brand-bg dark:bg-brand-surface border-none rounded-lg text-sm font-bold focus:ring-2 focus:ring-hu-gold/20 outline-none transition-all dark:text-brand-text"
                      />
                      <input
                        type="time"
                        value={block.endTime || ''}
                        onChange={(e) => {
                          const newSchedule = [...(sectionForm.schedule || [])];
                          newSchedule[index].endTime = e.target.value;
                          setSectionForm({ ...sectionForm, schedule: newSchedule });
                        }}
                        className="col-span-1 px-3 py-2 bg-brand-bg dark:bg-brand-surface border-none rounded-lg text-sm font-bold focus:ring-2 focus:ring-hu-gold/20 outline-none transition-all dark:text-brand-text"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newSchedule = [...(sectionForm.schedule || [])];
                          newSchedule.splice(index, 1);
                          setSectionForm({ ...sectionForm, schedule: newSchedule });
                        }}
                        className="col-span-1 md:col-span-1 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {(!sectionForm.schedule || sectionForm.schedule.length === 0) && (
                    <p className="text-xs text-gray-400 italic text-center py-4">No schedule blocks added yet.</p>
                  )}
                </div>

                {programs.find(p => p.programId === sectionForm.programType)?.name.toLowerCase() === 'extension' && (
                  <div className="space-y-4 pt-4 border-t border-brand-border">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Specific Meeting Dates (Weekends)</label>
                      <button
                        type="button"
                        onClick={() => setSectionForm({
                          ...sectionForm,
                          meetingDates: [...(sectionForm.meetingDates || []), new Date().toISOString().split('T')[0]]
                        })}
                        className="text-xs font-bold text-brand-primary hover:text-hu-gold transition-colors"
                      >
                        + Add Date
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {sectionForm.meetingDates?.map((date, index) => (
                        <div key={index} className="flex items-center gap-2 bg-brand-bg p-2 rounded-xl">
                          <input
                            type="date"
                            value={date || ''}
                            onChange={(e) => {
                              const newDates = [...(sectionForm.meetingDates || [])];
                              newDates[index] = e.target.value;
                              setSectionForm({ ...sectionForm, meetingDates: newDates });
                            }}
                            className="flex-1 px-3 py-2 bg-white border-none rounded-lg text-xs font-bold focus:ring-2 focus:ring-hu-gold/20 outline-none transition-all"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newDates = [...(sectionForm.meetingDates || [])];
                              newDates.splice(index, 1);
                              setSectionForm({ ...sectionForm, meetingDates: newDates });
                            }}
                            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                    {(!sectionForm.meetingDates || sectionForm.meetingDates.length === 0) && (
                      <p className="text-xs text-gray-400 italic text-center py-2">No specific dates added. Will assume every weekend between start and end date.</p>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-brand-border">
                  {/* Mid Exam Dates */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-hu-gold">Mid Exam Dates</label>
                      <button
                        type="button"
                        onClick={() => setSectionForm({
                          ...sectionForm,
                          midExamDates: [...(sectionForm.midExamDates || []), '']
                        })}
                        className="text-[10px] font-bold text-brand-primary hover:text-hu-gold transition-colors"
                      >
                        + Add
                      </button>
                    </div>
                    <div className="space-y-2">
                      {sectionForm.midExamDates?.map((date, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <input
                            type="date"
                            value={date || ''}
                            onChange={(e) => {
                              const newDates = [...(sectionForm.midExamDates || [])];
                              newDates[index] = e.target.value;
                              setSectionForm({ ...sectionForm, midExamDates: newDates });
                            }}
                            className="flex-1 px-4 py-2 bg-brand-bg border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-hu-gold/20 outline-none transition-all"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newDates = [...(sectionForm.midExamDates || [])];
                              newDates.splice(index, 1);
                              setSectionForm({ ...sectionForm, midExamDates: newDates });
                            }}
                            className="p-2 text-red-400 hover:bg-red-50 rounded-lg"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Final Exam Dates */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-hu-gold">Final Exam Dates</label>
                      <button
                        type="button"
                        onClick={() => setSectionForm({
                          ...sectionForm,
                          finalExamDates: [...(sectionForm.finalExamDates || []), '']
                        })}
                        className="text-[10px] font-bold text-brand-primary hover:text-hu-gold transition-colors"
                      >
                        + Add
                      </button>
                    </div>
                    <div className="space-y-2">
                      {sectionForm.finalExamDates?.map((date, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <input
                            type="date"
                            value={date || ''}
                            onChange={(e) => {
                              const newDates = [...(sectionForm.finalExamDates || [])];
                              newDates[index] = e.target.value;
                              setSectionForm({ ...sectionForm, finalExamDates: newDates });
                            }}
                            className="flex-1 px-4 py-2 bg-brand-bg border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-hu-gold/20 outline-none transition-all"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newDates = [...(sectionForm.finalExamDates || [])];
                              newDates.splice(index, 1);
                              setSectionForm({ ...sectionForm, finalExamDates: newDates });
                            }}
                            className="p-2 text-red-400 hover:bg-red-50 rounded-lg"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex gap-4">
                  <button
                    type="button"
                    onClick={() => setIsSectionModalOpen(false)}
                    className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-gray-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-4 bg-brand-primary text-white dark:text-hu-charcoal rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-hu-gold transition-all shadow-xl shadow-brand-primary/20"
                  >
                    {editingSection ? 'Update Section' : 'Assign Section'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Section Details Modal */}
      <AnimatePresence>
        {isDetailsModalOpen && selectedSectionDetails && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDetailsModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-brand-border flex items-center justify-between bg-hu-cream/30">
                <div>
                  <h3 className="text-2xl font-serif font-bold text-brand-text">Section Details</h3>
                  <p className="text-sm text-gray-400 font-medium mt-1">
                    {(() => {
                      const course = courses.find(c => c.courseId === selectedSectionDetails.courseId);
                      return `${course?.courseCode} - Section ${selectedSectionDetails.sectionId.split('-')[1] || selectedSectionDetails.sectionId}`;
                    })()}
                  </p>
                </div>
                <button onClick={() => setIsDetailsModalOpen(false)} className="p-2 hover:bg-white rounded-xl transition-all">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              
              <div className="p-8 space-y-8 overflow-y-auto flex-1">
                {/* Schedule Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-brand-primary">
                    <Clock className="w-5 h-5" />
                    <h4 className="text-sm font-bold uppercase tracking-widest">Assigned Schedule</h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {selectedSectionDetails.schedule.map((block, idx) => (
                      <div key={idx} className="bg-brand-bg p-4 rounded-xl flex flex-col gap-1">
                        <span className="text-xs font-bold text-hu-gold uppercase tracking-widest">{block.dayOfWeek}</span>
                        <span className="text-sm font-bold text-brand-text">{block.startTime} - {block.endTime}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Geofence Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-brand-primary">
                    <MapPin className="w-5 h-5" />
                    <h4 className="text-sm font-bold uppercase tracking-widest">Geofence Configuration</h4>
                  </div>
                  <div className="bg-brand-bg p-6 rounded-[24px] grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Latitude</p>
                      <p className="text-sm font-mono font-bold text-brand-text">{selectedSectionDetails.geofenceCenter.latitude.toFixed(6)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Longitude</p>
                      <p className="text-sm font-mono font-bold text-brand-text">{selectedSectionDetails.geofenceCenter.longitude.toFixed(6)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Radius</p>
                      <p className="text-sm font-bold text-brand-text">{selectedSectionDetails.geofenceRadius} Meters</p>
                    </div>
                  </div>
                </div>

                {/* Exam Dates Section */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-hu-gold">
                      <Calendar className="w-5 h-5" />
                      <h4 className="text-sm font-bold uppercase tracking-widest">Mid Exam Dates</h4>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedSectionDetails.midExamDates?.length ? selectedSectionDetails.midExamDates.map((date, idx) => (
                        <span key={idx} className="px-4 py-2 bg-red-50 text-red-600 rounded-xl text-xs font-bold border border-red-100">
                          {date}
                        </span>
                      )) : <p className="text-xs text-gray-400 italic">No mid exam dates set</p>}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-hu-gold">
                      <Calendar className="w-5 h-5" />
                      <h4 className="text-sm font-bold uppercase tracking-widest">Final Exam Dates</h4>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedSectionDetails.finalExamDates?.length ? selectedSectionDetails.finalExamDates.map((date, idx) => (
                        <span key={idx} className="px-4 py-2 bg-red-50 text-red-600 rounded-xl text-xs font-bold border border-red-100">
                          {date}
                        </span>
                      )) : <p className="text-xs text-gray-400 italic">No final exam dates set</p>}
                    </div>
                  </div>
                </div>

                {/* Meeting Dates (Weekends) */}
                {programs.find(p => p.programId === selectedSectionDetails.programType)?.name.toLowerCase() === 'extension' && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-brand-primary">
                      <Calendar className="w-5 h-5" />
                      <h4 className="text-sm font-bold uppercase tracking-widest">Specific Meeting Weekends</h4>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedSectionDetails.meetingDates?.length ? selectedSectionDetails.meetingDates.map((date, idx) => (
                        <span key={idx} className="px-4 py-2 bg-hu-cream/50 text-hu-gold rounded-xl text-xs font-bold">
                          {date}
                        </span>
                      )) : <p className="text-xs text-gray-400 italic">No specific dates set</p>}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-8 border-t border-brand-border bg-brand-bg">
                <button
                  onClick={() => setIsDetailsModalOpen(false)}
                  className="w-full py-4 bg-hu-charcoal text-white dark:text-hu-charcoal rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-black transition-all shadow-xl"
                >
                  Close Details
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Semester Modal */}
      <AnimatePresence>
        {isSemesterModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSemesterModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-brand-surface rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-brand-border flex items-center justify-between bg-hu-cream/30 dark:bg-brand-surface/20">
                <h3 className="text-2xl font-serif font-bold text-brand-text">
                  Add New Semester
                </h3>
                <button onClick={() => setIsSemesterModalOpen(false)} className="p-2 hover:bg-brand-bg rounded-xl transition-all">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              <form onSubmit={handleSaveSemester} className="p-8 space-y-6 overflow-y-auto flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Semester Name</label>
                    <input
                      required
                      type="text"
                      value={semesterForm.name || ''}
                      onChange={(e) => setSemesterForm({ ...semesterForm, name: e.target.value })}
                      className="w-full px-6 py-4 bg-brand-bg border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-hu-gold/20 outline-none transition-all"
                      placeholder="e.g. Fall 2026"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Start Date</label>
                    <input
                      required
                      type="date"
                      value={semesterForm.startDate || ''}
                      onChange={(e) => setSemesterForm({ ...semesterForm, startDate: e.target.value })}
                      className="w-full px-6 py-4 bg-brand-bg border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-hu-gold/20 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">End Date</label>
                    <input
                      required
                      type="date"
                      value={semesterForm.endDate || ''}
                      onChange={(e) => setSemesterForm({ ...semesterForm, endDate: e.target.value })}
                      className="w-full px-6 py-4 bg-brand-bg border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-hu-gold/20 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2 flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="isActiveSemester"
                      checked={semesterForm.isActive || false}
                      onChange={(e) => setSemesterForm({ ...semesterForm, isActive: e.target.checked })}
                      className="w-5 h-5 rounded border-brand-border text-brand-primary focus:ring-brand-primary"
                    />
                    <label htmlFor="isActiveSemester" className="text-sm font-bold text-brand-text cursor-pointer">
                      Set as Active Semester
                    </label>
                  </div>
                </div>
                <div className="pt-4 flex gap-4">
                  <button
                    type="button"
                    onClick={() => setIsSemesterModalOpen(false)}
                    className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-gray-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-4 bg-brand-primary text-white dark:text-hu-charcoal rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-hu-gold transition-all shadow-xl shadow-brand-primary/20"
                  >
                    Add Semester
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Center Modal */}
      <AnimatePresence>
        {isCenterModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCenterModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-brand-surface rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-brand-border flex items-center justify-between bg-hu-cream/30 dark:bg-brand-surface/20">
                <h3 className="text-2xl font-serif font-bold text-brand-text">
                  {editingCenter ? 'Edit Center' : 'Add New Center'}
                </h3>
                <button onClick={() => setIsCenterModalOpen(false)} className="p-2 hover:bg-brand-bg rounded-xl transition-all">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              <form onSubmit={handleSaveCenter} className="p-8 space-y-6 overflow-y-auto flex-1">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Center Name</label>
                  <input
                    required
                    type="text"
                    value={centerForm.name}
                    onChange={(e) => setCenterForm({ ...centerForm, name: e.target.value })}
                    className="w-full px-6 py-4 bg-brand-bg border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-hu-gold/20 outline-none transition-all"
                    placeholder="e.g. Jigjiga Extension Center"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Location</label>
                  <input
                    type="text"
                    value={centerForm.location}
                    onChange={(e) => setCenterForm({ ...centerForm, location: e.target.value })}
                    className="w-full px-6 py-4 bg-brand-bg border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-hu-gold/20 outline-none transition-all"
                    placeholder="e.g. Jigjiga, Somali Region"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Description</label>
                  <textarea
                    value={centerForm.description}
                    onChange={(e) => setCenterForm({ ...centerForm, description: e.target.value })}
                    className="w-full px-6 py-4 bg-brand-bg border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-hu-gold/20 outline-none transition-all min-h-[120px]"
                    placeholder="Brief description of the center..."
                  />
                </div>
                <div className="pt-6 flex gap-4">
                  <button
                    type="button"
                    onClick={() => setIsCenterModalOpen(false)}
                    className="flex-1 px-8 py-4 bg-gray-100 text-gray-400 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-gray-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-8 py-4 bg-brand-primary text-white dark:text-hu-charcoal rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-brand-primary-dark shadow-lg shadow-brand-primary/20 transition-all"
                  >
                    {editingCenter ? 'Update Center' : 'Create Center'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {isProgramModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsProgramModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-brand-surface rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-brand-border flex items-center justify-between bg-hu-cream/30 dark:bg-brand-surface/20">
                <h3 className="text-2xl font-serif font-bold text-brand-text">
                  {editingProgram ? 'Edit Program' : 'Add New Program'}
                </h3>
                <button onClick={() => setIsProgramModalOpen(false)} className="p-2 hover:bg-brand-bg rounded-xl transition-all">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              <form onSubmit={handleSaveProgram} className="p-8 space-y-6 overflow-y-auto flex-1">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Program Name</label>
                  <input
                    required
                    type="text"
                    value={programForm.name}
                    onChange={(e) => setProgramForm({ ...programForm, name: e.target.value })}
                    className="w-full px-6 py-4 bg-brand-bg border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-hu-gold/20 outline-none transition-all"
                    placeholder="e.g. Extension"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Duration (Years)</label>
                  <input
                    required
                    type="number"
                    min="1"
                    max="7"
                    value={programForm.durationYears}
                    onChange={(e) => setProgramForm({ ...programForm, durationYears: parseInt(e.target.value) })}
                    className="w-full px-6 py-4 bg-brand-bg border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-hu-gold/20 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Description</label>
                  <textarea
                    value={programForm.description}
                    onChange={(e) => setProgramForm({ ...programForm, description: e.target.value })}
                    className="w-full px-6 py-4 bg-brand-bg border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-hu-gold/20 outline-none transition-all min-h-[120px] resize-none"
                    placeholder="Program details..."
                  />
                </div>
                <div className="pt-6 flex gap-4">
                  <button
                    type="button"
                    onClick={() => setIsProgramModalOpen(false)}
                    className="flex-1 px-8 py-4 bg-gray-100 text-gray-400 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-gray-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-8 py-4 bg-brand-primary text-white dark:text-hu-charcoal rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-brand-primary-dark shadow-lg shadow-brand-primary/20 transition-all"
                  >
                    {editingProgram ? 'Update Program' : 'Create Program'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {isBatchModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsBatchModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-brand-surface rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-brand-border flex items-center justify-between bg-hu-cream/30 dark:bg-brand-surface/20">
                <h3 className="text-2xl font-serif font-bold text-brand-text">
                  {editingBatch ? 'Edit Batch' : 'Add New Batch'}
                </h3>
                <button onClick={() => setIsBatchModalOpen(false)} className="p-2 hover:bg-brand-bg rounded-xl transition-all">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              <form onSubmit={handleSaveBatch} className="p-8 space-y-6 overflow-y-auto flex-1">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Batch Name</label>
                  <input
                    required
                    type="text"
                    value={batchForm.name}
                    onChange={(e) => setBatchForm({ ...batchForm, name: e.target.value })}
                    className="w-full px-6 py-4 bg-brand-bg border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-hu-gold/20 outline-none transition-all"
                    placeholder="e.g. Year 3 (2015 Entry)"
                  />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Entry Year</label>
                    <input
                      required
                      type="text"
                      value={batchForm.entryYear}
                      onChange={(e) => setBatchForm({ ...batchForm, entryYear: e.target.value })}
                      className="w-full px-6 py-4 bg-brand-bg border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-hu-gold/20 outline-none transition-all"
                      placeholder="e.g. 2015"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Current Year Level</label>
                    <input
                      required
                      type="number"
                      min="1"
                      max="7"
                      value={batchForm.currentYear}
                      onChange={(e) => setBatchForm({ ...batchForm, currentYear: parseInt(e.target.value) })}
                      className="w-full px-6 py-4 bg-brand-bg border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-hu-gold/20 outline-none transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Expected Graduation Year</label>
                  <input
                    required
                    type="text"
                    value={batchForm.expectedGraduation}
                    onChange={(e) => setBatchForm({ ...batchForm, expectedGraduation: e.target.value })}
                    className="w-full px-6 py-4 bg-brand-bg border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-hu-gold/20 outline-none transition-all"
                    placeholder="e.g. 2019"
                  />
                </div>
                <div className="pt-6 flex gap-4">
                  <button
                    type="button"
                    onClick={() => setIsBatchModalOpen(false)}
                    className="flex-1 px-8 py-4 bg-gray-100 text-gray-400 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-gray-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-8 py-4 bg-brand-primary text-white dark:text-hu-charcoal rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-brand-primary-dark shadow-lg shadow-brand-primary/20 transition-all"
                  >
                    {editingBatch ? 'Update Batch' : 'Create Batch'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bulk Import Modal */}
      <AnimatePresence>
        {isImportModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsImportModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-brand-surface rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-brand-border flex items-center justify-between bg-hu-cream/30">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-brand-primary/10 rounded-xl flex items-center justify-center text-brand-primary">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-serif font-bold text-brand-text">Bulk Import Students</h3>
                    <p className="text-xs text-gray-400 font-medium">Upload CSV file to enroll multiple students at once.</p>
                  </div>
                </div>
                <button onClick={() => setIsImportModalOpen(false)} className="p-2 hover:bg-brand-bg rounded-xl transition-all">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="p-8 space-y-8 overflow-y-auto flex-1">
                {/* Template Download */}
                <div className="p-6 bg-brand-surface rounded-xl border border-hu-gold/10 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-brand-bg dark:bg-brand-surface rounded-xl flex items-center justify-center text-hu-gold shadow-sm">
                      <Download className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-brand-text">CSV Template</p>
                      <p className="text-[10px] text-gray-400 font-medium">Download the required format for import.</p>
                    </div>
                  </div>
                  <button 
                    onClick={handleDownloadTemplate}
                    className="px-4 py-2 bg-brand-bg dark:bg-brand-surface text-hu-gold border border-hu-gold/20 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-hu-gold hover:text-white dark:hover:text-hu-charcoal transition-all"
                  >
                    Download
                  </button>
                </div>

                {/* File Upload Area */}
                <div className="relative">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="border-2 border-dashed border-brand-border rounded-[32px] p-12 text-center space-y-4 hover:border-brand-primary/30 transition-all bg-brand-bg">
                    <div className="w-16 h-16 bg-brand-bg dark:bg-brand-surface rounded-3xl flex items-center justify-center mx-auto shadow-sm text-gray-300">
                      <Upload className="w-8 h-8" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-brand-text">Click or drag CSV file here</p>
                      <p className="text-xs text-gray-400 mt-1">Maximum file size: 5MB</p>
                    </div>
                  </div>
                </div>

                {/* Preview / Errors */}
                {importData.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400">Import Preview</h4>
                      <span className="px-3 py-1 bg-brand-primary/10 text-brand-primary rounded-full text-[10px] font-bold">
                        {importData.length} Records Found
                      </span>
                    </div>
                    
                    {importErrors.length > 0 ? (
                      <div className="p-4 bg-red-50 rounded-xl border border-red-100 space-y-2">
                        <div className="flex items-center gap-2 text-red-500">
                          <AlertCircle className="w-4 h-4" />
                          <p className="text-xs font-bold">Validation Errors Found</p>
                        </div>
                        <ul className="text-[10px] text-red-400 font-medium list-disc pl-4 space-y-1">
                          {importErrors.slice(0, 5).map((err, i) => (
                            <li key={i}>{err}</li>
                          ))}
                          {importErrors.length > 5 && <li>And {importErrors.length - 5} more errors...</li>}
                        </ul>
                      </div>
                    ) : (
                      <div className="hu-card-alt overflow-hidden">
                        <table className="w-full text-left text-[10px]">
                          <thead className="bg-brand-bg">
                            <tr>
                              <th className="px-4 py-3 font-bold text-gray-400 uppercase tracking-widest">Name</th>
                              <th className="px-4 py-3 font-bold text-gray-400 uppercase tracking-widest">Email</th>
                              <th className="px-4 py-3 font-bold text-gray-400 uppercase tracking-widest">ID</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-brand-border">
                            {importData.slice(0, 5).map((row, i) => (
                              <tr key={i}>
                                <td className="px-4 py-3 font-bold text-brand-text">{row.fullName}</td>
                                <td className="px-4 py-3 text-gray-400">{row.email}</td>
                                <td className="px-4 py-3 font-mono text-brand-primary">{row.idNumber}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {importData.length > 5 && (
                          <div className="p-3 bg-hu-cream/10 text-center text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                            + {importData.length - 5} more records
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="p-8 border-t border-brand-border flex gap-4">
                <button
                  onClick={() => {
                    setIsImportModalOpen(false);
                    setImportData([]);
                    setImportErrors([]);
                  }}
                  className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  disabled={importData.length === 0 || importErrors.length > 0}
                  onClick={processImport}
                  className="flex-1 py-4 bg-brand-primary text-white dark:text-hu-charcoal rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-hu-gold transition-all shadow-xl shadow-brand-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirm Import
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {isConfirmModalOpen && confirmConfig && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsConfirmModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[32px] shadow-2xl overflow-hidden p-8 space-y-6"
            >
              <div className={cn(
                "w-16 h-16 rounded-xl flex items-center justify-center mx-auto",
                confirmConfig.type === 'danger' ? 'bg-red-50 text-red-500' : 'bg-hu-gold/10 text-hu-gold'
              )}>
                <AlertCircle className="w-8 h-8" />
              </div>
              
              <div className="text-center space-y-2">
                <h3 className="text-xl font-serif font-bold text-brand-text">{confirmConfig.title}</h3>
                <p className="text-sm text-gray-400 font-medium leading-relaxed">
                  {confirmConfig.message}
                </p>
              </div>

              <div className="flex gap-4 pt-2">
                <button
                  onClick={() => setIsConfirmModalOpen(false)}
                  className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmConfig.onConfirm}
                  className={cn(
                    "flex-1 py-4 text-white dark:text-hu-charcoal rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-xl",
                    confirmConfig.type === 'danger' ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20' : 'bg-hu-gold hover:bg-hu-charcoal shadow-hu-gold/20'
                  )}
                >
                  {confirmConfig.confirmText || 'Confirm'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboard;
