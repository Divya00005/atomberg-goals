export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Goal, CheckIn, Quarter } from '@/types/supabase';
import CheckInForm from '@/components/checkins/CheckInForm';
import { Target } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

type PageProps = {
  searchParams: { q?: string };
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
          {validQuarters.map((q) => (
            <Link key={q} href={`/dashboard/employee/check-ins?q=${q}`} passHref>
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

      {goals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-white/5 border-dashed rounded-xl bg-white/3">
          <div className="w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-4">
            <Target className="w-6 h-6 text-violet-400" />
          </div>
          <p className="text-white font-medium mb-1">No Approved Goals Yet</p>
          <p className="text-slate-500 text-sm max-w-sm">
            You cannot submit check-ins until your manager has approved your goal sheet for this year.
          </p>
        </div>
      ) : (
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
