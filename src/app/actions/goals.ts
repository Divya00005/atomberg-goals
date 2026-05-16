'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { GoalStatus, UomType } from '@/types/supabase';

export type GoalFormData = {
  thrust_area: string;
  title: string;
  description: string;
  uom_type: UomType;
  target_value: number | null;
  deadline: string | null;
  weightage: number;
};


export type ActionResult =
  | { success: true; message?: string }
  | { success: false; error: string };

// ─────────────────────────────────────────────────────────────
// CREATE GOAL
// ─────────────────────────────────────────────────────────────
export async function createGoal(data: GoalFormData): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: 'Not authenticated.' };
  }

  const year = new Date().getFullYear();

  // Count existing goals this year
  const { count, error: countError } = await supabase
    .from('goals')
    .select('*', { count: 'exact', head: true })
    .eq('employee_id', user.id)
    .eq('year', year);

  if (countError) return { success: false, error: countError.message };
  if ((count ?? 0) >= 8) {
    return { success: false, error: 'You can have a maximum of 8 goals per year.' };
  }

  // Validate weightage
  if (data.weightage < 10) {
    return { success: false, error: 'Each goal must have at least 10% weightage.' };
  }

  // Check total weightage won't exceed 100
  const { data: existing, error: existingError } = await supabase
    .from('goals')
    .select('weightage')
    .eq('employee_id', user.id)
    .eq('year', year);

  if (existingError) return { success: false, error: existingError.message };

  const totalUsed = (existing ?? []).reduce((sum, g) => sum + g.weightage, 0);
  if (totalUsed + data.weightage > 100) {
    return {
      success: false,
      error: `Adding this goal would exceed 100% total weightage. You have ${100 - totalUsed}% remaining.`,
    };
  }

  const { error: insertError } = await supabase.from('goals').insert({
    employee_id: user.id,
    thrust_area: data.thrust_area,
    title: data.title,
    description: data.description,
    uom_type: data.uom_type,
    target_value: data.target_value,
    deadline: data.uom_type === 'timeline' ? data.deadline : null,
    weightage: data.weightage,
    year,
    status: 'draft' as GoalStatus,
  });

  if (insertError) return { success: false, error: insertError.message };

  revalidatePath('/dashboard/employee');
  return { success: true, message: 'Goal created successfully.' };
}

// ─────────────────────────────────────────────────────────────
// UPDATE GOAL
// ─────────────────────────────────────────────────────────────
export async function updateGoal(
  id: string,
  data: GoalFormData
): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: 'Not authenticated.' };
  }

  if (data.weightage < 10) {
    return { success: false, error: 'Each goal must have at least 10% weightage.' };
  }

  const year = new Date().getFullYear();

  // Get current goal to exclude it from total calculation
  const { data: currentGoal, error: fetchError } = await supabase
    .from('goals')
    .select('weightage, status')
    .eq('id', id)
    .eq('employee_id', user.id)
    .single();

  if (fetchError || !currentGoal) {
    return { success: false, error: 'Goal not found.' };
  }

  if (currentGoal.status !== 'draft') {
    return { success: false, error: 'Only draft goals can be edited.' };
  }

  // Check total excluding this goal
  const { data: others, error: othersError } = await supabase
    .from('goals')
    .select('weightage')
    .eq('employee_id', user.id)
    .eq('year', year)
    .neq('id', id);

  if (othersError) return { success: false, error: othersError.message };

  const othersTotal = (others ?? []).reduce((sum, g) => sum + g.weightage, 0);
  if (othersTotal + data.weightage > 100) {
    return {
      success: false,
      error: `This would exceed 100% total weightage. Other goals use ${othersTotal}%, so max for this goal is ${100 - othersTotal}%.`,
    };
  }

  const { error: updateError } = await supabase
    .from('goals')
    .update({
      thrust_area: data.thrust_area,
      title: data.title,
      description: data.description,
      uom_type: data.uom_type,
      target_value: data.target_value,
      deadline: data.uom_type === 'timeline' ? data.deadline : null,
      weightage: data.weightage,
    })
    .eq('id', id)
    .eq('employee_id', user.id)
    .eq('status', 'draft');

  if (updateError) return { success: false, error: updateError.message };

  revalidatePath('/dashboard/employee');
  return { success: true, message: 'Goal updated successfully.' };
}

// ─────────────────────────────────────────────────────────────
// DELETE GOAL
// ─────────────────────────────────────────────────────────────
export async function deleteGoal(id: string): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: 'Not authenticated.' };
  }

  const { error } = await supabase
    .from('goals')
    .delete()
    .eq('id', id)
    .eq('employee_id', user.id)
    .eq('status', 'draft');

  if (error) return { success: false, error: error.message };

  revalidatePath('/dashboard/employee');
  return { success: true, message: 'Goal deleted.' };
}

// ─────────────────────────────────────────────────────────────
// SUBMIT FOR APPROVAL
// ─────────────────────────────────────────────────────────────
export async function submitGoalsForApproval(): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: 'Not authenticated.' };
  }

  const year = new Date().getFullYear();

  const { data: goals, error: fetchError } = await supabase
    .from('goals')
    .select('id, weightage, status')
    .eq('employee_id', user.id)
    .eq('year', year)
    .eq('status', 'draft');

  if (fetchError) return { success: false, error: fetchError.message };
  if (!goals || goals.length === 0) {
    return { success: false, error: 'You have no draft goals to submit.' };
  }

  const total = goals.reduce((sum, g) => sum + g.weightage, 0);
  if (total !== 100) {
    return {
      success: false,
      error: `Total weightage must be exactly 100%. Current total: ${total}%.`,
    };
  }

  const ids = goals.map((g) => g.id);

  const { error: updateError } = await supabase
    .from('goals')
    .update({ status: 'pending_approval' as GoalStatus })
    .in('id', ids)
    .eq('employee_id', user.id);

  if (updateError) return { success: false, error: updateError.message };

  revalidatePath('/dashboard/employee');
  return { success: true, message: 'Goals submitted for manager approval!' };
}
