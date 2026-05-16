export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import ReviewSheet from '@/components/manager/ReviewSheet';
import { ArrowLeft } from 'lucide-react';

export default async function ManagerReportPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const employeeId = params.id;
  const year = new Date().getFullYear();

  // Verify manager access to this profile
  const { data: employee, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', employeeId)
    .eq('manager_id', user.id)
    .single();

  if (profileError || !employee) {
    // Either the employee doesn't exist or isn't a direct report of this manager
    redirect('/dashboard/manager');
  }

  // Fetch the employee's goals
  const { data: goals } = await supabase
    .from('goals')
    .select('*')
    .eq('employee_id', employeeId)
    .eq('year', year)
    .order('created_at', { ascending: true });

  const employeeGoals = goals ?? [];

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/manager"
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Team
      </Link>

      <ReviewSheet employee={employee} initialGoals={employeeGoals} year={year} />
    </div>
  );
}
