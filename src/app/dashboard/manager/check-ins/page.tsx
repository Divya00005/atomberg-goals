export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Users, ChevronRight, Activity, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Profile, Goal, CheckIn, Quarter } from '@/types/supabase';
import { cn } from '@/lib/utils';

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
  const { data: checkInsData } = await supabase
    .from('check_ins')
    .select('id, goal_id, progress_score')
    .in('goal_id', allGoalIds)
    .eq('quarter', currentQuarter)
    .eq('quarter_year', year);

  const checkIns = (checkInsData ?? []) as CheckIn[];

  return (
    <div className="space-y-8">
      {/* Header & Quarter Selector */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Team Check-ins</h2>
          <p className="text-slate-400 mt-1 text-sm">
            Review {year} performance and add manager feedback.
          </p>
        </div>

        <div className="flex bg-white/5 p-1 rounded-lg border border-white/10 shrink-0">
          {validQuarters.map((q) => (
            <Link key={q} href={`/dashboard/manager/check-ins?q=${q}`} passHref>
              <Button
                variant="ghost"
                size="sm"
                className={`h-8 px-4 rounded-md transition-all ${
                  currentQuarter === q
                    ? 'bg-violet-600 text-white hover:bg-violet-500 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {q}
              </Button>
            </Link>
          ))}
        </div>
      </div>

      {/* Team List */}
      <div className="bg-white/3 border border-white/5 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5 bg-white/5 flex items-center gap-2">
          <Users className="w-4 h-4 text-slate-400" />
          <h3 className="text-white font-medium text-sm">Direct Reports ({team.length})</h3>
        </div>
        
        {team.length === 0 ? (
          <div className="p-10 text-center">
            <Users className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">You have no direct reports assigned.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {team.map((emp) => {
              // Calculate completion metrics
              const empGoals = allGoals.filter(g => g.employee_id === emp.id);
              const goalCount = empGoals.length;
              
              const empCheckIns = empGoals.map(g => checkIns.find(c => c.goal_id === g.id)).filter(Boolean);
              const checkInCount = empCheckIns.length;
              
              const isFullySubmitted = goalCount > 0 && checkInCount === goalCount;
              
              // Weighted overall score
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

              return (
                <Link
                  key={emp.id}
                  href={`/dashboard/manager/check-ins/${emp.id}?q=${currentQuarter}`}
                  className="flex items-center justify-between p-5 hover:bg-white/5 transition-colors group block"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center text-violet-300 font-medium">
                      {emp.full_name.charAt(0).toUpperCase() || emp.email.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm">{emp.full_name || 'Unnamed Employee'}</p>
                      <p className="text-slate-500 text-xs mt-0.5">{emp.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right hidden md:block">
                      <p className="text-white text-sm">{checkInCount} / {goalCount} completed</p>
                      <p className="text-slate-500 text-xs mt-0.5">Overall Score: {overallScore}%</p>
                    </div>
                    
                    <div
                      className={cn(
                        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border min-w-[120px] justify-center',
                        isFullySubmitted 
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' 
                          : goalCount === 0 
                            ? 'bg-slate-800 text-slate-400 border-slate-700/50'
                            : 'bg-amber-500/15 text-amber-400 border-amber-500/25'
                      )}
                    >
                      {isFullySubmitted ? <CheckCircle2 className="w-3 h-3" /> : goalCount === 0 ? <AlertCircle className="w-3 h-3" /> : <Activity className="w-3 h-3" />}
                      {isFullySubmitted ? 'Submitted' : goalCount === 0 ? 'No Goals' : 'In Progress'}
                    </div>
                    
                    <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-white transition-colors" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
