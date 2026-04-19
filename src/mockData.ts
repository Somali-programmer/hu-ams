import { User, Course, Section, ClassSession, Attendance, Semester, Enrollment, CenterInfo, ProgramInfo, BatchInfo } from './types';

export const MOCK_CENTERS: CenterInfo[] = [
  {
    centerId: 'main',
    name: 'Main Campus',
    location: 'Haramaya',
    description: 'The primary university campus.',
    createdAt: new Date().toISOString()
  },
  {
    centerId: 'jigjiga',
    name: 'Jigjiga Center',
    location: 'Jigjiga',
    description: 'Extension center located in Jigjiga.',
    createdAt: new Date().toISOString()
  },
  {
    centerId: 'harer',
    name: 'Harer Center',
    location: 'Harer',
    description: 'Extension center located in Harer.',
    createdAt: new Date().toISOString()
  }
];

export const MOCK_PROGRAMS: ProgramInfo[] = [
  {
    programId: 'prog-regular',
    name: 'Regular',
    durationYears: 4,
    description: 'Standard full-time day program.',
    createdAt: new Date().toISOString()
  },
  {
    programId: 'prog-extension',
    name: 'Extension',
    durationYears: 5,
    description: 'Weekend and evening program for working professionals.',
    createdAt: new Date().toISOString()
  },
  {
    programId: 'prog-summer',
    name: 'Summer',
    durationYears: 5,
    description: 'Intensive summer program.',
    createdAt: new Date().toISOString()
  }
];

export const MOCK_BATCHES: BatchInfo[] = [
  {
    batchId: 'batch-2015',
    name: 'Year 3 (2015 Entry)',
    entryYear: '2015',
    currentYear: 3,
    expectedGraduation: '2019',
    createdAt: new Date().toISOString()
  },
  {
    batchId: 'batch-2016',
    name: 'Year 2 (2016 Entry)',
    entryYear: '2016',
    currentYear: 2,
    expectedGraduation: '2020',
    createdAt: new Date().toISOString()
  },
  {
    batchId: 'batch-2014',
    name: 'Year 4 (2014 Entry)',
    entryYear: '2014',
    currentYear: 4,
    expectedGraduation: '2018',
    createdAt: new Date().toISOString()
  }
];

export const MOCK_USERS: User[] = [
  // Instructors
  {
    userId: 'inst-1',
    email: 'araba.a@haramaya.edu.et',
    role: 'instructor',
    fullName: 'Araba A.',
    department: 'Computer Science',
    createdAt: new Date().toISOString(),
    isActive: true,
  },
  {
    userId: 'inst-2',
    email: 'wabi.j@haramaya.edu.et',
    role: 'instructor',
    fullName: 'Wabi J.',
    department: 'Computer Science',
    createdAt: new Date().toISOString(),
    isActive: true,
  },
  {
    userId: 'inst-3',
    email: 'asedo.sh@haramaya.edu.et',
    role: 'instructor',
    fullName: 'Asedo Sh.',
    department: 'Computer Science',
    createdAt: new Date().toISOString(),
    isActive: true,
  },
  {
    userId: 'inst-4',
    email: 'sadam.u@haramaya.edu.et',
    role: 'instructor',
    fullName: 'Sadam U.',
    department: 'Computer Science',
    createdAt: new Date().toISOString(),
    isActive: true,
  },
  {
    userId: 'inst-5',
    email: 'abebe.k@haramaya.edu.et',
    role: 'instructor',
    fullName: 'Dr. Abebe Kebede',
    department: 'Computer Science',
    createdAt: new Date().toISOString(),
    isActive: true,
  },
  // Students
  {
    userId: 'std-1',
    idNumber: '0328/15',
    email: 'mustafe.kadar@haramaya.edu.et',
    role: 'student',
    fullName: 'Mustafe Kadar Kalif',
    department: 'Computer Science',
    createdAt: new Date().toISOString(),
    isActive: true,
    programType: 'prog-1',
    center: 'center-1',
  },
  {
    userId: 'std-2',
    idNumber: '0300/15',
    email: 'dahir.bashir@haramaya.edu.et',
    role: 'student',
    fullName: 'DAHIR BASHIR MAHAMED',
    department: 'Computer Science',
    createdAt: new Date().toISOString(),
    isActive: true,
    programType: 'prog-1',
    center: 'center-1',
  },
  {
    userId: 'std-3',
    idNumber: '0320/15',
    email: 'mohamed.abdulahi@haramaya.edu.et',
    role: 'student',
    fullName: 'Mohamed Abdulahi Sharif',
    department: 'Computer Science',
    createdAt: new Date().toISOString(),
    isActive: true,
    programType: 'prog-2',
    center: 'center-3',
  },
  {
    userId: 'std-4',
    idNumber: '0322/15',
    email: 'mohamed.hassen@haramaya.edu.et',
    role: 'student',
    fullName: 'Mohamed Hassen Abdulahi',
    department: 'Computer Science',
    createdAt: new Date().toISOString(),
    isActive: true,
    programType: 'prog-2',
    center: 'center-3',
  },
  {
    userId: 'std-5',
    idNumber: '0329/15',
    email: 'nasradin.tahir@haramaya.edu.et',
    role: 'student',
    fullName: 'Nasradin Tahir Jama',
    department: 'Computer Science',
    createdAt: new Date().toISOString(),
    isActive: true,
    programType: 'prog-1',
    center: 'center-1',
  },
  {
    userId: 'std-6',
    idNumber: '0331/15',
    email: 'mawlid.mahamed@haramaya.edu.et',
    role: 'student',
    fullName: 'Mawlid Mahamed Abdi',
    department: 'Computer Science',
    createdAt: new Date().toISOString(),
    isActive: true,
    programType: 'prog-1',
    center: 'center-1',
  },
  {
    userId: 'std-7',
    idNumber: '0335/15',
    email: 'ahmed.ali@haramaya.edu.et',
    role: 'student',
    fullName: 'Ahmed Ali Hassan',
    department: 'Computer Science',
    createdAt: new Date().toISOString(),
    isActive: true,
    programType: 'prog-1',
    center: 'center-1',
  },
  {
    userId: 'std-8',
    idNumber: '0340/15',
    email: 'fatuma.ibrahim@haramaya.edu.et',
    role: 'student',
    fullName: 'Fatuma Ibrahim Ahmed',
    department: 'Computer Science',
    createdAt: new Date().toISOString(),
    isActive: true,
    programType: 'prog-2',
    center: 'center-2',
  },
  {
    userId: 'std-9',
    idNumber: '0345/15',
    email: 'khalid.omar@haramaya.edu.et',
    role: 'student',
    fullName: 'Khalid Omar Yusuf',
    department: 'Computer Science',
    createdAt: new Date().toISOString(),
    isActive: true,
    programType: 'prog-2',
    center: 'center-2',
  },
  {
    userId: 'std-10',
    idNumber: '0350/15',
    email: 'samira.abdi@haramaya.edu.et',
    role: 'student',
    fullName: 'Samira Abdi Mohamed',
    department: 'Computer Science',
    createdAt: new Date().toISOString(),
    isActive: true,
    programType: 'prog-1',
    center: 'center-1',
  },
  // Admin & QA
  {
    userId: 'admin-1',
    email: 'admin@haramaya.edu.et',
    role: 'admin',
    fullName: 'System Administrator',
    department: 'ICT Directorate',
    createdAt: new Date().toISOString(),
    isActive: true,
  },
  {
    userId: 'qa-1',
    email: 'qa@haramaya.edu.et',
    role: 'qa',
    fullName: 'Quality Assurance Officer',
    department: 'Academic Affairs',
    createdAt: new Date().toISOString(),
    isActive: true,
  },
];

export const MOCK_USER = MOCK_USERS[0]; // Default for backward compatibility

export const MOCK_COURSES: Course[] = [
  {
    courseId: 'course-1',
    courseCode: 'CoSc4038',
    title: 'Introduction to Distributed Systems',
    creditHours: 3,
    department: 'Computer Science',
  },
  {
    courseId: 'course-2',
    courseCode: 'CoSc4114',
    title: 'Introduction to Machine Learning',
    creditHours: 3,
    department: 'Computer Science',
  },
  {
    courseId: 'course-3',
    courseCode: 'CoSc4036',
    title: 'Network & System Administration',
    creditHours: 3,
    department: 'Computer Science',
  },
  {
    courseId: 'course-4',
    courseCode: 'Hist1012',
    title: 'History of Ethiopia & the Horn',
    creditHours: 3,
    department: 'Social Sciences',
  },
  {
    courseId: 'course-5',
    courseCode: 'CoSc4125',
    title: 'Final year Project I',
    creditHours: 3,
    department: 'Computer Science',
  },
  {
    courseId: 'course-6',
    courseCode: 'CoSc4132',
    title: 'Selected Topics in Computer Science',
    creditHours: 3,
    department: 'Computer Science',
  },
  {
    courseId: 'course-7',
    courseCode: 'CoSc4116',
    title: 'Elective II (Natural Language Processing)',
    creditHours: 3,
    department: 'Computer Science',
  },
  {
    courseId: 'course-8',
    courseCode: 'CoSc4126',
    title: 'Final Year Project II',
    creditHours: 3,
    department: 'Computer Science',
  },
  {
    courseId: 'course-9',
    courseCode: 'CoSc3041',
    title: 'Operating Systems',
    creditHours: 4,
    department: 'Computer Science',
  },
  {
    courseId: 'course-10',
    courseCode: 'CoSc2012',
    title: 'Data Structures and Algorithms',
    creditHours: 4,
    department: 'Computer Science',
  },
];

export const MOCK_SEMESTERS: Semester[] = [
  {
    semesterId: 'sem-1',
    name: 'Fall 2026',
    startDate: '2026-09-01',
    endDate: '2027-01-15',
    isActive: true,
  },
  {
    semesterId: 'sem-2',
    name: 'Spring 2027',
    startDate: '2027-02-01',
    endDate: '2027-06-15',
    isActive: false,
  }
];

export const MOCK_SECTIONS: Section[] = [
  {
    sectionId: 'section-1',
    courseId: 'course-1',
    instructorId: 'inst-1',
    semesterId: 'sem-1',
    room: 'Block 24, Room 102',
    programType: 'prog-1',
    center: 'center-1',
    startDate: '2026-09-01',
    endDate: '2027-01-15',
    schedule: [
      { dayOfWeek: 'Monday', startTime: '08:30', endTime: '10:30' },
      { dayOfWeek: 'Wednesday', startTime: '08:30', endTime: '10:30' }
    ],
    geofenceCenter: { latitude: 9.412, longitude: 42.035 },
    geofenceRadius: 50,
  },
  {
    sectionId: 'section-2',
    courseId: 'course-2',
    instructorId: 'inst-2',
    semesterId: 'sem-1',
    room: 'Block 24, Room 205',
    programType: 'prog-2',
    center: 'center-3',
    startDate: '2026-09-01',
    endDate: '2027-01-15',
    schedule: [
      { dayOfWeek: 'Saturday', startTime: '08:00', endTime: '10:00' },
      { dayOfWeek: 'Saturday', startTime: '10:30', endTime: '12:30' },
      { dayOfWeek: 'Sunday', startTime: '08:00', endTime: '10:00' },
      { dayOfWeek: 'Sunday', startTime: '10:30', endTime: '12:30' }
    ],
    geofenceCenter: { latitude: 9.350, longitude: 42.798 },
    geofenceRadius: 100,
  },
  {
    sectionId: 'section-3',
    courseId: 'course-3',
    instructorId: 'inst-3',
    semesterId: 'sem-1',
    room: 'Block 24, Room 301',
    programType: 'prog-1',
    center: 'center-1',
    startDate: '2026-09-01',
    endDate: '2027-01-15',
    schedule: [
      { dayOfWeek: 'Friday', startTime: '14:00', endTime: '16:00' }
    ],
    geofenceCenter: { latitude: 9.412, longitude: 42.035 },
    geofenceRadius: 50,
  },
];

export const MOCK_ENROLLMENTS: Enrollment[] = [
  // Section 1 (Regular, Main) - Current Semester
  { enrollmentId: 'enr-1', studentId: 'std-1', sectionId: 'section-1', enrolledAt: new Date().toISOString(), status: 'active' },
  { enrollmentId: 'enr-2', studentId: 'std-2', sectionId: 'section-1', enrolledAt: new Date().toISOString(), status: 'active' },
  { enrollmentId: 'enr-3', studentId: 'std-5', sectionId: 'section-1', enrolledAt: new Date().toISOString(), status: 'active' },
  { enrollmentId: 'enr-4', studentId: 'std-6', sectionId: 'section-1', enrolledAt: new Date().toISOString(), status: 'active' },
  
  // Section 2 (Extension, Jigjiga) - Current Semester
  { enrollmentId: 'enr-5', studentId: 'std-3', sectionId: 'section-2', enrolledAt: new Date().toISOString(), status: 'active' },
  { enrollmentId: 'enr-6', studentId: 'std-4', sectionId: 'section-2', enrolledAt: new Date().toISOString(), status: 'active' },
  
  // Section 3 (Regular, Main) - Current Semester
  { enrollmentId: 'enr-7', studentId: 'std-1', sectionId: 'section-3', enrolledAt: new Date().toISOString(), status: 'active' },
  { enrollmentId: 'enr-8', studentId: 'std-2', sectionId: 'section-3', enrolledAt: new Date().toISOString(), status: 'active' },

  // Historical Data for std-1 (Mustafe)
  { enrollmentId: 'enr-hist-1', studentId: 'std-1', sectionId: 'section-hist-1', enrolledAt: '2025-02-01', status: 'completed', grade: 'A' },
  { enrollmentId: 'enr-hist-2', studentId: 'std-1', sectionId: 'section-hist-2', enrolledAt: '2025-02-01', status: 'completed', grade: 'B+' },
  { enrollmentId: 'enr-hist-3', studentId: 'std-1', sectionId: 'section-hist-3', enrolledAt: '2025-09-01', status: 'completed', grade: 'A-' },
];

export const MOCK_HISTORICAL_SECTIONS: Section[] = [
  {
    sectionId: 'section-hist-1',
    courseId: 'course-9', // Operating Systems
    instructorId: 'inst-5',
    semesterId: 'sem-old-1',
    room: 'Block 24, Room 101',
    programType: 'prog-regular',
    center: 'main',
    startDate: '2025-02-01',
    endDate: '2025-06-15',
    schedule: [],
    geofenceCenter: { latitude: 9.412, longitude: 42.035 },
    geofenceRadius: 50,
  },
  {
    sectionId: 'section-hist-2',
    courseId: 'course-10', // Data Structures
    instructorId: 'inst-5',
    semesterId: 'sem-old-1',
    room: 'Block 24, Room 101',
    programType: 'prog-regular',
    center: 'main',
    startDate: '2025-02-01',
    endDate: '2025-06-15',
    schedule: [],
    geofenceCenter: { latitude: 9.412, longitude: 42.035 },
    geofenceRadius: 50,
  },
  {
    sectionId: 'section-hist-3',
    courseId: 'course-4', // History
    instructorId: 'inst-4',
    semesterId: 'sem-old-2',
    room: 'Block 24, Room 101',
    programType: 'prog-regular',
    center: 'main',
    startDate: '2025-09-01',
    endDate: '2026-01-15',
    schedule: [],
    geofenceCenter: { latitude: 9.412, longitude: 42.035 },
    geofenceRadius: 50,
  },
];

export const MOCK_HISTORICAL_SEMESTERS: Semester[] = [
  {
    semesterId: 'sem-old-1',
    name: 'Spring 2025',
    startDate: '2025-02-01',
    endDate: '2025-06-15',
    isActive: false,
  },
  {
    semesterId: 'sem-old-2',
    name: 'Fall 2025',
    startDate: '2025-09-01',
    endDate: '2026-01-15',
    isActive: false,
  },
];

export const MOCK_SESSIONS: ClassSession[] = [
  {
    sessionId: 'session-1',
    sectionId: 'section-1',
    date: new Date().toISOString(),
    sessionToken: 'A4B7C2',
    tokenExpiry: new Date(Date.now() + 15 * 60000).toISOString(),
    endTime: new Date(Date.now() + 90 * 60000).toISOString(),
    status: 'active',
  },
];

export const MOCK_ATTENDANCE: Attendance[] = [
  {
    attendanceId: 'att-1',
    studentId: 'student-1',
    sessionId: 'session-1',
    status: 'present',
    markedAt: new Date().toISOString(),
    location: { latitude: 9.4121, longitude: 42.0351 },
    distanceFromCenter: 12,
  },
];
