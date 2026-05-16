export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Profile, Goal } from '@/types/supabase';
import ManagerOverviewClient from '@/components/manager/ManagerOverviewClient';

export default async function ManagerPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const year = new Date().getFullYear();

  // 1. Fetch direct reports
  const { data: reports } = await supabase
    .from('profiles')
    .select('*')
    .eq('manager_id', user.id)
    .order('full_name', { ascending: true });

  const team = (reports ?? []) as Profile[];

  // 2. Fetch goals
  const reportIds = team.map(r => r.id);
  const { data: goals } = await supabase
    .from('goals')
    .select('*')
    .in('employee_id', reportIds)
    .eq('year', year);

  const allGoals = (goals ?? []) as Goal[];

  let pendingCount = 0;
  let approvedCount = 0;

  const teamStatus = team.map(emp => {
    const empGoals = allGoals.filter(g => g.employee_id === emp.id);
    const count = empGoals.length;
    const totalWeight = empGoals.reduce((sum, g) => sum + g.weightage, 0);
    
    let stateLabel = 'Not Started';
    let stateColor = 'bg-slate-800 text-slate-400 border-slate-700/50';
    let stateIconName = 'FileEdit';

    if (count > 0) {
      if (empGoals.some(g => g.status === 'draft')) {
        stateLabel = 'Drafting';
        stateColor = 'bg-slate-700/50 text-slate-300 border-slate-600/50';
        stateIconName = 'FileEdit';
      } else if (empGoals.some(g => g.status === 'rejected')) {
        stateLabel = 'Action Required';
        stateColor = 'bg-red-500/15 text-red-400 border-red-500/25 shadow-[0_0_10px_rgba(239,68,68,0.2)]';
        stateIconName = 'AlertCircle';
      } else if (empGoals.some(g => g.status === 'pending_approval')) {
        stateLabel = 'Pending Review';
        stateColor = 'bg-amber-500/15 text-amber-400 border-amber-500/25 shadow-[0_0_10px_rgba(245,158,11,0.2)]';
        stateIconName = 'Clock';
        pendingCount++;
      } else if (empGoals.every(g => g.status === 'approved')) {
        stateLabel = 'Approved';
        stateColor = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25 shadow-[0_0_10px_rgba(16,185,129,0.2)]';
        stateIconName = 'CheckCircle2';
        approvedCount++;
      }
    }

    return {
      id: emp.id,
      profile: emp,
      statusLabel: stateLabel,
      statusColor: stateColor,
      iconName: stateIconName,
      goalCount: count,
      totalWeightage: totalWeight,
    };
  });

  const stats = [
    {
      label: 'Direct Reports',
      value: team.length,
      iconName: 'Users',
      color: 'text-violet-400',
      bg: 'bg-violet-500/10',
      glowColor: 'rgba(124,58,237,0.4)',
    },
    {
      label: 'Pending Reviews',
      value: pendingCount,
      iconName: 'Clock',
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      glowColor: 'rgba(245,158,11,0.4)',
    },
    {
      label: 'Approved Goal Sheets',
      value: approvedCount,
      iconName: 'CheckCircle2',
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      glowColor: 'rgba(16,185,129,0.4)',
    },
  ];

  return <ManagerOverviewClient teamStatus={teamStatus} stats={stats} year={year} />;
}
