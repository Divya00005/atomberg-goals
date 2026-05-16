'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { ActionResult } from './goals';

// ─────────────────────────────────────────────────────────────
// Admin: Unlock Goal
// ─────────────────────────────────────────────────────────────
export async function unlockGoal(goalId: string): Promise<ActionResult> {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { success: false, error: 'Not authenticated.' };

  // Verify Admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return { success: false, error: 'Unauthorized. Admin access required.' };
  }

  const { error: updateError } = await supabase
    .from('goals')
    .update({
      locked: false,
      status: 'draft',
      rejection_reason: 'Unlocked by Administrator'
    })
    .eq('id', goalId);

  if (updateError) return { success: false, error: updateError.message };

  await supabase.from('audit_logs').insert({
    goal_id: goalId,
    changed_by: user.id,
    change_description: 'Admin unlocked goal and reverted status to draft.',
  });

  revalidatePath('/dashboard/admin');
  return { success: true, message: 'Goal unlocked successfully.' };
}

// ─────────────────────────────────────────────────────────────
// Admin: Fetch CSV Data
// ─────────────────────────────────────────────────────────────
export async function exportCsvData() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return { success: false, error: 'Unauthorized.' };
  }

  // Fetch all profiles, goals, and check-ins
  const { data: profiles, error: pError } = await supabase.from('profiles').select('*');
  const { data: goals, error: gError } = await supabase.from('goals').select('*');
  const { data: checkIns, error: cError } = await supabase.from('check_ins').select('*');

  if (pError || gError || cError) {
    return { success: false, error: 'Failed to fetch export data.' };
  }

  // Transform data into flat rows for CSV
  const exportRows: Record<string, string | number>[] = [];

  for (const emp of (profiles || [])) {
    const empGoals = (goals || []).filter(g => g.employee_id === emp.id);
    
    if (empGoals.length === 0) {
      exportRows.push({
        Employee_ID: emp.id,
        Employee_Name: emp.full_name,
        Employee_Email: emp.email,
        Manager_ID: emp.manager_id || '',
        Goal_Title: 'No goals submitted',
        Thrust_Area: '',
        UoM: '',
        Target: '',
        Weightage: '',
        Status: '',
        Q1_Actual: '',
        Q2_Actual: '',
        Q3_Actual: '',
        Q4_Actual: '',
        Overall_Score: ''
      });
      continue;
    }

    for (const goal of empGoals) {
      const goalCheckIns = (checkIns || []).filter(c => c.goal_id === goal.id);
      const q1 = goalCheckIns.find(c => c.quarter === 'Q1');
      const q2 = goalCheckIns.find(c => c.quarter === 'Q2');
      const q3 = goalCheckIns.find(c => c.quarter === 'Q3');
      const q4 = goalCheckIns.find(c => c.quarter === 'Q4');

      // Calculate an average/overall score for the goal based on available check-ins
      let totalScore = 0;
      let count = 0;
      if (q1) { totalScore += q1.progress_score; count++; }
      if (q2) { totalScore += q2.progress_score; count++; }
      if (q3) { totalScore += q3.progress_score; count++; }
      if (q4) { totalScore += q4.progress_score; count++; }
      
      const avgScore = count > 0 ? Math.round(totalScore / count) : 0;

      exportRows.push({
        Employee_ID: emp.id,
        Employee_Name: emp.full_name,
        Employee_Email: emp.email,
        Manager_ID: emp.manager_id || '',
        Goal_Title: goal.title,
        Thrust_Area: goal.thrust_area,
        UoM: goal.uom_type,
        Target: goal.target_value ?? '',
        Weightage: goal.weightage + '%',
        Status: goal.status,
        Q1_Actual: q1?.actual_value ?? '',
        Q2_Actual: q2?.actual_value ?? '',
        Q3_Actual: q3?.actual_value ?? '',
        Q4_Actual: q4?.actual_value ?? '',
        Overall_Score: avgScore + '%'
      });
    }
  }

  return { success: true, data: exportRows };
}
