import bcrypt from 'bcryptjs';
import { supabaseAdmin } from './server/db/hu_ams_client';
import dotenv from 'dotenv';

dotenv.config();

async function seed() {
  console.log('🌱 Starting database seed...');

  const adminPassword = 'admin'; // In production, this would be a secret
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  const { data, error } = await supabaseAdmin
    .from('users')
    .upsert({
      username: 'admin@hu.edu.et',
      password_hash: hashedPassword,
      role: 'ADMIN',
      full_name: 'Haramaya Admin'
    }, { onConflict: 'username' })
    .select();

  if (error) {
    console.error('❌ Error seeding admin:', error);
    process.exit(1);
  }

  console.log('✅ Admin user created successfully!');
  console.log('-----------------------------------');
  console.log('Username: admin@hu.edu.et');
  console.log('Password: admin');
  console.log('-----------------------------------');
  
  // 2. Seed Centers
  const centers = [
    { name: 'Main Campus', location_metadata: { lat: 9.414, lng: 42.034 } },
    { name: 'Harar Campus', location_metadata: { lat: 9.313, lng: 42.118 } },
    { name: 'Jigjiga Center', location_metadata: { lat: 9.351, lng: 42.793 } }
  ];

  for (const center of centers) {
    await supabaseAdmin.from('centers').upsert(center, { onConflict: 'name' });
  }
  console.log('✅ University Centers seeded.');

  // 3. Seed Programs for CS Dept
  const csDept = (await supabaseAdmin.from('departments').select('id').eq('name', 'Computer Science').single()).data;
  
  const programs = [
    { department_id: csDept.id, name: 'Regular' },
    { department_id: csDept.id, name: 'Extension' },
    { department_id: csDept.id, name: 'Summer' }
  ];

  for (const prog of programs) {
    await supabaseAdmin.from('programs').upsert(prog, { onConflict: 'department_id, name' });
  }
  console.log('✅ Academic Programs seeded.');

  // 4. Seed Batches
  const regularProg = (await supabaseAdmin.from('programs').select('id').eq('name', 'Regular').eq('department_id', csDept.id).single()).data;
  const extensionProg = (await supabaseAdmin.from('programs').select('id').eq('name', 'Extension').eq('department_id', csDept.id).single()).data;
  
  const batches = [
    { program_id: regularProg.id, entry_year: 2023, name: '2023 Batch' },
    { program_id: regularProg.id, entry_year: 2024, name: '2024 Batch' },
    { program_id: extensionProg.id, entry_year: 2023, name: '2023 Batch' },
    { program_id: extensionProg.id, entry_year: 2024, name: '2024 Batch' }
  ];

  for (const batch of batches) {
    await supabaseAdmin.from('batches').upsert(batch, { onConflict: 'program_id, name' });
  }
  console.log('✅ Student Batches seeded.');

  // 5. Seed Courses
  const courses = [
    { department_id: csDept.id, course_code: 'CoSc2011', title: 'Data Structures', credit_hours: 4 },
    { department_id: csDept.id, course_code: 'CoSc3021', title: 'Operating Systems', credit_hours: 3 },
    { department_id: csDept.id, course_code: 'CoSc1011', title: 'Fundamentals of Programming', credit_hours: 4 }
  ];

  for (const course of courses) {
    await supabaseAdmin.from('courses').upsert(course, { onConflict: 'course_code' });
  }
  console.log('✅ Courses seeded.');

  // 6. Seed active semester
  let semester = (await supabaseAdmin.from('semesters').select('id').eq('name', '2024 Semester I').maybeSingle()).data;
  
  if (!semester) {
    const { data: newSemester, error: semError } = await supabaseAdmin.from('semesters').insert({
      name: '2024 Semester I',
      is_active: true,
      start_date: '2024-09-01',
      end_date: '2025-01-30'
    }).select().single();
    
    if (semError) console.error('❌ Semester seeding failed:', semError.message);
    semester = newSemester;
  }
  console.log('✅ Active Semester handled.');

  // 7. Seed Sections for Main Campus 2023 Batch
  const mainCampusData = (await supabaseAdmin.from('centers').select('id').eq('name', 'Main Campus').single()).data;
  const batch2023Data = (await supabaseAdmin.from('batches').select('id').eq('name', '2023 Batch').eq('program_id', regularProg.id).single()).data;
  const dsCourseData = (await supabaseAdmin.from('courses').select('id').eq('course_code', 'CoSc2011').single()).data;

  if (mainCampusData && batch2023Data && dsCourseData && semester) {
    const section = {
      course_id: dsCourseData.id,
      semester_id: semester.id,
      batch_id: batch2023Data.id,
      center_id: mainCampusData.id,
      instructor_id: data[0].id, // Assign to admin for now
      course_policy: 'Attendance is mandatory (minimum 85%).'
    };

    const { data: existingSection } = await supabaseAdmin
      .from('sections')
      .select('id')
      .eq('course_id', section.course_id)
      .eq('semester_id', section.semester_id)
      .eq('batch_id', section.batch_id)
      .eq('center_id', section.center_id)
      .maybeSingle();

    if (!existingSection) {
      const { error: sectionError } = await supabaseAdmin.from('sections').insert(section);
      if (sectionError) console.warn('⚠️ Section seeding warning:', sectionError.message);
      else console.log('✅ Course Sections seeded.');
    } else {
      console.log('✅ Section already exists.');
    }
  } else {
    console.warn('⚠️ Skipping section seeding due to missing relations:', {
      hasCenter: !!mainCampusData,
      hasBatch: !!batch2023Data,
      hasCourse: !!dsCourseData,
      hasSemester: !!semester
    });
  }

  process.exit(0);
}

seed();
