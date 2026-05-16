'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { ActionResult } from './goals';

/**
 * Simulates sending an escalation email/Teams message by logging it directly into the Audit Trail.
 */
export async function sendEscalationNudge(userId: string, reason: string): Promise<ActionResult> {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { success: false, error: 'Not authenticated.' };

  // Verify caller is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    return { success: false, error: 'Only admins can send escalations.' };
  }

  // Get target user details
  const { data: targetProfile } = await supabase
    .from('profiles')
    .select('email, full_name')
    .eq('id', userId)
    .single();

  if (!targetProfile) return { success: false, error: 'Target user not found.' };

  const targetName = targetProfile.full_name || targetProfile.email;

  // Log to Audit Trail
  const { error: insertError } = await supabase.from('audit_logs').insert({
    goal_id: null,
    changed_by: user.id,
    change_description: `[ESCALATION SENT via Teams/Email] Nudged ${targetName} for: ${reason}`,
  });

  if (insertError) return { success: false, error: insertError.message };

  revalidatePath('/dashboard/admin');
  return { success: true, message: `Escalation nudge sent to ${targetName}.` };
}
