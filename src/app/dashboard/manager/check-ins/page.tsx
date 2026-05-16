export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Profile, Goal, CheckIn, Quarter } from '@/types/supabase';
import ManagerCheckInsClient from '@/components/manager/ManagerCheckInsClient';

type PageProps = {
  searchParams: { q?: string };
};

export default async function ManagerCheckInsPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const year = new Date().getFullYear();
  const currentQuarter = (searchParams.q as Quarter) || 'Q1';
  const validQuarters: Quarter[] = ['Q1', 'Q2', 'Q3', 'Q4'];

  if (!validQuarters.includes(currentQuarter)) {
    redirect('/dashboard/manager/check-ins?q=Q1');
  }

  // 1. Fetch direct reports
  const { data: reports } = await supabase
    .from('profiles')
    .select('*')
    .eq('manager_id', user.id)
    .order('full_name', { ascending: true });

  const team = (reports ?? []) as Profile[];
  const reportIds = team.map(r => r.id);

  // 2. Fetch approved goals for reports
  const { data: goalsData } = await supabase
    .from('goals')
    .select('id, employee_id, weightage')
    .in('employee_id', reportIds)
    .eq('year', year)
    .eq('status', 'approved');

  const allGoals = (goalsData ?? []) as Goal[];
  const allGoalIds = allGoals.map(g => g.id);

  // 3. Fetch check-ins for the selected quarter for these goals
  let checkIns: CheckIn[] = [];
  if (allGoalIds.length > 0) {
    const { data: checkInsData } = await supabase
      .from('check_ins')
      .select('id, goal_id, progress_score')
      .in('goal_id', allGoalIds)
      .eq('quarter', currentQuarter)
      .eq('quarter_year', year);
    checkIns = (checkInsData ?? []) as CheckIn[];
  }

  // Group data
  const teamStatus = team.map(emp => {
    const empGoals = allGoals.filter(g => g.employee_id === emp.id);
    const goalCount = empGoals.length;
    
    const empCheckIns = empGoals.map(g => checkIns.find(c => c.goal_id === g.id)).filter(Boolean);
    const checkInCount = empCheckIns.length;
    
    const isFullySubmitted = goalCount > 0 && checkInCount === goalCount;
    
    let overallScore = 0;
    if (goalCount > 0 && empCheckIns.length > 0) {
      let totalScorePoints = 0;
      empGoals.forEach(g => {
        const ci = checkIns.find(c => c.goal_id === g.id);
        if (ci) {
          totalScorePoints += ci.progress_score * (g.weightage / 100);
        }
      });
      overallScore = Math.round(totalScorePoints);
    }

    return {
      id: emp.id,
      profile: emp,
      goalCount,
      checkInCount,
      overallScore,
      isFullySubmitted
    };
  });

  return (
    <ManagerCheckInsClient 
      teamStatus={teamStatus} 
      year={year} 
      currentQuarter={currentQuarter} 
      validQuarters={validQuarters} 
    />
  );
}
