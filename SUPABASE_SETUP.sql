-- HARAMAYA UNIVERSITY ATTENDANCE SYSTEM
-- SUPABASE / POSTGRESQL SCHEMA SETUP

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('ADMIN', 'INSTRUCTOR', 'QA', 'STUDENT');
    CREATE TYPE session_status AS ENUM ('active', 'completed', 'cancelled');
    CREATE TYPE attendance_status AS ENUM ('present', 'late', 'absent');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. TABLES

-- Organizational Hierarchy
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE programs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- e.g., Regular, Extension
    UNIQUE(department_id, name)
);

CREATE TABLE centers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE, -- e.g., Main Campus, Jigjiga, Harar
    location_metadata JSONB -- Stores default coords for campus
);

CREATE TABLE batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
    entry_year INTEGER NOT NULL,
    name TEXT NOT NULL, -- e.g., 2023 Batch
    UNIQUE(program_id, name)
);

CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
    course_code TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    credit_hours INTEGER DEFAULT 3
);

CREATE TABLE semesters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT false,
    start_date DATE,
    end_date DATE
);

-- User Management
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username TEXT NOT NULL UNIQUE, -- Staff Email or Student ID
    password_hash TEXT NOT NULL,
    role user_role NOT NULL,
    full_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE student_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    id_number TEXT NOT NULL UNIQUE,
    batch_id UUID REFERENCES batches(id) ON DELETE SET NULL,
    center_id UUID REFERENCES centers(id) ON DELETE SET NULL,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL
);

-- Academic Workflow
CREATE TABLE sections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    instructor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    semester_id UUID REFERENCES semesters(id) ON DELETE CASCADE,
    batch_id UUID REFERENCES batches(id) ON DELETE CASCADE,
    center_id UUID REFERENCES centers(id) ON DELETE CASCADE,
    geofence_config JSONB, -- {lat, lng, radius}
    course_policy TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    section_id UUID REFERENCES sections(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMPTZ DEFAULT NOW(),
    status TEXT DEFAULT 'active',
    UNIQUE(student_id, section_id)
);

-- Attendance Logic
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    section_id UUID REFERENCES sections(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    token_expiry TIMESTAMPTZ NOT NULL,
    session_date DATE DEFAULT CURRENT_DATE,
    end_time TIMESTAMPTZ,
    status session_status DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    marked_at TIMESTAMPTZ DEFAULT NOW(),
    status attendance_status DEFAULT 'present',
    policy_accepted BOOLEAN DEFAULT true,
    metadata JSONB, -- {distance, ip, device}
    UNIQUE(session_id, student_id)
);

-- Audit
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action TEXT NOT NULL,
    performed_by UUID REFERENCES users(id),
    entity_type TEXT,
    entity_id UUID,
    details TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ROW LEVEL SECURITY (RLS) - Example for Attendance
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- Students can read their own attendance
CREATE POLICY "Students see own attendance" ON attendance
    FOR SELECT USING (auth.uid() = student_id);

-- Instructors see attendance for their sections
CREATE POLICY "Instructors see section attendance" ON attendance
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM sessions s
            JOIN sections sec ON s.section_id = sec.id
            WHERE s.id = attendance.session_id AND sec.instructor_id = auth.uid()
        )
    );

-- 5. INITIAL DATA (BOOTSTRAP)
INSERT INTO departments (name) VALUES ('Computer Science');
