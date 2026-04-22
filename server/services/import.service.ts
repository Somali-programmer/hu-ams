import { supabaseAdmin } from '../db/supabase.ts';
import bcrypt from 'bcryptjs';

export interface StudentImportRow {
  fullName: string;
  idNumber: string;
  batchName: string;
  centerName: string;
  programName: string;
}

export async function bulkRegisterStudents(students: StudentImportRow[], deptId: string) {
  const results = {
    success: 0,
    failed: 0,
    errors: [] as string[]
  };

  for (const studentRow of students) {
    try {
      // 1. Trim and normalize inputs
      const centerName = studentRow.centerName?.trim();
      const batchName = studentRow.batchName?.trim();
      const idNumber = studentRow.idNumber?.trim();
      const fullName = studentRow.fullName?.trim();
      const programName = studentRow.programName?.trim();

      if (!centerName || !batchName || !idNumber || !fullName || !programName) {
        throw new Error(`Incomplete data for student: ${idNumber || 'Unknown'}`);
      }

      // 2. Find Center (Case-insensitive)
      const { data: center } = await supabaseAdmin
        .from('centers')
        .select('id')
        .ilike('name', centerName)
        .maybeSingle();

      if (!center) throw new Error(`Center not found: ${centerName}`);

      // 3. Find Program (Case-insensitive)
      const { data: program } = await supabaseAdmin
        .from('programs')
        .select('id')
        .eq('department_id', deptId)
        .ilike('name', programName)
        .maybeSingle();

      if (!program) throw new Error(`Program "${programName}" not found in this department`);

      // 4. Find Batch (Case-insensitive, linked to program)
      const { data: batch } = await supabaseAdmin
        .from('batches')
        .select('id')
        .eq('program_id', program.id)
        .ilike('name', batchName)
        .maybeSingle();

      if (!batch) throw new Error(`Batch "${batchName}" not found in program "${programName}"`);

      // 5. Handle User Account (Check if exists first)
      const { data: existingUser } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('username', idNumber)
        .maybeSingle();

      let userId;

      if (existingUser) {
        userId = existingUser.id;
        // Optionally update full name if it changed
        await supabaseAdmin.from('users').update({ full_name: fullName }).eq('id', userId);
      } else {
        const defaultPassword = `HU@${idNumber}`;
        const hashedPassword = await bcrypt.hash(defaultPassword, 10);

        const { data: userData, error: userError } = await supabaseAdmin
          .from('users')
          .insert({
            username: idNumber,
            password_hash: hashedPassword,
            role: 'STUDENT',
            full_name: fullName
          })
          .select()
          .single();

        if (userError) throw new Error(`User creation failed for ${idNumber}: ${userError.message}`);
        userId = userData.id;
      }

      // 5. Upsert Student Profile
      const { error: profileError } = await supabaseAdmin
        .from('student_profiles')
        .upsert({
          user_id: userId,
          id_number: idNumber,
          batch_id: batch.id,
          center_id: center.id,
          department_id: deptId
        }, { onConflict: 'user_id' });

      if (profileError) {
        throw new Error(`Profile setup failed for ${idNumber}: ${profileError.message}`);
      }

      // 6. Auto-Enroll in matching active Sections
      // Fetch sections for this batch and center in the active semester
      const { data: activeSections } = await supabaseAdmin
        .from('sections')
        .select('id')
        .eq('batch_id', batch.id)
        .eq('center_id', center.id);

      if (activeSections && activeSections.length > 0) {
        const enrollments = activeSections.map(sec => ({
          student_id: userId,
          section_id: sec.id,
          status: 'active'
        }));

        await supabaseAdmin
          .from('enrollments')
          .upsert(enrollments, { onConflict: 'student_id, section_id' });
      }

      results.success++;
    } catch (err: any) {
      results.failed++;
      results.errors.push(err.message);
    }
  }

  return results;
}
