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
