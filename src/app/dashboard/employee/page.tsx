export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import GoalList from '@/components/goals/GoalList';
import AnimatedStats from '@/components/effects/AnimatedStats';
import { Target, TrendingUp, Clock, CheckCircle2 } from 'lucide-react';
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

  const stats = [
    {
      label: 'Total Goals',
      value: goalList.length || '—',
      icon: Target,
      color: 'text-violet-400',
      bg: 'bg-violet-500/10',
      sub: `${goalList.length} / 8`,
    },
    {
      label: 'Total Weightage',
      value: totalWeightage > 0 ? `${totalWeightage}%` : '—',
      icon: TrendingUp,
      color: totalWeightage === 100 ? 'text-emerald-400' : 'text-amber-400',
      bg: totalWeightage === 100 ? 'bg-emerald-500/10' : 'bg-amber-500/10',
      sub: totalWeightage === 100 ? 'Ready to submit' : `${100 - totalWeightage}% remaining`,
    },
    {
      label: 'Pending Approval',
      value: pendingCount || '—',
      icon: Clock,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      sub: pendingCount > 0 ? 'Awaiting manager' : 'None pending',
    },
    {
      label: 'Approved Goals',
      value: approvedCount || '—',
      icon: CheckCircle2,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      sub: approvedCount > 0 ? `${approvedCount} locked in` : 'None yet',
    },
  ];

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
      <AnimatedStats stats={stats} />

      {/* Goal list */}
      <GoalList goals={goalList} year={year} />
    </div>
  );
}
