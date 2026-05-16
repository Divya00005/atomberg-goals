export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Goal, CheckIn, Quarter } from '@/types/supabase';
import CheckInForm from '@/components/checkins/CheckInForm';
import { Target, Lock, Calendar } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { isQuarterOpen, getQuarterWindowLabel } from '@/lib/quarter-windows';
import { cn } from '@/lib/utils';

type PageProps = {
  searchParams: { q?: string; demo_month?: string };
};

export default async function EmployeeCheckInsPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const year = new Date().getFullYear();
  
  // Default to Q1 if not specified
  const currentQuarter = (searchParams.q as Quarter) || 'Q1';
  const validQuarters: Quarter[] = ['Q1', 'Q2', 'Q3', 'Q4'];
  
  if (!validQuarters.includes(currentQuarter)) {
    redirect('/dashboard/employee/check-ins?q=Q1');
  }

  // Demo override: allow ?demo_month=7 to simulate July etc.
  const demoMonth = searchParams.demo_month ? parseInt(searchParams.demo_month) : undefined;
  const quarterOpen = isQuarterOpen(currentQuarter, demoMonth);
  const windowLabel = getQuarterWindowLabel(currentQuarter);

  // 1. Fetch Approved Goals for the year
  const { data: goalsData } = await supabase
    .from('goals')
    .select('*')
    .eq('employee_id', user.id)
    .eq('year', year)
    .eq('status', 'approved')
    .order('created_at', { ascending: true });

  const goals = (goalsData ?? []) as Goal[];

  // 2. Fetch Check-ins for the selected Quarter
  const { data: checkInsData } = await supabase
    .from('check_ins')
    .select('*')
    .eq('quarter', currentQuarter)
    .eq('quarter_year', year)
    .in('goal_id', goals.map(g => g.id));

  const checkIns = (checkInsData ?? []) as CheckIn[];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Quarterly Check-ins</h2>
          <p className="text-slate-400 mt-1 text-sm">
            Track your progress against your approved goals for {year}.
          </p>
        </div>

        {/* Quarter Selector */}
        <div className="flex bg-white/5 p-1 rounded-lg border border-white/10 shrink-0">
          {validQuarters.map((q) => {
            const qOpen = isQuarterOpen(q, demoMonth);
            const qLabel = getQuarterWindowLabel(q);
            return (
              <Link key={q} href={`/dashboard/employee/check-ins?q=${q}${demoMonth ? `&demo_month=${demoMonth}` : ''}`} passHref>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-8 px-4 rounded-md transition-all gap-1.5",
                    currentQuarter === q
                      ? (qOpen ? 'bg-violet-600 text-white hover:bg-violet-500 shadow-sm' : 'bg-red-600/50 text-white hover:bg-red-500/50')
                      : (qOpen ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-slate-600 hover:text-slate-400 hover:bg-white/3')
                  )}
                  title={qOpen ? `${q} window is open` : `${q} window opens in ${qLabel}`}
                >
                  {!qOpen && <Lock className="w-3 h-3" />}
                  {q}
                </Button>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Demo Time Machine Banner */}
      {demoMonth && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
          <p className="text-amber-400 text-sm">
            <strong>Demo Mode:</strong> Simulating month {demoMonth} ({new Date(2026, demoMonth - 1).toLocaleString('default', { month: 'long' })}).
            <Link href="/dashboard/employee/check-ins?q=Q1" className="ml-2 underline hover:text-amber-300">Reset</Link>
          </p>
        </div>
      )}

      {/* Window Closed Banner */}
      {!quarterOpen && (
        <div className="flex flex-col items-center justify-center py-12 text-center border border-amber-500/20 border-dashed rounded-xl bg-amber-500/5">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4">
            <Lock className="w-6 h-6 text-amber-400" />
          </div>
          <p className="text-white font-medium mb-1">{currentQuarter} Check-in Window is Closed</p>
          <p className="text-slate-500 text-sm max-w-sm">
            The {currentQuarter} check-in window opens in <strong className="text-amber-400">{windowLabel}</strong>. You can view your past check-ins but cannot submit new ones.
          </p>
          {!demoMonth && (
            <p className="text-slate-600 text-xs mt-3">
              For demo: add <code className="bg-white/5 px-1.5 py-0.5 rounded text-slate-400">?demo_month=7</code> to the URL to simulate July.
            </p>
          )}
        </div>
      )}

      {/* Goals & Check-in Forms */}
      {quarterOpen && goals.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-white/5 border-dashed rounded-xl bg-white/3">
          <div className="w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-4">
            <Target className="w-6 h-6 text-violet-400" />
          </div>
          <p className="text-white font-medium mb-1">No Approved Goals Yet</p>
          <p className="text-slate-500 text-sm max-w-sm">
            You cannot submit check-ins until your manager has approved your goal sheet for this year.
          </p>
        </div>
      )}

      {quarterOpen && goals.length > 0 && (
        <div className="space-y-2">
          {goals.map(goal => {
            const existingCheckIn = checkIns.find(c => c.goal_id === goal.id);
            return (
              <CheckInForm
                key={goal.id}
                goal={goal}
                quarter={currentQuarter}
                quarterYear={year}
                existingCheckIn={existingCheckIn}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
