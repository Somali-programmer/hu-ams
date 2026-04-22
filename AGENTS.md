# System Architecture & Domain Rules
This file contains the strict business logic and architectural constraints for the Haramaya University Attendance System. All code modifications MUST adhere to these rules to prevent system regressions.

## 1. Domain Terminology & Structure
- **Programs**:
  - `Regular`: EXCLUSIVELY allowed at "Main Campus". Each academic year consists of EXACTLY 2 semesters.
  - `Extension`: Allowed at ANY center (Main Campus, Harar, Jigjiga, etc.). Each academic year consists of EXACTLY 3 semesters.
- **Batches & Academic Years**:
  - `current_year = 1` -> "Freshman"
  - `current_year = 2` -> "Junior"
  - `current_year = 3` -> "Senior"
  - `current_year = 4` -> "GC" (Graduating Class)
  - Display these calculated string literals in the UI instead of raw integers where appropriate.

## 2. Enrollment Guarantees (The "Always-Sync" Principle)
- **Database Driven**: DO NOT write imperative auto-enrollment logic in Express.js API routes (e.g., looping through students when a section is created in `server.ts`).
- **Trigger Based**: Auto-enrollment MUST be handled by PostgreSQL Triggers at the database level.
  - When a `section` is created, a database trigger automatically enrolls matching students.
  - When a `student_profile` is created or modified, a database trigger automatically enrolls them in matching active sections.
- **Matching Criteria**: Enrollment intersection is strictly defined as `batch_id` + `center_id`.

## 3. Interaction Design & UI
- **No Mock Data**: Real Supabase backend data only.
- **Instructor Perspective**: "Start Session" should only appear contextually. Course policies are bound to the "Section" rather than globally.
- **Error Handling**: API errors MUST be displayed to the user cleanly via UI notifications mapping to `err.message`, avoiding generic "Failed to fetch" alerts.

## 4. State Transitions
- **Term Advancement (Promote Cohort)**: System relies on a manual administrative "Advance Term" mechanism that increments the `current_semester` for a Batch. 
- **Semester Caps**: Regular programs loop back to Sem 1 and increment `current_year` after reaching Sem 2. Extension programs do the same after hitting Sem 3. Do not automatically advance global semesters or years without administrative execution.
