/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'student' | 'instructor' | 'admin' | 'qa';

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
}

export interface Course {
  courseId: string;
  courseCode: string;
  title: string;
  creditHours: number;
  department: string;
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
}

export interface Section {
  sectionId: string;
  courseId: string;
  instructorId: string;
  semesterId: string;
  room: string;
  schedule: string;
  geofenceCenter: {
    latitude: number;
    longitude: number;
  };
  geofenceRadius: number; // in meters
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
}
