import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User, Course, Section, ClassSession, Attendance, Semester, Enrollment, AuditLog, ProgramType, Center, CenterInfo, ProgramInfo, BatchInfo } from './types';

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
  addSection: (section: Section) => Promise<void>;
  updateSection: (sectionId: string, updates: Partial<Section>) => Promise<void>;
  deleteSection: (sectionId: string) => Promise<void>;
  addSemester: (semester: Semester) => Promise<void>;
  setActiveSemester: (semesterId: string) => Promise<void>;
  addUser: (user: User) => Promise<void>;
  updateUser: (userId: string, updates: Partial<User>) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  addCourse: (course: Course) => Promise<void>;
  updateCourse: (courseId: string, updates: Partial<Course>) => Promise<void>;
  deleteCourse: (courseId: string) => Promise<void>;
  addAttendance: (record: Attendance) => Promise<void>;
  updateAttendance: (attendanceId: string, updates: Partial<Attendance>) => Promise<void>;
  addSession: (session: ClassSession) => Promise<void>;
  updateSession: (sessionId: string, updates: Partial<ClassSession>) => Promise<void>;
  addEnrollment: (enrollment: Enrollment) => Promise<void>;
  addAuditLog: (log: Omit<AuditLog, 'logId' | 'timestamp'>) => void;
  addCenter: (center: CenterInfo) => Promise<void>;
  updateCenter: (centerId: string, updates: Partial<CenterInfo>) => Promise<void>;
  deleteCenter: (centerId: string) => Promise<void>;
  addProgram: (program: ProgramInfo) => Promise<void>;
  updateProgram: (programId: string, updates: Partial<ProgramInfo>) => Promise<void>;
  deleteProgram: (programId: string) => Promise<void>;
  addBatch: (batch: BatchInfo) => Promise<void>;
  updateBatch: (batchId: string, updates: Partial<BatchInfo>) => Promise<void>;
  deleteBatch: (batchId: string) => Promise<void>;
  deleteAllStudents: () => Promise<void>;
  syncWithServer: () => Promise<void>;
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

export const AppDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [centers, setCenters] = useState<CenterInfo[]>([]);
  const [programs, setPrograms] = useState<ProgramInfo[]>([]);
  const [batches, setBatches] = useState<BatchInfo[]>([]);

  const syncWithServer = async () => {
    try {
      const endpoints = [
        '/api/users', '/api/centers', '/api/programs', '/api/batches', 
        '/api/enrollments', '/api/sections', '/api/courses', 
        '/api/semesters', '/api/sessions', '/api/attendance'
      ];

      const responses = await Promise.all(endpoints.map(url => fetch(url)));
      
      const results = await Promise.all(responses.map(async (res, index) => {
        if (!res.ok) {
          console.warn(`Failed to fetch ${endpoints[index]}: ${res.status}`);
          return null;
        }
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          try {
            return await res.json();
          } catch (e) {
            console.error(`Error parsing JSON from ${endpoints[index]}:`, e);
            return null;
          }
        }
        return null;
      }));

      const [uData, cData, pData, bData, eData, sData, coData, semData, sessData, attData] = results;

      if (Array.isArray(uData)) setUsers(uData);
      if (Array.isArray(cData)) setCenters(cData);
      if (Array.isArray(pData)) setPrograms(pData);
      if (Array.isArray(bData)) setBatches(bData);
      if (Array.isArray(eData)) setEnrollments(eData);
      if (Array.isArray(sData)) setSections(sData);
      if (Array.isArray(coData)) setCourses(coData);
      if (Array.isArray(semData)) setSemesters(semData);
      if (Array.isArray(sessData)) setSessions(sessData);
      if (Array.isArray(attData)) setAttendance(attData);
    } catch (err) {
      console.error('Failed to sync with Supabase:', err);
    }
  };

  React.useEffect(() => {
    syncWithServer();

    let timeout: any = null;
    const eventSource = new EventSource('/api/events');

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'update') {
          if (timeout) clearTimeout(timeout);
          timeout = setTimeout(() => {
            syncWithServer();
            // We use a clean toast ID to prevent duplicate toasts
            import('react-hot-toast').then(({ default: toast }) => {
              toast.success('System auto-refreshed with real-time updates', {
                id: 'real-time-sync',
                duration: 2000,
                icon: '🔄',
                style: {
                  borderRadius: '10px',
                  background: '#333',
                  color: '#fff',
                  fontSize: '12px'
                }
              });
            });
          }, 1000);
        }
      } catch (err) {
        // Ignore parse errors
      }
    };

    return () => {
      eventSource.close();
      if (timeout) clearTimeout(timeout);
    };
  }, []);

  const [setCourses_unused, setCourses_u] = useState(null); // Keep reference to setCourses if needed, or omit if using setters directly
  const [setSections_unused, setSections_u] = useState(null);
  const [setSessions_unused, setSessions_u] = useState(null);
  const [setAttendance_unused, setAttendance_u] = useState(null);
  const [setSemesters_unused, setSemesters_u] = useState(null);
  const [setEnrollments_unused, setEnrollments_u] = useState(null);
  const [setAuditLogs_unused, setAuditLogs_u] = useState(null);


  const addAuditLog = (log: Omit<AuditLog, 'logId' | 'timestamp'>) => {
    const newLog: AuditLog = {
      ...log,
      logId: `log-${Date.now()}`,
      timestamp: new Date().toISOString()
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const addSection = async (section: Section) => {
    const res = await fetch('/api/sections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(section)
    });
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to add section');
    }
    await syncWithServer();
  };

  const updateSection = async (sectionId: string, updates: Partial<Section>) => {
    const res = await fetch(`/api/sections/${sectionId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to update section');
    }
    await syncWithServer();
  };

  const deleteSection = async (sectionId: string) => {
    const res = await fetch(`/api/sections/${sectionId}`, { method: 'DELETE' });
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to delete section');
    }
    setSections(prev => prev.filter(s => s.sectionId !== sectionId));
  };

  const addSemester = async (semester: Semester) => {
    const res = await fetch('/api/semesters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(semester)
    });
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to add semester');
    }
    await syncWithServer();
  };

  const setActiveSemester = async (semesterId: string) => {
    const res = await fetch(`/api/semesters/${semesterId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: true })
    });
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to set active semester');
    }
    await syncWithServer();
  };

  const addUser = async (user: User) => {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: user.email,
        fullName: user.fullName,
        role: user.role,
        email: user.email,
        idNumber: user.idNumber,
        department: user.department,
        center_id: user.center,
        batch_id: user.batch
      })
    });
    
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to save user');
    }
    await syncWithServer();
  };

  const updateUser = async (userId: string, updates: Partial<User>) => {
    const res = await fetch(`/api/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to update user');
    }
    await syncWithServer();
  };
  const deleteUser = async (userId: string) => {
    const res = await fetch(`/api/users/${userId}`, { method: 'DELETE' });
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to delete user');
    }
    setUsers(prev => prev.filter(u => u.userId !== userId));
  };

  const deleteAllStudents = async () => {
    const students = users.filter(u => u.role === 'student');
    await Promise.all(students.map(async s => {
      const res = await fetch(`/api/users/${s.userId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`Failed to delete student ${s.fullName}`);
    }));
    setUsers(prev => prev.filter(u => u.role !== 'student'));
  };
  
  const addCourse = async (course: Course) => {
    const res = await fetch('/api/courses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        courseCode: course.courseCode,
        title: course.title,
        creditHours: course.creditHours,
        departmentId: (course as any).departmentId // Send ID if available
      })
    });
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to add course');
    }
    await syncWithServer();
  };

  const updateCourse = async (courseId: string, updates: Partial<Course>) => {
    const res = await fetch(`/api/courses/${courseId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to update course');
    }
    await syncWithServer();
  };
  const deleteCourse = async (courseId: string) => {
    const res = await fetch(`/api/courses/${courseId}`, { method: 'DELETE' });
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to delete course');
    }
    setCourses(prev => prev.filter(c => c.courseId !== courseId));
  };

  const addAttendance = async (record: Attendance) => {
    const res = await fetch('/api/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record)
    });
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to add attendance');
    }
    await syncWithServer();
  };

  const updateAttendance = async (attendanceId: string, updates: Partial<Attendance>) => {
    const res = await fetch(`/api/attendance/${attendanceId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to update attendance');
    }
    await syncWithServer();
  };

  const addSession = async (session: ClassSession) => {
    const res = await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(session)
    });
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to add session');
    }
    await syncWithServer();
  };

  const updateSession = async (sessionId: string, updates: Partial<ClassSession>) => {
    const res = await fetch(`/api/sessions/${sessionId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to update session');
    }
    await syncWithServer();
  };

  const addEnrollment = async (enrollment: Enrollment) => {
    setEnrollments(prev => [...prev, enrollment]);
  };

  const addCenter = async (center: CenterInfo) => {
    const res = await fetch('/api/centers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: center.name,
        location: center.location,
        description: center.description
      })
    });
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to add center');
    }
    await syncWithServer();
  };

  const updateCenter = async (centerId: string, updates: Partial<CenterInfo>) => {
    const res = await fetch(`/api/centers/${centerId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to update center');
    }
    await syncWithServer();
  };

  const deleteCenter = async (centerId: string) => {
    const res = await fetch(`/api/centers/${centerId}`, { method: 'DELETE' });
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to delete center');
    }
    setCenters(prev => prev.filter(c => c.centerId !== centerId));
  };

  const addProgram = async (program: ProgramInfo) => {
    const res = await fetch('/api/programs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: program.name,
        durationYears: program.durationYears,
        description: program.description,
        departmentId: program.departmentId
      })
    });
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to add program');
    }
    await syncWithServer();
  };

  const updateProgram = async (programId: string, updates: Partial<ProgramInfo>) => {
    const res = await fetch(`/api/programs/${programId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to update program');
    }
    await syncWithServer();
  };

  const deleteProgram = async (programId: string) => {
    const res = await fetch(`/api/programs/${programId}`, { method: 'DELETE' });
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to delete program');
    }
    setPrograms(prev => prev.filter(p => p.programId !== programId));
  };

  const addBatch = async (batch: BatchInfo) => {
    const res = await fetch('/api/batches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: batch.name,
        entryYear: batch.entryYear,
        currentYear: batch.currentYear,
        currentSemester: batch.currentSemester,
        expectedGraduation: batch.expectedGraduation,
        programId: batch.programId,
        centerId: batch.centerId
      })
    });
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to add batch');
    }
    await syncWithServer();
  };

  const updateBatch = async (batchId: string, updates: Partial<BatchInfo>) => {
    const res = await fetch(`/api/batches/${batchId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to update batch');
    }
    await syncWithServer();
  };

  const deleteBatch = async (batchId: string) => {
    const res = await fetch(`/api/batches/${batchId}`, { method: 'DELETE' });
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to delete batch');
    }
    setBatches(prev => prev.filter(b => b.batchId !== batchId));
  };

  return (
    <AppDataContext.Provider value={{
      users, courses, sections, sessions, attendance, semesters, enrollments, auditLogs, centers, programs, batches,
      addSection, updateSection, deleteSection, addSemester, setActiveSemester,
      addUser, updateUser, deleteUser, addCourse, updateCourse, deleteCourse,
      addAttendance, updateAttendance, addSession, updateSession, addEnrollment, addAuditLog,
      addCenter, updateCenter, deleteCenter, addProgram, updateProgram, deleteProgram,
      addBatch, updateBatch, deleteBatch, deleteAllStudents, syncWithServer
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
