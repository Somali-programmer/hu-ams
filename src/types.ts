/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'student' | 'instructor' | 'admin' | 'qa';
export type ProgramType = string; // Changed from union to string to support dynamic programs
export type Center = string;
export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

export interface CenterInfo {
  centerId: string;
  name: string;
  location?: string;
  description?: string;
  createdAt: string;
}

export interface ProgramInfo {
  programId: string;
  name: string;
  durationYears: number;
  departmentId?: string;
  description?: string;
  createdAt: string;
}

export interface BatchInfo {
  batchId: string;
  name: string; // e.g., "Year 3 (2015 Entry)"
  entryYear: string;
  currentYear: number;
  currentSemester?: number;
  expectedGraduation: string;
  programId?: string;
  createdAt: string;
}

export interface ScheduleBlock {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
}

export interface User {
  userId: string;
  idNumber?: string;
  email: string;
  role: UserRole;
  fullName: string;
  department: string;
  phone?: string;
  createdAt: string;
  isActive: boolean;
  departmentId?: string;
  programType?: ProgramType;
  center?: Center;
  batch?: string;
}

export interface Course {
  courseId: string;
  courseCode: string;
  title: string;
  creditHours: number;
  department: string;
  departmentId?: string;
}

export interface Semester {
  semesterId: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface Enrollment {
  enrollmentId: string;
  studentId: string;
  sectionId: string;
  enrolledAt: string;
  grade?: string; // To track passed courses
  status: 'active' | 'completed' | 'dropped';
}

export interface Section {
  sectionId: string;
  courseId: string;
  instructorId: string;
  semesterId: string;
  room: string;
  programType: ProgramType;
  center: Center;
  batchId?: string;
  startDate: string;
  endDate: string;
  schedule: ScheduleBlock[];
  meetingDates?: string[]; // Specific dates for extension/weekend programs
  midExamDates?: string[];
  finalExamDates?: string[];
  geofenceCenter: {
    latitude: number;
    longitude: number;
  };
  geofenceRadius: number; // in meters
  coursePolicy?: string; // Policy defined by instructor
}

export interface ClassSession {
  sessionId: string;
  sectionId: string;
  date: string;
  sessionToken: string;
  tokenExpiry: string;
  endTime?: string;
  status: 'active' | 'expired' | 'completed';
}

export interface Attendance {
  attendanceId: string;
  studentId: string;
  sessionId: string;
  status: 'present' | 'late' | 'absent';
  markedAt: string;
  location: {
    latitude: number;
    longitude: number;
  };
  distanceFromCenter: number;
  policyAcceptedAt?: string; // Timestamp when student agreed to course policy
}

export interface AuditLog {
  logId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  entityType: 'USER' | 'COURSE' | 'SECTION' | 'SEMESTER' | 'CENTER' | 'PROGRAM' | 'BATCH';
  entityId: string;
  entityName: string;
  performedBy: string;
  timestamp: string;
  details?: string;
}
