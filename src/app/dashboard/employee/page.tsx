export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import GoalList from '@/components/goals/GoalList';
import AnimatedStats from '@/components/effects/AnimatedStats';
import type { Goal } from '@/types/supabase';


export default async function EmployeePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const year = new Date().getFullYear();

  const { data: goals } = await supabase
    .from('goals')
    .select('*')
    .eq('employee_id', user.id)
    .eq('year', year)
    .order('created_at', { ascending: true });

  const goalList = (goals ?? []) as Goal[];

  // ── Derived stats ──────────────────────────────────────────
  const totalWeightage = goalList.reduce((sum, g) => sum + g.weightage, 0);
  const approvedCount = goalList.filter((g) => g.status === 'approved').length;
  const pendingCount = goalList.filter(
    (g) => g.status === 'pending_approval'
  ).length;



  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white">My Goals</h2>
        <p className="text-slate-400 mt-1 text-sm">
          Manage your {year} goals and track your progress.
        </p>
      </div>

      {/* Stats */}
      <AnimatedStats 
        totalGoals={goalList.length}
        totalWeightage={totalWeightage}
        pendingCount={pendingCount}
        approvedCount={approvedCount}
      />

      {/* Goal list */}
      <GoalList goals={goalList} year={year} />
    </div>
  );
}
