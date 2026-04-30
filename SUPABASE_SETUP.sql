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
    duration_years INTEGER DEFAULT 4,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(department_id, name)
);

CREATE TABLE centers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE, -- e.g., Main Campus, Jigjiga, Harar
    location_metadata JSONB, -- Stores default coords for campus
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
    entry_year INTEGER NOT NULL,
    name TEXT NOT NULL, -- e.g., 2023 Batch
    current_year INTEGER DEFAULT 1,
    current_semester INTEGER DEFAULT 1,
    expected_graduation TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
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
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE staff_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    office_location TEXT,
    bio TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Academic Workflow
CREATE TABLE sections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    instructor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    semester_id UUID REFERENCES semesters(id) ON DELETE CASCADE,
    batch_id UUID REFERENCES batches(id) ON DELETE CASCADE,
    center_id UUID REFERENCES centers(id) ON DELETE CASCADE,
    program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
    room TEXT,
    schedule JSONB DEFAULT '[]', -- Array of {dayOfWeek, startTime, endTime}
    start_date DATE,
    end_date DATE,
    meeting_dates JSONB DEFAULT '[]',
    mid_exam_dates JSONB DEFAULT '[]',
    final_exam_dates JSONB DEFAULT '[]',
    geofence_config JSONB, -- {lat, lng, radius}
    course_policy TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(course_id, semester_id, batch_id, center_id)
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
    metadata JSONB, -- {lateThreshold, startTime}
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

-- 5. AUTO-ENROLLMENT TRIGGERS (Declarative Architecture)

-- Function: Auto-enroll student into active sections when a student profile is created or updated
CREATE OR REPLACE FUNCTION sync_enrollment_on_student_change()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.batch_id IS NOT NULL AND NEW.center_id IS NOT NULL THEN
        INSERT INTO enrollments (student_id, section_id, enrolled_at, status)
        SELECT NEW.user_id, sec.id, NOW(), 'active'
        FROM sections sec
        WHERE sec.batch_id = NEW.batch_id
          AND sec.center_id = NEW.center_id
        ON CONFLICT (student_id, section_id) DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sync_enrollment_student
AFTER INSERT OR UPDATE OF batch_id, center_id
ON student_profiles
FOR EACH ROW
EXECUTE FUNCTION sync_enrollment_on_student_change();


-- Function: Auto-enroll all matching students when a new section is created or updated
CREATE OR REPLACE FUNCTION sync_enrollment_on_section_change()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.batch_id IS NOT NULL AND NEW.center_id IS NOT NULL THEN
        INSERT INTO enrollments (student_id, section_id, enrolled_at, status)
        SELECT sp.user_id, NEW.id, NOW(), 'active'
        FROM student_profiles sp
        WHERE sp.batch_id = NEW.batch_id
          AND sp.center_id = NEW.center_id
        ON CONFLICT (student_id, section_id) DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sync_enrollment_section
AFTER INSERT OR UPDATE OF batch_id, center_id
ON sections
FOR EACH ROW
EXECUTE FUNCTION sync_enrollment_on_section_change();


-- 6. ROW LEVEL SECURITY (RLS) - Example for Attendance
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
