export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Users, Clock, CheckCircle2, ChevronRight, FileEdit, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { Profile, Goal } from '@/types/supabase';
import { cn } from '@/lib/utils';

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

  // 2. Fetch goals for these reports for current year
  const reportIds = team.map(r => r.id);
  const { data: goals } = await supabase
    .from('goals')
    .select('*')
    .in('employee_id', reportIds)
    .eq('year', year);

  const allGoals = (goals ?? []) as Goal[];

  // Group goals by employee
  const employeeStatusMap: Record<string, {
    statusLabel: string;
    statusColor: string;
    icon: React.ElementType;
    goalCount: number;
    totalWeightage: number;
  }> = {};

  let pendingCount = 0;
  let approvedCount = 0;

  team.forEach(emp => {
    const empGoals = allGoals.filter(g => g.employee_id === emp.id);
    const count = empGoals.length;
    const totalWeight = empGoals.reduce((sum, g) => sum + g.weightage, 0);
    
    let stateLabel = 'Not Started';
    let stateColor = 'bg-slate-800 text-slate-400 border-slate-700/50';
    let StateIcon = FileEdit;

    if (count > 0) {
      if (empGoals.some(g => g.status === 'draft')) {
        stateLabel = 'Drafting';
        stateColor = 'bg-slate-700/50 text-slate-300 border-slate-600/50';
        StateIcon = FileEdit;
      } else if (empGoals.some(g => g.status === 'rejected')) {
        stateLabel = 'Action Required';
        stateColor = 'bg-red-500/15 text-red-400 border-red-500/25';
        StateIcon = AlertCircle;
      } else if (empGoals.some(g => g.status === 'pending_approval')) {
        stateLabel = 'Pending Review';
        stateColor = 'bg-amber-500/15 text-amber-400 border-amber-500/25';
        StateIcon = Clock;
        pendingCount++;
      } else if (empGoals.every(g => g.status === 'approved')) {
        stateLabel = 'Approved';
        stateColor = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25';
        StateIcon = CheckCircle2;
        approvedCount++;
      }
    }

    employeeStatusMap[emp.id] = {
      statusLabel: stateLabel,
      statusColor: stateColor,
      icon: StateIcon,
      goalCount: count,
      totalWeightage: totalWeight,
    };
  });

  const stats = [
    {
      label: 'Direct Reports',
      value: team.length,
      icon: Users,
      color: 'text-violet-400',
      bg: 'bg-violet-500/10',
    },
    {
      label: 'Pending Reviews',
      value: pendingCount,
      icon: Clock,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
    },
    {
      label: 'Approved Goal Sheets',
      value: approvedCount,
      icon: CheckCircle2,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white">Team Overview</h2>
        <p className="text-slate-400 mt-1 text-sm">
          Review and approve goals for your direct reports for {year}.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <Card
            key={label}
            className="bg-white/3 border-white/5 hover:border-white/10 transition-colors"
          >
            <CardContent className="p-5">
              <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center mb-4`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-white text-xs font-medium mt-0.5">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Team List */}
      <div className="bg-white/3 border border-white/5 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5 bg-white/5">
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
              const status = employeeStatusMap[emp.id];
              const StatusIcon = status.icon;
              
              return (
                <Link
                  key={emp.id}
                  href={`/dashboard/manager/report/${emp.id}`}
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
                      <p className="text-white text-sm">{status.goalCount} / 8 goals</p>
                      <p className="text-slate-500 text-xs mt-0.5">{status.totalWeightage}% weightage</p>
                    </div>
                    
                    <div
                      className={cn(
                        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border min-w-[110px] justify-center',
                        status.statusColor
                      )}
                    >
                      <StatusIcon className="w-3.5 h-3.5" />
                      {status.statusLabel}
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
