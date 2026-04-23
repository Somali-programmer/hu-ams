import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { supabaseAdmin } from './server/db/supabase.ts';

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { bulkRegisterStudents } from './server/services/import.service.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const JWT_SECRET = process.env.JWT_SECRET || 'hu-default-secret';

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // API Routes
  app.get('/api/health', async (req, res) => {
    let dbStatus = 'disconnected';
    try {
      const { error } = await supabaseAdmin.from('departments').select('count', { count: 'exact', head: true });
      if (!error) dbStatus = 'connected';
    } catch (err) {
      dbStatus = 'error';
    }

    res.json({ 
      status: 'success', 
      service: 'Haramaya University Attendance System API',
      database: dbStatus,
      timestamp: new Date().toISOString()
    });
  });

  // Auth Routes
  app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;

    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Login attempt failed: Supabase secrets missing.');
      return res.status(500).json({ 
        success: false, 
        message: 'Database configuration error. Please ensure Supabase secrets are set.' 
      });
    }

    try {
      // 1. Find user in database (Case-insensitive check)
      const { data: user, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .ilike('username', username)
        .single();

      if (error || !user) {
        console.log(`Login failed: User not found for username "${username}"`);
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      // 2. Verify password
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        console.log(`Login failed: Password mismatch for user "${username}"`);
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      // 3. Generate JWT
      const token = jwt.sign(
        { userId: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      // 4. Return user data (excluding password)
      const { password_hash, ...userResult } = user;
      res.json({
        success: true,
        token,
        user: {
          userId: userResult.id,
          username: userResult.username,
          email: userResult.username, // Student ID or Staff Email
          role: userResult.role.toLowerCase(),
          fullName: userResult.full_name,
          createdAt: userResult.created_at,
          department: 'Computer Science' // Default for now, could be fetched from profile
        }
      });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  });

  // Get current user from token
  app.get('/api/auth/me', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      const { data: user, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', decoded.userId)
        .single();

      if (error || !user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      const { password_hash, ...userResult } = user;
      res.json({
        success: true,
        user: {
          userId: userResult.id,
          username: userResult.username,
          email: userResult.username,
          role: userResult.role.toLowerCase(),
          fullName: userResult.full_name,
          createdAt: userResult.created_at,
          department: 'Computer Science'
        }
      });
    } catch (err) {
      res.status(401).json({ success: false, message: 'Invalid token' });
    }
  });

  // --- ADMIN ROUTES ---

  // Get foundational data (Departments, Centers, Batches)
  app.get('/api/admin/metadata', async (req, res) => {
    try {
      const [depts, centers, batches] = await Promise.all([
        supabaseAdmin.from('departments').select('*'),
        supabaseAdmin.from('centers').select('*'),
        supabaseAdmin.from('batches').select('*, program:programs(name)')
      ]);

      res.json({
        departments: depts.data,
        centers: centers.data,
        batches: batches.data
      });
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch metadata' });
    }
  });

  // -- DATA RETRIEVAL ROUTES --

  app.get('/api/users', async (req, res) => {
    try {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select(`
          *,
          student_profiles(
            id_number, 
            center_id, 
            batch_id, 
            department_id,
            batches(program_id),
            departments(name)
          ),
          staff_profiles(
            department_id,
            departments(name)
          )
        `);
      
      if (error) throw error;

      const mapped = data.map((u: any) => {
        const studentProfile = Array.isArray(u.student_profiles) ? u.student_profiles[0] : u.student_profiles;
        const staffProfile = Array.isArray(u.staff_profiles) ? u.staff_profiles[0] : u.staff_profiles;
        
        const profile = studentProfile || staffProfile;
        
        let programId = '';
        if (studentProfile?.batches) {
          programId = studentProfile.batches.program_id;
        }

        return {
          userId: u.id,
          fullName: u.full_name,
          email: u.username, 
          role: u.role.toLowerCase(),
          idNumber: studentProfile?.id_number || '',
          center: studentProfile?.center_id || '',
          batch: studentProfile?.batch_id || '',
          programType: programId,
          departmentId: profile?.department_id || '',
          department: profile?.departments?.name || 'Computer Science',
          isActive: true,
          createdAt: u.created_at
        };
      });

      res.json(mapped);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  });

  app.get('/api/centers', async (req, res) => {
    try {
      const { data, error } = await supabaseAdmin.from('centers').select('*');
      if (error) throw error;
      res.json(data.map((c: any) => ({
        centerId: c.id,
        name: c.name,
        location: c.location_metadata?.address || '',
        description: c.description,
        createdAt: c.created_at
      })));
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch centers' });
    }
  });

  app.get('/api/programs', async (req, res) => {
    try {
      const { data, error } = await supabaseAdmin.from('programs').select('*, departments(name)');
      if (error) throw error;
      res.json(data.map((p: any) => ({
        programId: p.id,
        name: p.name,
        durationYears: p.duration_years || 4,
        description: p.description,
        departmentId: p.department_id,
        departmentName: p.departments?.name,
        createdAt: p.created_at
      })));
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch programs' });
    }
  });

  app.get('/api/batches', async (req, res) => {
    try {
      const { data, error } = await supabaseAdmin.from('batches').select('*, programs(name)');
      if (error) throw error;
      res.json(data.map((b: any) => ({
        batchId: b.id,
        name: b.name,
        entryYear: String(b.entry_year),
        currentYear: b.current_year || 1,
        currentSemester: b.current_semester || 1,
        expectedGraduation: b.expected_graduation || '',
        programId: b.program_id,
        programName: b.programs?.name,
        createdAt: b.created_at
      })));
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch batches' });
    }
  });

  app.get('/api/enrollments', async (req, res) => {
    try {
      const { data, error } = await supabaseAdmin.from('enrollments').select('*');
      if (error) throw error;
      res.json(data.map((e: any) => ({
        enrollmentId: e.id,
        studentId: e.student_id,
        sectionId: e.section_id,
        enrolledAt: e.enrolled_at,
        status: e.status,
        grade: e.grade
      })));
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch enrollments' });
    }
  });

  app.get('/api/sections', async (req, res) => {
    try {
      const { data, error } = await supabaseAdmin
        .from('sections')
        .select(`
          *, 
          courses(course_code, title), 
          semesters(name, start_date, end_date), 
          centers(name), 
          batches(name, program_id)
        `);
      
      if (error) throw error;

      res.json(data.map((s: any) => ({
        sectionId: s.id,
        courseId: s.course_id,
        instructorId: s.instructor_id,
        semesterId: s.semester_id,
        batchId: s.batch_id,
        center: s.center_id,
        programType: s.program_id || s.batches?.program_id,
        room: s.room,
        schedule: s.schedule || [],
        startDate: s.start_date || s.semesters?.start_date,
        endDate: s.end_date || s.semesters?.end_date,
        meetingDates: s.meeting_dates || [],
        midExamDates: s.mid_exam_dates || [],
        finalExamDates: s.final_exam_dates || [],
        geofenceCenter: s.geofence_config?.center || { latitude: 9.35, longitude: 42.8 },
        geofenceRadius: s.geofence_config?.radius || 100,
        coursePolicy: s.course_policy || '',
        attendanceActive: false
      })));
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch sections' });
    }
  });

  // Centers
  app.post('/api/centers', async (req, res) => {
    try {
      const { name, location, description } = req.body;
      const { data, error } = await supabaseAdmin.from('centers').insert({
        name,
        location_metadata: { address: location },
        description
      }).select().single();
      if (error) throw error;
      res.json(data);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.put('/api/centers/:id', async (req, res) => {
    try {
      const { name, location, address, description } = req.body;
      const { error } = await supabaseAdmin.from('centers').update({
        name,
        location_metadata: { address: location || address },
        description
      }).eq('id', req.params.id);
      if (error) throw error;
      res.json({ success: true });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  // Programs
  app.post('/api/programs', async (req, res) => {
    try {
      const { name, durationYears, description, departmentId } = req.body;
      
      let finalDeptId = departmentId;
      if (!finalDeptId) {
        const { data: dept } = await supabaseAdmin.from('departments').select('id').limit(1).single();
        finalDeptId = dept?.id;
      }

      if (!finalDeptId) throw new Error('No department found for program');

      const { data, error } = await supabaseAdmin.from('programs').insert({
        name,
        duration_years: durationYears,
        description,
        department_id: finalDeptId
      }).select().single();
      if (error) throw error;
      res.json(data);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.put('/api/programs/:id', async (req, res) => {
    try {
      const { name, durationYears, description, departmentId } = req.body;
      const updateData: any = {
        name,
        duration_years: durationYears,
        description
      };
      if (departmentId) updateData.department_id = departmentId;
      
      const { error } = await supabaseAdmin.from('programs').update(updateData).eq('id', req.params.id);
      if (error) throw error;
      res.json({ success: true });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  // Batches
  app.post('/api/batches', async (req, res) => {
    try {
      const { name, entryYear, currentYear, currentSemester, expectedGraduation, programId } = req.body;
      
      let finalProgramId = programId;
      if (!finalProgramId) {
        const { data: prog } = await supabaseAdmin.from('programs').select('id').limit(1).single();
        finalProgramId = prog?.id;
      }

      if (!finalProgramId) throw new Error('No program found for batch');

      const { data, error } = await supabaseAdmin.from('batches').insert({
        name,
        entry_year: parseInt(entryYear),
        current_year: currentYear,
        current_semester: currentSemester || 1,
        expected_graduation: expectedGraduation,
        program_id: finalProgramId
      }).select().single();
      if (error) throw error;
      res.json(data);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.put('/api/batches/:id', async (req, res) => {
    try {
      const { id } = req.params;
      // Basic UUID validation to prevent database driver errors
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      
      if (!isUUID) {
        return res.status(400).json({ error: 'Invalid Batch ID format' });
      }

      const { name, entryYear, currentYear, currentSemester, expectedGraduation, programId } = req.body;
      const updateData: any = {
        name,
        entry_year: entryYear ? parseInt(entryYear) : undefined,
        current_year: currentYear,
        current_semester: currentSemester,
        expected_graduation: expectedGraduation
      };
      if (programId) updateData.program_id = programId;

      const { error } = await supabaseAdmin.from('batches').update(updateData).eq('id', id);
      if (error) throw error;
      res.json({ success: true });
    } catch (err: any) { 
      console.error('Update Batch Error:', err);
      res.status(500).json({ error: err.message }); 
    }
  });

  // Courses
  app.get('/api/courses', async (req, res) => {
    try {
      const { data, error } = await supabaseAdmin.from('courses').select('*, departments(name)');
      if (error) throw error;
      res.json(data.map((c: any) => ({
        courseId: c.id,
        courseCode: c.course_code,
        title: c.title,
        creditHours: c.credit_hours,
        departmentId: c.department_id,
        department: c.departments?.name || 'Computer Science'
      })));
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.post('/api/courses', async (req, res) => {
    try {
      const { courseCode, title, creditHours, departmentId } = req.body;

      let finalDeptId = departmentId;
      if (!finalDeptId) {
        const { data: dept } = await supabaseAdmin.from('departments').select('id').limit(1).single();
        finalDeptId = dept?.id;
      }

      if (!finalDeptId) throw new Error('No department found for course');

      const { data, error } = await supabaseAdmin.from('courses').insert({
        course_code: courseCode,
        title,
        credit_hours: creditHours,
        department_id: finalDeptId
      }).select().single();
      if (error) throw error;
      res.json(data);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.put('/api/courses/:id', async (req, res) => {
    try {
      const { courseCode, title, creditHours, departmentId } = req.body;
      const updateData: any = {
        course_code: courseCode,
        title,
        credit_hours: creditHours
      };
      if (departmentId) updateData.department_id = departmentId;

      const { error } = await supabaseAdmin.from('courses').update(updateData).eq('id', req.params.id);
      if (error) throw error;
      res.json({ success: true });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  // Semesters
  app.get('/api/semesters', async (req, res) => {
    try {
      const { data, error } = await supabaseAdmin.from('semesters').select('*');
      if (error) throw error;
      res.json(data.map((s: any) => ({
        semesterId: s.id,
        name: s.name,
        startDate: s.start_date,
        endDate: s.end_date,
        isActive: s.is_active
      })));
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.post('/api/semesters', async (req, res) => {
    try {
      const { name, startDate, endDate, isActive } = req.body;
      if (isActive) {
        await supabaseAdmin.from('semesters').update({ is_active: false }).eq('is_active', true);
      }
      const { data, error } = await supabaseAdmin.from('semesters').insert({
        name,
        start_date: startDate,
        end_date: endDate,
        is_active: isActive
      }).select().single();
      if (error) throw error;
      res.json(data);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.put('/api/semesters/:id', async (req, res) => {
    try {
      const { name, startDate, endDate, isActive } = req.body;
      if (isActive) {
        await supabaseAdmin.from('semesters').update({ is_active: false }).eq('is_active', true);
      }
      const { error } = await supabaseAdmin.from('semesters').update({
        name,
        start_date: startDate,
        end_date: endDate,
        is_active: isActive
      }).eq('id', req.params.id);
      if (error) throw error;
      res.json({ success: true });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  // Sections
  app.post('/api/sections', async (req, res) => {
    try {
      const s = req.body;
      const { data, error } = await supabaseAdmin.from('sections').insert({
        course_id: s.courseId,
        instructor_id: s.instructorId,
        semester_id: s.semesterId,
        batch_id: s.batchId || null,
        center_id: s.center || null,
        program_id: s.programType || null,
        room: s.room,
        schedule: s.schedule || [],
        start_date: s.startDate,
        end_date: s.endDate,
        meeting_dates: s.meetingDates || [],
        mid_exam_dates: s.midExamDates || [],
        final_exam_dates: s.finalExamDates || [],
        geofence_config: {
          center: s.geofenceCenter || { latitude: 9.35, longitude: 42.8 },
          radius: s.geofenceRadius || 100
        },
        course_policy: s.coursePolicy || null
      }).select().single();
      if (error) throw error;
      
      const newSection = data;
      res.json(data);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.put('/api/sections/:id', async (req, res) => {
    try {
      const s = req.body;
      const { error } = await supabaseAdmin.from('sections').update({
        course_id: s.courseId,
        instructor_id: s.instructorId,
        semester_id: s.semesterId,
        batch_id: s.batchId || null,
        center_id: s.center || null,
        program_id: s.programType || null,
        room: s.room,
        schedule: s.schedule || [],
        start_date: s.startDate,
        end_date: s.endDate,
        meeting_dates: s.meetingDates || [],
        mid_exam_dates: s.midExamDates || [],
        final_exam_dates: s.finalExamDates || [],
        geofence_config: {
          center: s.geofenceCenter || { latitude: 9.35, longitude: 42.8 },
          radius: s.geofenceRadius || 100
        },
        course_policy: s.coursePolicy || undefined
      }).eq('id', req.params.id);
      if (error) throw error;
      res.json({ success: true });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  // -- DELETE ROUTES --

  app.post('/api/users', async (req, res) => {
    try {
      const { username, fullName, role, email, idNumber, department, departmentId, center_id, centerId, batch_id, batchId } = req.body;
      
      const defaultPassword = `HU@Staff123`;
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);

      const finalCenterId = center_id || centerId;
      const finalBatchId = batch_id || batchId;
      let finalDeptId = departmentId;

      if (!finalDeptId && department) {
        const { data: dept } = await supabaseAdmin.from('departments').select('id').ilike('name', department).limit(1).single();
        finalDeptId = dept?.id;
      }
      
      if (!finalDeptId) {
        const { data: dept } = await supabaseAdmin.from('departments').select('id').limit(1).single();
        finalDeptId = dept?.id;
      }

      const { data: user, error: userError } = await supabaseAdmin
        .from('users')
        .insert({
          username: email || username,
          password_hash: hashedPassword,
          role: role.toUpperCase(),
          full_name: fullName
        })
        .select()
        .single();

      if (userError) throw userError;

      if (role.toLowerCase() === 'student') {
        const { error: profileError } = await supabaseAdmin
          .from('student_profiles')
          .insert({
            user_id: user.id,
            id_number: idNumber || username,
            center_id: finalCenterId || null,
            batch_id: finalBatchId || null,
            department_id: finalDeptId || null
          });
        if (profileError) throw profileError;
      } else {
        const { error: profileError } = await supabaseAdmin
          .from('staff_profiles')
          .insert({
            user_id: user.id,
            department_id: finalDeptId || null
          });
        if (profileError) throw profileError;
      }

      res.json({ success: true, user: { ...user, userId: user.id } });
    } catch (err: any) {
      console.error('Failed to create user:', err);
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/users/:id', async (req, res) => {
    try {
      const { fullName, role, email, idNumber, center_id, centerId, batch_id, batchId, departmentId, department } = req.body;
      
      const finalCenterId = center_id || centerId;
      const finalBatchId = batch_id || batchId;
      let finalDeptId = departmentId;

      if (!finalDeptId && department) {
        const { data: dept } = await supabaseAdmin.from('departments').select('id').ilike('name', department).limit(1).single();
        finalDeptId = dept?.id;
      }

      const { error: userError } = await supabaseAdmin
        .from('users')
        .update({
          full_name: fullName,
          username: email,
          role: role ? role.toUpperCase() : undefined
        })
        .eq('id', req.params.id);

      if (userError) throw userError;

      if (role?.toLowerCase() === 'student' || (!role && idNumber)) {
        const profileUpdate: any = {
          user_id: req.params.id,
          id_number: idNumber,
          center_id: finalCenterId,
          batch_id: finalBatchId
        };
        if (finalDeptId) profileUpdate.department_id = finalDeptId;

        const { error: profileError } = await supabaseAdmin
          .from('student_profiles')
          .upsert(profileUpdate);
        if (profileError) throw profileError;
      } else if (role?.toLowerCase() === 'instructor' || role?.toLowerCase() === 'admin') {
        const { error: profileError } = await supabaseAdmin
          .from('staff_profiles')
          .upsert({
            user_id: req.params.id,
            department_id: finalDeptId || null
          });
        if (profileError) throw profileError;
      }

      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/users/:id', async (req, res) => {
    try {
      const { error } = await supabaseAdmin.from('users').delete().eq('id', req.params.id);
      if (error) throw error;
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Failed to delete user' });
    }
  });

  app.delete('/api/sections/:id', async (req, res) => {
    try {
      const { error } = await supabaseAdmin.from('sections').delete().eq('id', req.params.id);
      if (error) throw error;
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Failed to delete section' });
    }
  });

  app.delete('/api/courses/:id', async (req, res) => {
    try {
      const { error } = await supabaseAdmin.from('courses').delete().eq('id', req.params.id);
      if (error) throw error;
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Failed to delete course' });
    }
  });

  app.delete('/api/centers/:id', async (req, res) => {
    try {
      const { error } = await supabaseAdmin.from('centers').delete().eq('id', req.params.id);
      if (error) throw error;
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Failed to delete center' });
    }
  });

  app.delete('/api/programs/:id', async (req, res) => {
    try {
      const { error } = await supabaseAdmin.from('programs').delete().eq('id', req.params.id);
      if (error) throw error;
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Failed to delete program' });
    }
  });

  app.delete('/api/batches/:id', async (req, res) => {
    try {
      const { error } = await supabaseAdmin.from('batches').delete().eq('id', req.params.id);
      if (error) throw error;
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Failed to delete batch' });
    }
  });

  // --- SESSIONS & ATTENDANCE ---

  app.get('/api/sessions', async (req, res) => {
    try {
      const { data, error } = await supabaseAdmin.from('sessions').select('*');
      if (error) throw error;
      res.json(data.map((s: any) => ({
        sessionId: s.id,
        sectionId: s.section_id,
        date: s.session_date,
        sessionToken: s.token,
        tokenExpiry: s.token_expiry,
        endTime: s.end_time,
        status: s.status
      })));
    } catch (err) { res.status(500).json({ error: 'Failed to fetch sessions' }); }
  });

  app.post('/api/sessions', async (req, res) => {
    try {
      const s = req.body;
      const { data, error } = await supabaseAdmin.from('sessions').insert({
        section_id: s.sectionId,
        token: s.sessionToken,
        token_expiry: s.tokenExpiry,
        session_date: s.date,
        end_time: s.endTime,
        status: s.status || 'active'
      }).select().single();
      if (error) throw error;
      res.json({
        sessionId: data.id,
        sectionId: data.section_id,
        date: data.session_date,
        sessionToken: data.token,
        tokenExpiry: data.token_expiry,
        endTime: data.end_time,
        status: data.status
      });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.put('/api/sessions/:id', async (req, res) => {
    try {
      const { status } = req.body;
      const { error } = await supabaseAdmin.from('sessions').update({ status }).eq('id', req.params.id);
      if (error) throw error;
      res.json({ success: true });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.get('/api/attendance', async (req, res) => {
    try {
      const { data, error } = await supabaseAdmin.from('attendance').select('*');
      if (error) throw error;
      res.json(data.map((a: any) => ({
        attendanceId: a.id,
        sessionId: a.session_id,
        studentId: a.student_id,
        markedAt: a.marked_at,
        status: a.status,
        location: a.metadata?.location || { latitude: 0, longitude: 0 },
        distanceFromCenter: a.metadata?.distance || 0
      })));
    } catch (err) { res.status(500).json({ error: 'Failed to fetch attendance' }); }
  });

  app.post('/api/attendance', async (req, res) => {
    try {
      const a = req.body;
      const { data, error } = await supabaseAdmin.from('attendance').insert({
        session_id: a.sessionId,
        student_id: a.studentId,
        status: a.status,
        marked_at: a.markedAt,
        metadata: {
          location: a.location,
          distance: a.distanceFromCenter
        }
      }).select().single();
      if (error) throw error;
      res.json(data);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  // Bulk Register Students
  app.post('/api/admin/students/bulk', async (req, res) => {
    const { students, departmentId } = req.body;
    
    if (!students || !Array.isArray(students)) {
      return res.status(400).json({ error: 'Invalid students list' });
    }

    try {
      const results = await bulkRegisterStudents(students, departmentId);
      res.json(results);
    } catch (err) {
      res.status(500).json({ error: 'Bulk registration failed' });
    }
  });

  // Vite Middleware for Development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`
    ================================================
       HARAMAYA UNIVERSITY ATTENDANCE SYSTEM
    ================================================
       Server is running on http://0.0.0.0:${PORT}
       Backend: Node.js / Express.js
       Database: Supabase / PostgreSQL (Active)
    ================================================
    `);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
