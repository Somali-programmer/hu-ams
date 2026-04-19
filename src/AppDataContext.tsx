import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User, Course, Section, ClassSession, Attendance, Semester, Enrollment, AuditLog, ProgramType, Center, CenterInfo, ProgramInfo, BatchInfo } from './types';
import { MOCK_USERS, MOCK_COURSES, MOCK_SECTIONS, MOCK_SESSIONS, MOCK_ATTENDANCE, MOCK_SEMESTERS, MOCK_ENROLLMENTS, MOCK_CENTERS, MOCK_PROGRAMS, MOCK_BATCHES, MOCK_HISTORICAL_SECTIONS, MOCK_HISTORICAL_SEMESTERS } from './mockData';

interface AppDataContextType {
  users: User[];
  courses: Course[];
  sections: Section[];
  sessions: ClassSession[];
  attendance: Attendance[];
  semesters: Semester[];
  enrollments: Enrollment[];
  auditLogs: AuditLog[];
  centers: CenterInfo[];
  programs: ProgramInfo[];
  batches: BatchInfo[];
  
  // Actions
  addSection: (section: Section) => void;
  updateSection: (sectionId: string, updates: Partial<Section>) => void;
  deleteSection: (sectionId: string) => void;
  addSemester: (semester: Semester) => void;
  setActiveSemester: (semesterId: string) => void;
  addUser: (user: User) => void;
  updateUser: (userId: string, updates: Partial<User>) => void;
  deleteUser: (userId: string) => void;
  addCourse: (course: Course) => void;
  updateCourse: (courseId: string, updates: Partial<Course>) => void;
  deleteCourse: (courseId: string) => void;
  addAttendance: (record: Attendance) => void;
  addSession: (session: ClassSession) => void;
  updateSession: (sessionId: string, updates: Partial<ClassSession>) => void;
  addEnrollment: (enrollment: Enrollment) => void;
  addAuditLog: (log: Omit<AuditLog, 'logId' | 'timestamp'>) => void;
  addCenter: (center: CenterInfo) => void;
  updateCenter: (centerId: string, updates: Partial<CenterInfo>) => void;
  deleteCenter: (centerId: string) => void;
  addProgram: (program: ProgramInfo) => void;
  updateProgram: (programId: string, updates: Partial<ProgramInfo>) => void;
  deleteProgram: (programId: string) => void;
  addBatch: (batch: BatchInfo) => void;
  updateBatch: (batchId: string, updates: Partial<BatchInfo>) => void;
  deleteBatch: (batchId: string) => void;
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

export const AppDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [courses, setCourses] = useState<Course[]>(MOCK_COURSES);
  const [sections, setSections] = useState<Section[]>([...MOCK_SECTIONS, ...MOCK_HISTORICAL_SECTIONS]);
  const [sessions, setSessions] = useState<ClassSession[]>(MOCK_SESSIONS);
  const [attendance, setAttendance] = useState<Attendance[]>(MOCK_ATTENDANCE);
  const [semesters, setSemesters] = useState<Semester[]>([...MOCK_SEMESTERS, ...MOCK_HISTORICAL_SEMESTERS]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>(MOCK_ENROLLMENTS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [centers, setCenters] = useState<CenterInfo[]>(MOCK_CENTERS);
  const [programs, setPrograms] = useState<ProgramInfo[]>(MOCK_PROGRAMS);
  const [batches, setBatches] = useState<BatchInfo[]>(MOCK_BATCHES);

  const addAuditLog = (log: Omit<AuditLog, 'logId' | 'timestamp'>) => {
    const newLog: AuditLog = {
      ...log,
      logId: `log-${Date.now()}`,
      timestamp: new Date().toISOString()
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const addSection = (section: Section) => {
    setSections(prev => [...prev, section]);
    
    // Auto-enroll matching students
    const matchingStudents = users.filter(u => 
      u.role === 'student' && 
      u.programType === section.programType && 
      u.center === section.center &&
      (!section.batchId || u.batch === section.batchId)
    );

    if (matchingStudents.length > 0) {
      const newEnrollments: Enrollment[] = matchingStudents.map(student => ({
        enrollmentId: `enr-${Date.now()}-${section.sectionId}-${student.userId}`,
        studentId: student.userId,
        sectionId: section.sectionId,
        enrolledAt: new Date().toISOString(),
        status: 'active'
      }));
      setEnrollments(prev => [...prev, ...newEnrollments]);
    }
  };

  const updateSection = (sectionId: string, updates: Partial<Section>) => {
    setSections(prev => {
      const newSections = prev.map(s => s.sectionId === sectionId ? { ...s, ...updates } : s);
      const updatedSection = newSections.find(s => s.sectionId === sectionId);
      
      if (updatedSection && (updates.programType || updates.center || updates.batchId)) {
        const matchingStudents = users.filter(u => 
          u.role === 'student' && 
          u.programType === updatedSection.programType && 
          u.center === updatedSection.center &&
          (!updatedSection.batchId || u.batch === updatedSection.batchId)
        );

        const newEnrollments: Enrollment[] = matchingStudents.map(student => ({
          enrollmentId: `enr-${Date.now()}-${sectionId}-${student.userId}`,
          studentId: student.userId,
          sectionId: sectionId,
          enrolledAt: new Date().toISOString(),
          status: 'active'
        }));

        setEnrollments(prev => {
          const filtered = prev.filter(e => e.sectionId !== sectionId);
          return [...filtered, ...newEnrollments];
        });
      }
      
      return newSections;
    });
  };

  const deleteSection = (sectionId: string) => {
    setSections(prev => prev.filter(s => s.sectionId !== sectionId));
  };

  const addSemester = (semester: Semester) => {
    setSemesters(prev => [...prev, semester]);
  };

  const setActiveSemester = (semesterId: string) => {
    setSemesters(prev => prev.map(s => ({
      ...s,
      isActive: s.semesterId === semesterId
    })));
  };

  const addUser = (user: User) => {
    setUsers(prev => [user, ...prev]);
    
    // If student, auto-enroll in matching sections
    if (user.role === 'student') {
      const matchingSections = sections.filter(s => 
        s.programType === user.programType && 
        s.center === user.center &&
        (!s.batchId || s.batchId === user.batch)
      );

      if (matchingSections.length > 0) {
        const newEnrollments: Enrollment[] = matchingSections.map(section => ({
          enrollmentId: `enr-${Date.now()}-${section.sectionId}-${user.userId}`,
          studentId: user.userId,
          sectionId: section.sectionId,
          enrolledAt: new Date().toISOString(),
          status: 'active'
        }));
        setEnrollments(prev => [...prev, ...newEnrollments]);
      }
    }
  };
  const updateUser = (userId: string, updates: Partial<User>) => setUsers(prev => prev.map(u => u.userId === userId ? { ...u, ...updates } : u));
  const deleteUser = (userId: string) => setUsers(prev => prev.filter(u => u.userId !== userId));
  
  const addCourse = (course: Course) => setCourses(prev => [course, ...prev]);
  const updateCourse = (courseId: string, updates: Partial<Course>) => setCourses(prev => prev.map(c => c.courseId === courseId ? { ...c, ...updates } : c));
  const deleteCourse = (courseId: string) => setCourses(prev => prev.filter(c => c.courseId !== courseId));

  const addAttendance = (record: Attendance) => {
    setAttendance(prev => [record, ...prev]);
  };

  const addSession = (session: ClassSession) => {
    setSessions(prev => [session, ...prev]);
  };

  const updateSession = (sessionId: string, updates: Partial<ClassSession>) => {
    setSessions(prev => prev.map(s => s.sessionId === sessionId ? { ...s, ...updates } : s));
  };

  const addEnrollment = (enrollment: Enrollment) => {
    setEnrollments(prev => [...prev, enrollment]);
  };

  const addCenter = (center: CenterInfo) => {
    setCenters(prev => [...prev, center]);
  };

  const updateCenter = (centerId: string, updates: Partial<CenterInfo>) => {
    setCenters(prev => prev.map(c => c.centerId === centerId ? { ...c, ...updates } : c));
  };

  const deleteCenter = (centerId: string) => {
    setCenters(prev => prev.filter(c => c.centerId !== centerId));
  };

  const addProgram = (program: ProgramInfo) => {
    setPrograms(prev => [...prev, program]);
  };

  const updateProgram = (programId: string, updates: Partial<ProgramInfo>) => {
    setPrograms(prev => prev.map(p => p.programId === programId ? { ...p, ...updates } : p));
  };

  const deleteProgram = (programId: string) => {
    setPrograms(prev => prev.filter(p => p.programId !== programId));
  };

  const addBatch = (batch: BatchInfo) => {
    setBatches(prev => [...prev, batch]);
  };

  const updateBatch = (batchId: string, updates: Partial<BatchInfo>) => {
    setBatches(prev => prev.map(b => b.batchId === batchId ? { ...b, ...updates } : b));
  };

  const deleteBatch = (batchId: string) => {
    setBatches(prev => prev.filter(b => b.batchId !== batchId));
  };

  return (
    <AppDataContext.Provider value={{
      users, courses, sections, sessions, attendance, semesters, enrollments, auditLogs, centers, programs, batches,
      addSection, updateSection, deleteSection, addSemester, setActiveSemester,
      addUser, updateUser, deleteUser, addCourse, updateCourse, deleteCourse,
      addAttendance, addSession, updateSession, addEnrollment, addAuditLog,
      addCenter, updateCenter, deleteCenter, addProgram, updateProgram, deleteProgram,
      addBatch, updateBatch, deleteBatch
    }}>
      {children}
    </AppDataContext.Provider>
  );
};

export const useAppData = () => {
  const context = useContext(AppDataContext);
  if (context === undefined) {
    throw new Error('useAppData must be used within an AppDataProvider');
  }
  return context;
};
