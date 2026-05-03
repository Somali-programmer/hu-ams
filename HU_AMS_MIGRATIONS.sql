-- Run these commands in your Supabase SQL Editor to update your database schema

-- 1. Add description to centers
ALTER TABLE centers ADD COLUMN IF NOT EXISTS description TEXT;

-- 2. Add description and duration_years to programs
ALTER TABLE programs ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE programs ADD COLUMN IF NOT EXISTS duration_years INTEGER DEFAULT 4;

-- 3. Add center_id reference to batches
ALTER TABLE batches ADD COLUMN IF NOT EXISTS center_id UUID REFERENCES centers(id);

-- 4. Ensure other batch metadata exists (if missing)
ALTER TABLE batches ADD COLUMN IF NOT EXISTS entry_year INTEGER;
ALTER TABLE batches ADD COLUMN IF NOT EXISTS current_year INTEGER DEFAULT 1;
ALTER TABLE batches ADD COLUMN IF NOT EXISTS current_semester INTEGER DEFAULT 1;
ALTER TABLE batches ADD COLUMN IF NOT EXISTS expected_graduation TEXT;

-- 5. Ensure section metadata exists (if missing)
ALTER TABLE sections ADD COLUMN IF NOT EXISTS meeting_dates JSONB DEFAULT '[]'::jsonb;
ALTER TABLE sections ADD COLUMN IF NOT EXISTS mid_exam_dates JSONB DEFAULT '[]'::jsonb;
ALTER TABLE sections ADD COLUMN IF NOT EXISTS final_exam_dates JSONB DEFAULT '[]'::jsonb;
ALTER TABLE sections ADD COLUMN IF NOT EXISTS geofence_config JSONB DEFAULT '{"center": {"latitude": 9.35, "longitude": 42.8}, "radius": 100}'::jsonb;
ALTER TABLE sections ADD COLUMN IF NOT EXISTS course_policy TEXT;
ALTER TABLE sections ADD COLUMN IF NOT EXISTS program_id UUID REFERENCES programs(id);
ALTER TABLE sections ADD COLUMN IF NOT EXISTS center_id UUID REFERENCES centers(id);
ALTER TABLE sections ADD COLUMN IF NOT EXISTS batch_id UUID REFERENCES batches(id);
 
-- 6. Add metadata to sessions
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS metadata JSONB;

-- 7. Add Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info',
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Enable Row Level Security (RLS) on all tables (Optional but recommended by Supabase)
-- Since the HU-AMS backend uses the Supabase Service Role Key, RLS is naturally bypassed. 
-- You can safely click "Run and enable RLS" in the Supabase UI.
ALTER TABLE IF EXISTS departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS semesters ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS staff_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notifications ENABLE ROW LEVEL SECURITY;

-- 9. PERFORMANCE INDEXES (High-Frequency Query Optimization)
-- Creating B-Tree indexes for relations used in the Dashboard and Authentication.

-- Users & Roles
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Student Profiles linking to Batches/Centers
CREATE INDEX IF NOT EXISTS idx_student_profiles_batch_center ON student_profiles(batch_id, center_id);
CREATE INDEX IF NOT EXISTS idx_staff_profiles_dept ON staff_profiles(department_id);

-- Sections (Crucial for querying what a batch is taking)
CREATE INDEX IF NOT EXISTS idx_sections_composite ON sections(batch_id, center_id, course_id);
CREATE INDEX IF NOT EXISTS idx_sections_instructor ON sections(instructor_id);

-- Enrollments (Optimizing O(1) query lookups)
CREATE INDEX IF NOT EXISTS idx_enrollments_section ON enrollments(section_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON enrollments(student_id);

-- Attendance Engine (Indexing the highest velocity tables)
CREATE INDEX IF NOT EXISTS idx_sessions_section ON sessions(section_id);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_attendance_session ON attendance(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance(student_id);

-- Notifications (Optimizing unread fetches)
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id) WHERE is_read = false;

-- 10. SUPABASE REALTIME CONFIGURATION
-- This enables Postgres logically streaming changes over WebSocket (WAL).

DO $$ 
DECLARE
  t text;
BEGIN
  -- First ensure the basic publication exists (default in Supabase, but safe to check)
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;

  -- Add our high-velocity tables to the Realtime engine, ignoring if already added
  FOR t IN SELECT unnest(ARRAY['notifications', 'attendance', 'sessions', 'sections'])
  LOOP
    BEGIN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', t);
    EXCEPTION WHEN duplicate_object THEN
      NULL; -- Proceed if table is already in the publication
    END;
  END LOOP;
END
$$;