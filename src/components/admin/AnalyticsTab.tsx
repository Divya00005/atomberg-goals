'use client';

import type { Goal, Profile } from '@/types/supabase';
import { BarChart3, Target, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type Props = {
  goals: Goal[];
  profiles: Profile[];
};

export default function AnalyticsTab({ goals, profiles }: Props) {
  // Aggregate Thrust Areas
  const thrustAreaCounts = goals.reduce((acc, goal) => {
    const area = goal.thrust_area || 'Uncategorized';
    acc[area] = (acc[area] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sortedThrustAreas = Object.entries(thrustAreaCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5); // Top 5

  const maxThrustAreaCount = Math.max(1, ...sortedThrustAreas.map(([, count]) => count));

  // Aggregate Statuses
  const statusCounts = goals.reduce((acc, goal) => {
    acc[goal.status] = (acc[goal.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalGoals = goals.length;
  const approvedPercentage = totalGoals > 0 ? Math.round(((statusCounts['approved'] || 0) / totalGoals) * 100) : 0;
  const pendingPercentage = totalGoals > 0 ? Math.round(((statusCounts['pending_approval'] || 0) / totalGoals) * 100) : 0;
  const draftPercentage = totalGoals > 0 ? Math.round((((statusCounts['draft'] || 0) + (statusCounts['rejected'] || 0)) / totalGoals) * 100) : 0;

  // Manager Effectiveness
  const managers = profiles.filter(p => p.role === 'manager');
  const managerStats = managers.map(mgr => {
    const teamMembers = profiles.filter(p => p.manager_id === mgr.id);
    const teamGoals = goals.filter(g => teamMembers.some(tm => tm.id === g.employee_id));
    
    const approved = teamGoals.filter(g => g.status === 'approved').length;
    const total = teamGoals.length;
    const approvalRate = total > 0 ? Math.round((approved / total) * 100) : 0;

    return { name: mgr.full_name || mgr.email, approvalRate, totalTeamGoals: total };
  }).sort((a, b) => b.approvalRate - a.approvalRate);


  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-400" />
            Executive Analytics Dashboard
          </h3>
          <p className="text-sm text-slate-400 mt-1">
            Real-time organizational insights on goal distributions and manager effectiveness.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Metric 1 */}
        <div className="bg-white/5 border border-white/10 p-5 rounded-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
            <Target className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <p className="text-slate-400 text-sm">Total Active Goals</p>
            <p className="text-2xl font-bold text-white">{totalGoals}</p>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white/5 border border-white/10 p-5 rounded-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <p className="text-slate-400 text-sm">Org Approval Rate</p>
            <p className="text-2xl font-bold text-white">{approvedPercentage}%</p>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white/5 border border-white/10 p-5 rounded-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
            <AlertCircle className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <p className="text-slate-400 text-sm">Pending Approval</p>
            <p className="text-2xl font-bold text-white">{statusCounts['pending_approval'] || 0}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Top Thrust Areas Bar Chart */}
        <div className="bg-white/3 border border-white/10 rounded-xl p-5">
          <h4 className="font-medium text-white mb-6">Top Thrust Areas</h4>
          {sortedThrustAreas.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-4">No data available.</p>
          ) : (
            <div className="space-y-4">
              {sortedThrustAreas.map(([area, count]) => {
                const widthPercent = (count / maxThrustAreaCount) * 100;
                return (
                  <div key={area} className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300 font-medium">{area}</span>
                      <span className="text-slate-500">{count} goals</span>
                    </div>
                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-1000"
                        style={{ width: `${widthPercent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Goal Pipeline / Status Distribution */}
        <div className="bg-white/3 border border-white/10 rounded-xl p-5">
          <h4 className="font-medium text-white mb-6">Goal Pipeline Status</h4>
          <div className="space-y-5">
            <div className="h-4 w-full bg-white/5 rounded-full overflow-hidden flex">
              <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${approvedPercentage}%` }} title="Approved" />
              <div className="h-full bg-amber-500 transition-all duration-1000" style={{ width: `${pendingPercentage}%` }} title="Pending" />
              <div className="h-full bg-slate-500 transition-all duration-1000" style={{ width: `${draftPercentage}%` }} title="Draft/Rejected" />
            </div>
            
            <div className="grid grid-cols-3 gap-2 text-center pt-2">
              <div>
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-white font-medium text-sm">{approvedPercentage}%</span>
                </div>
                <p className="text-slate-500 text-xs">Approved</p>
              </div>
              <div>
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span className="text-white font-medium text-sm">{pendingPercentage}%</span>
                </div>
                <p className="text-slate-500 text-xs">Pending</p>
              </div>
              <div>
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-500" />
                  <span className="text-white font-medium text-sm">{draftPercentage}%</span>
                </div>
                <p className="text-slate-500 text-xs">Draft/Rework</p>
              </div>
            </div>
          </div>

          {/* Manager Leaderboard */}
          <div className="mt-8 pt-6 border-t border-white/5">
            <h4 className="font-medium text-white mb-4 text-sm">Manager Effectiveness (Approval Rates)</h4>
            <div className="space-y-3 max-h-32 overflow-y-auto pr-2">
              {managerStats.map(mgr => (
                <div key={mgr.name} className="flex items-center justify-between">
                  <span className="text-slate-300 text-sm truncate pr-4">{mgr.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 w-8 text-right">{mgr.approvalRate}%</span>
                    <div className="w-16 h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className={cn("h-full rounded-full", mgr.approvalRate > 80 ? 'bg-emerald-500' : mgr.approvalRate > 40 ? 'bg-amber-500' : 'bg-red-500')} style={{ width: `${mgr.approvalRate}%` }} />
                    </div>
                  </div>
                </div>
              ))}
              {managerStats.length === 0 && <p className="text-slate-500 text-xs text-center">No managers found.</p>}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
