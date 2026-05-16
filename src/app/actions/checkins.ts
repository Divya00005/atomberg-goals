'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { Quarter, CheckinStatus } from '@/types/supabase';
import type { ActionResult } from './goals';

export type CheckInFormData = {
  goal_id: string;
  quarter: Quarter;
  quarter_year: number;
  actual_value: number | null;
  progress_score: number;
  status: CheckinStatus;
  employee_comments: string;
};

// ─────────────────────────────────────────────────────────────
// EMPLOYEE: Upsert Check-in
// ─────────────────────────────────────────────────────────────
export async function upsertCheckIn(data: CheckInFormData): Promise<ActionResult> {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { success: false, error: 'Not authenticated.' };

  // Verify the goal belongs to the user and is approved
  const { data: goal, error: goalError } = await supabase
    .from('goals')
    .select('id, employee_id, status')
    .eq('id', data.goal_id)
    .single();

  if (goalError || !goal) return { success: false, error: 'Goal not found.' };
  if (goal.employee_id !== user.id) return { success: false, error: 'Unauthorized.' };
  if (goal.status !== 'approved') return { success: false, error: 'Can only check-in on approved goals.' };

  if (data.progress_score < 0 || data.progress_score > 100) {
    return { success: false, error: 'Progress score must be between 0 and 100.' };
  }

  const { error: upsertError } = await supabase
    .from('check_ins')
    .upsert({
      goal_id: data.goal_id,
      quarter: data.quarter,
      quarter_year: data.quarter_year,
      actual_value: data.actual_value,
      progress_score: data.progress_score,
      status: data.status,
      employee_comments: data.employee_comments,
    }, {
      onConflict: 'goal_id,quarter,quarter_year'
    });

  if (upsertError) return { success: false, error: upsertError.message };

  revalidatePath('/dashboard/employee/check-ins');
  return { success: true, message: 'Check-in saved successfully.' };
}

// ─────────────────────────────────────────────────────────────
// MANAGER: Update Manager Comment
// ─────────────────────────────────────────────────────────────
export async function updateManagerComment(
  checkInId: string,
  comment: string
): Promise<ActionResult> {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { success: false, error: 'Not authenticated.' };

  // Verify manager access via check_in -> goal -> profile
  const { data: checkIn, error: fetchError } = await supabase
    .from('check_ins')
    .select(`
      id,
      goal_id,
      goals (
        employee_id,
        profiles ( manager_id )
      )
    `)
    .eq('id', checkInId)
    .single();

  if (fetchError || !checkIn) return { success: false, error: 'Check-in not found.' };
  
  // @ts-expect-error - deeply nested Supabase relation typings
  const managerId = checkIn.goals?.profiles?.manager_id;
  if (managerId !== user.id) {
    return { success: false, error: 'Unauthorized. You are not the manager for this goal.' };
  }

  const { error: updateError } = await supabase
    .from('check_ins')
    .update({
      manager_comments: comment
    })
    .eq('id', checkInId);

  if (updateError) return { success: false, error: updateError.message };

  revalidatePath('/dashboard/manager/check-ins/[id]', 'page');
  return { success: true, message: 'Comment saved successfully.' };
}
