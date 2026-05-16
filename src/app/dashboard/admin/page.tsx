export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Users, Unlock, History, Activity, AlertCircle } from 'lucide-react';
import CsvExportButton from '@/components/admin/CsvExportButton';
import UnlockGoalButton from '@/components/admin/UnlockGoalButton';
import SharedGoalDialog from '@/components/admin/SharedGoalDialog';
import AnalyticsTab from '@/components/admin/AnalyticsTab';
import EscalationTab from '@/components/admin/EscalationTab';
import { cn } from '@/lib/utils';
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

  // Fetch all profiles for user management & mapping names
  const { data: profilesData } = await supabase
    .from('profiles')
    .select('*')
    .order('full_name', { ascending: true });
  const profiles = (profilesData ?? []) as Profile[];

  // Fetch all goals for analytics and escalations
  const { data: goalsData } = await supabase
    .from('goals')
    .select('*')
    .eq('year', year);
  const goals = (goalsData ?? []) as Goal[];

  const getProfileName = (id?: string | null) => {
    if (!id) return 'Unknown';
    return profiles.find(p => p.id === id)?.full_name || 'Unknown';
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Admin Dashboard</h2>
          <p className="text-slate-400 mt-1 text-sm">
            Manage users, unlock goals, and audit system activity.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <SharedGoalDialog employees={profiles} />
          <CsvExportButton />
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-4 overflow-x-auto scrollbar-none">
        <TabLink id="users" active={activeTab} icon={<Users className="w-4 h-4" />} label="Users" />
        <TabLink id="analytics" active={activeTab} icon={<Activity className="w-4 h-4" />} label="Analytics" />
        <TabLink id="escalations" active={activeTab} icon={<AlertCircle className="w-4 h-4" />} label="Escalations" />
        <TabLink id="unlock" active={activeTab} icon={<Unlock className="w-4 h-4" />} label="Goal Unlock" />
        <TabLink id="audit" active={activeTab} icon={<History className="w-4 h-4" />} label="Audit Log" />
      </div>

      {/* Tab Content */}
      <div className="bg-white/3 border border-white/5 rounded-xl overflow-hidden min-h-[400px]">
        {activeTab === 'users' && <UsersTab profiles={profiles} getProfileName={getProfileName} />}
        {activeTab === 'analytics' && <AnalyticsTab goals={goals} profiles={profiles} />}
        {activeTab === 'escalations' && <EscalationTab goals={goals} profiles={profiles} />}
        {activeTab === 'unlock' && <UnlockTab getProfileName={getProfileName} />}
        {activeTab === 'audit' && <AuditTab getProfileName={getProfileName} />}
      </div>
    </div>
  );
}

// ── Components & Tab Sections ──────────────────────────────────────────────

function TabLink({ id, active, icon, label }: { id: string, active: string, icon: React.ReactNode, label: string }) {
  const isActive = active === id;
  return (
    <Link
      href={`/dashboard/admin?tab=${id}`}
      className={cn(
        "flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-sm font-medium transition-colors border-b-2 whitespace-nowrap",
        isActive 
          ? "border-violet-500 text-white bg-violet-500/10" 
          : "border-transparent text-slate-400 hover:text-white hover:bg-white/5"
      )}
    >
      {icon}
      {label}
    </Link>
  );
}

function UsersTab({ profiles, getProfileName }: { profiles: Profile[], getProfileName: (id: string | null) => string }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm text-slate-300">
        <thead className="text-xs text-slate-400 uppercase bg-white/5 border-b border-white/10">
          <tr>
            <th className="px-6 py-4 font-medium">Name</th>
            <th className="px-6 py-4 font-medium">Email</th>
            <th className="px-6 py-4 font-medium">Role</th>
            <th className="px-6 py-4 font-medium">Manager</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {profiles.map(p => (
            <tr key={p.id} className="hover:bg-white/5">
              <td className="px-6 py-4 font-medium text-white">{p.full_name || '-'}</td>
              <td className="px-6 py-4">{p.email}</td>
              <td className="px-6 py-4 capitalize">
                <span className={cn(
                  "px-2.5 py-1 rounded-full text-xs font-medium border",
                  p.role === 'admin' ? "bg-red-500/10 text-red-400 border-red-500/20" :
                  p.role === 'manager' ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                  "bg-violet-500/10 text-violet-400 border-violet-500/20"
                )}>
                  {p.role}
                </span>
              </td>
              <td className="px-6 py-4">{getProfileName(p.manager_id)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

async function UnlockTab({ getProfileName }: { getProfileName: (id: string | null) => string }) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('goals')
    .select('id, title, status, employee_id')
    .eq('locked', true);

  const lockedGoals = (data ?? []) as Goal[];

  if (lockedGoals.length === 0) {
    return <div className="p-12 text-center text-slate-400">No locked goals found.</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm text-slate-300">
        <thead className="text-xs text-slate-400 uppercase bg-white/5 border-b border-white/10">
          <tr>
            <th className="px-6 py-4 font-medium">Employee</th>
            <th className="px-6 py-4 font-medium">Goal Title</th>
            <th className="px-6 py-4 font-medium">Status</th>
            <th className="px-6 py-4 font-medium text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {lockedGoals.map(g => (
            <tr key={g.id} className="hover:bg-white/5">
              <td className="px-6 py-4 font-medium text-white">{getProfileName(g.employee_id)}</td>
              <td className="px-6 py-4 max-w-md truncate">{g.title}</td>
              <td className="px-6 py-4 capitalize">{g.status.replace('_', ' ')}</td>
              <td className="px-6 py-4 text-right">
                <UnlockGoalButton goalId={g.id} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

async function AuditTab({ getProfileName }: { getProfileName: (id: string | null) => string }) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('audit_logs')
    .select('*')
    .order('changed_at', { ascending: false })
    .limit(100);

  const logs = (data ?? []) as AuditLog[];

  if (logs.length === 0) {
    return <div className="p-12 text-center text-slate-400">No audit logs found.</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm text-slate-300">
        <thead className="text-xs text-slate-400 uppercase bg-white/5 border-b border-white/10">
          <tr>
            <th className="px-6 py-4 font-medium">Timestamp</th>
            <th className="px-6 py-4 font-medium">Action</th>
            <th className="px-6 py-4 font-medium">Performed By</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {logs.map(log => (
            <tr key={log.id} className="hover:bg-white/5">
              <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-400">
                {new Date(log.changed_at).toLocaleString()}
              </td>
              <td className="px-6 py-4 text-slate-200">{log.change_description}</td>
              <td className="px-6 py-4 font-medium text-white">{getProfileName(log.changed_by)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


