'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { UomType } from '@/types/supabase';
import type { ActionResult } from './goals';

export type SharedGoalFormData = {
  thrust_area: string;
  title: string;
  description: string;
  uom_type: UomType;
  target_value: number | null;
  deadline: string | null;
  weightage: number;
  employee_ids: string[];
};

// ─────────────────────────────────────────────────────────────
// CREATE SHARED GOAL — Admin/Manager pushes a KPI to employees
// ─────────────────────────────────────────────────────────────
export async function createSharedGoal(data: SharedGoalFormData): Promise<ActionResult> {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { success: false, error: 'Not authenticated.' };

  // Verify caller is admin or manager
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || (profile.role !== 'admin' && profile.role !== 'manager')) {
    return { success: false, error: 'Only admins and managers can create shared goals.' };
  }

  if (!data.title.trim()) return { success: false, error: 'Goal title is required.' };
  if (!data.thrust_area.trim()) return { success: false, error: 'Thrust area is required.' };
  if (data.weightage < 10) return { success: false, error: 'Minimum weightage is 10%.' };
  if (data.employee_ids.length === 0) return { success: false, error: 'Select at least one employee.' };

  const year = new Date().getFullYear();

  // Create child goals for each selected employee
  const childGoals = data.employee_ids.map(empId => ({
    employee_id: empId,
    thrust_area: data.thrust_area,
    title: data.title,
    description: data.description,
    uom_type: data.uom_type,
    target_value: data.target_value,
    deadline: data.uom_type === 'timeline' ? data.deadline : null,
    weightage: data.weightage,
    year,
    status: 'draft' as const,
    is_shared: true,
    shared_from_goal_id: null, // No parent for now, just a marker
  }));

  const { error: insertError } = await supabase.from('goals').insert(childGoals);

  if (insertError) return { success: false, error: insertError.message };

  // Audit log
  await supabase.from('audit_logs').insert({
    goal_id: null,
    changed_by: user.id,
    change_description: `Shared goal "${data.title}" pushed to ${data.employee_ids.length} employee(s).`,
  });

  revalidatePath('/dashboard/admin');
  revalidatePath('/dashboard/manager');
  return { success: true, message: `Shared goal pushed to ${data.employee_ids.length} employees.` };
}
