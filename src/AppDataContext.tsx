import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User, Course, Section, ClassSession, Attendance, Semester, Enrollment } from './types';
import { MOCK_USERS, MOCK_COURSES, MOCK_SECTIONS, MOCK_SESSIONS, MOCK_ATTENDANCE, MOCK_SEMESTERS, MOCK_ENROLLMENTS } from './mockData';

interface AppDataContextType {
  users: User[];
  courses: Course[];
  sections: Section[];
  sessions: ClassSession[];
  attendance: Attendance[];
  semesters: Semester[];
  enrollments: Enrollment[];
  
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
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

export const AppDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [courses, setCourses] = useState<Course[]>(MOCK_COURSES);
  const [sections, setSections] = useState<Section[]>(MOCK_SECTIONS);
  const [sessions, setSessions] = useState<ClassSession[]>(MOCK_SESSIONS);
  const [attendance, setAttendance] = useState<Attendance[]>(MOCK_ATTENDANCE);
  const [semesters, setSemesters] = useState<Semester[]>(MOCK_SEMESTERS);
  const [enrollments, setEnrollments] = useState<Enrollment[]>(MOCK_ENROLLMENTS);

  const addSection = (section: Section) => {
    setSections(prev => [...prev, section]);
  };

  const updateSection = (sectionId: string, updates: Partial<Section>) => {
    setSections(prev => prev.map(s => s.sectionId === sectionId ? { ...s, ...updates } : s));
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

  const addUser = (user: User) => setUsers(prev => [user, ...prev]);
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

  return (
    <AppDataContext.Provider value={{
      users, courses, sections, sessions, attendance, semesters, enrollments,
      addSection, updateSection, deleteSection, addSemester, setActiveSemester,
      addUser, updateUser, deleteUser, addCourse, updateCourse, deleteCourse,
      addAttendance, addSession, updateSession
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
