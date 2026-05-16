export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import AdminDashboardClient from '@/components/admin/AdminDashboardClient';
import type { Profile, Goal, AuditLog } from '@/types/supabase';

type PageProps = {
  searchParams: { tab?: string };
};

export default async function AdminDashboardPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: currentUser } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (currentUser?.role !== 'admin') {
    redirect('/dashboard');
  }

  const activeTab = searchParams.tab || 'users';
  const year = new Date().getFullYear();

  // Fetch all profiles
  const { data: profilesData } = await supabase
    .from('profiles')
    .select('*')
    .order('full_name', { ascending: true });
  const profiles = (profilesData ?? []) as Profile[];

  // Fetch all goals
  const { data: goalsData } = await supabase
    .from('goals')
    .select('*')
    .eq('year', year);
  const goals = (goalsData ?? []) as Goal[];

  // Fetch locked goals for unlock tab
  const { data: lockedGoalsData } = await supabase
    .from('goals')
    .select('*')
    .eq('locked', true);
  const lockedGoals = (lockedGoalsData ?? []) as Goal[];

  // Fetch audit logs
  const { data: auditLogsData } = await supabase
    .from('audit_logs')
    .select('*')
    .order('changed_at', { ascending: false })
    .limit(100);
  const auditLogs = (auditLogsData ?? []) as AuditLog[];

  return (
    <AdminDashboardClient
      profiles={profiles}
      goals={goals}
      lockedGoals={lockedGoals}
      auditLogs={auditLogs}
      activeTab={activeTab}
    />
  );
}
