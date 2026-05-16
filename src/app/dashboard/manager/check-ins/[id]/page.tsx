export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { ArrowLeft } from 'lucide-react';
import type { Goal, CheckIn, Quarter } from '@/types/supabase';
import ManagerCheckInReview from '@/components/checkins/ManagerCheckInReview';

type PageProps = {
  params: { id: string };
  searchParams: { q?: string };
};

export default async function ManagerCheckInEmployeePage({ params, searchParams }: PageProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const employeeId = params.id;
  const year = new Date().getFullYear();
  const currentQuarter = (searchParams.q as Quarter) || 'Q1';

  // Verify manager access to this profile
  const { data: employee, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', employeeId)
    .eq('manager_id', user.id)
    .single();

  if (profileError || !employee) {
    redirect('/dashboard/manager/check-ins');
  }

  // Fetch approved goals
  const { data: goalsData } = await supabase
    .from('goals')
    .select('*')
    .eq('employee_id', employeeId)
    .eq('year', year)
    .eq('status', 'approved')
    .order('created_at', { ascending: true });

  const goals = (goalsData ?? []) as Goal[];
  const goalIds = goals.map(g => g.id);

  // Fetch check-ins
  const { data: checkInsData } = await supabase
    .from('check_ins')
    .select('*')
    .in('goal_id', goalIds)
    .eq('quarter', currentQuarter)
    .eq('quarter_year', year);

  const checkIns = (checkInsData ?? []) as CheckIn[];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href={`/dashboard/manager/check-ins?q=${currentQuarter}`}
          className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h2 className="text-xl font-bold text-white">{employee.full_name}&apos;s {currentQuarter} Check-ins</h2>
          <p className="text-slate-400 text-sm">{goals.length} active goals</p>
        </div>
      </div>

      {goals.length === 0 ? (
        <div className="bg-white/5 p-8 rounded-xl text-center border border-white/10">
          <p className="text-slate-400">This employee has no approved goals for {year}.</p>
        </div>
      ) : (
        <ManagerCheckInReview 
          employee={employee} 
          goals={goals} 
          checkIns={checkIns} 
        />
      )}
    </div>
  );
}
