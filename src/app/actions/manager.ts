'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { GoalStatus } from '@/types/supabase';
import type { ActionResult } from './goals';

export async function updateGoalInline(
  goalId: string,
  updates: { target_value: number | null; weightage: number }
): Promise<ActionResult> {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { success: false, error: 'Not authenticated.' };

  if (updates.weightage < 10) {
    return { success: false, error: 'Weightage cannot be less than 10%.' };
  }

  // Verify the manager has access to this goal (RLS will also catch this, but good to check status)
  const { data: goal, error: fetchError } = await supabase
    .from('goals')
    .select('status, employee_id, year')
    .eq('id', goalId)
    .single();

  if (fetchError || !goal) return { success: false, error: 'Goal not found.' };
  if (goal.status !== 'pending_approval') {
    return { success: false, error: 'Can only edit goals that are pending approval.' };
  }

  // Ensure total weightage won't exceed 100% after this edit
  const { data: otherGoals, error: othersError } = await supabase
    .from('goals')
    .select('weightage')
    .eq('employee_id', goal.employee_id)
    .eq('year', goal.year)
    .neq('id', goalId);

  if (othersError) return { success: false, error: othersError.message };

  const othersTotal = (otherGoals ?? []).reduce((sum, g) => sum + g.weightage, 0);
  if (othersTotal + updates.weightage > 100) {
    return { success: false, error: `Weightage edit exceeds 100% total for the employee.` };
  }

  // Update the goal
  const { error: updateError } = await supabase
    .from('goals')
    .update({
      target_value: updates.target_value,
      weightage: updates.weightage,
    })
    .eq('id', goalId);

  if (updateError) return { success: false, error: updateError.message };

  // Write audit log
  await supabase.from('audit_logs').insert({
    goal_id: goalId,
    changed_by: user.id,
    change_description: `Manager inline edit: target_value -> ${updates.target_value}, weightage -> ${updates.weightage}%`,
  });

  revalidatePath(`/dashboard/manager/report/[id]`, 'page');
  return { success: true, message: 'Goal updated successfully.' };
}

export async function approveGoalSheet(
  employeeId: string,
  year: number
): Promise<ActionResult> {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { success: false, error: 'Not authenticated.' };

  // Check if total weightage is 100%
  const { data: goals, error: fetchError } = await supabase
    .from('goals')
    .select('id, weightage, status')
    .eq('employee_id', employeeId)
    .eq('year', year)
    .eq('status', 'pending_approval');

  if (fetchError) return { success: false, error: fetchError.message };
  if (!goals || goals.length === 0) {
    return { success: false, error: 'No pending goals to approve.' };
  }

  const totalWeightage = goals.reduce((sum, g) => sum + g.weightage, 0);
  if (totalWeightage !== 100) {
    return { success: false, error: `Total weightage is ${totalWeightage}%. It must be exactly 100% to approve.` };
  }

  const goalIds = goals.map((g) => g.id);

  // Approve all
  const { error: updateError } = await supabase
    .from('goals')
    .update({
      status: 'approved' as GoalStatus,
      locked: true,
      rejection_reason: null, // Clear any past rejection reason
    })
    .in('id', goalIds);

  if (updateError) return { success: false, error: updateError.message };

  // Bulk audit logs
  const auditLogs = goalIds.map(id => ({
    goal_id: id,
    changed_by: user.id,
    change_description: 'Manager approved goal.',
  }));
  await supabase.from('audit_logs').insert(auditLogs);

  revalidatePath('/dashboard/manager');
  revalidatePath(`/dashboard/manager/report/${employeeId}`);
  return { success: true, message: 'Goals approved successfully.' };
}

export async function rejectGoalSheet(
  employeeId: string,
  year: number,
  reason: string
): Promise<ActionResult> {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { success: false, error: 'Not authenticated.' };

  if (!reason.trim()) {
    return { success: false, error: 'A rejection reason is required.' };
  }

  const { data: goals, error: fetchError } = await supabase
    .from('goals')
    .select('id')
    .eq('employee_id', employeeId)
    .eq('year', year)
    .eq('status', 'pending_approval');

  if (fetchError) return { success: false, error: fetchError.message };
  if (!goals || goals.length === 0) {
    return { success: false, error: 'No pending goals to reject.' };
  }

  const goalIds = goals.map((g) => g.id);

  // Reject all
  const { error: updateError } = await supabase
    .from('goals')
    .update({
      status: 'draft' as GoalStatus,
      locked: false,
      rejection_reason: reason.trim(),
    })
    .in('id', goalIds);

  if (updateError) return { success: false, error: updateError.message };

  // Bulk audit logs
  const auditLogs = goalIds.map(id => ({
    goal_id: id,
    changed_by: user.id,
    change_description: `Manager rejected goal. Reason: ${reason.trim()}`,
  }));
  await supabase.from('audit_logs').insert(auditLogs);

  revalidatePath('/dashboard/manager');
  revalidatePath(`/dashboard/manager/report/${employeeId}`);
  return { success: true, message: 'Goals rejected and sent back to employee.' };
}
