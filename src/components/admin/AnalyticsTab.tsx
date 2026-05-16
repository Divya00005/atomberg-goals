'use client';

import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type { Goal, Profile } from '@/types/supabase';
import { BarChart3, Target, CheckCircle2, AlertCircle } from 'lucide-react';
import { CountUp } from '@/components/effects/MotionWrappers';
import { cn } from '@/lib/utils';

type Props = {
  goals: Goal[];
  profiles: Profile[];
};

// 3D tilt for metric cards
function MetricTilt({ children, index }: { children: React.ReactNode; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState({});

  const handleMouseMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const rotateX = ((y - rect.height / 2) / (rect.height / 2)) * -5;
    const rotateY = ((x - rect.width / 2) / (rect.width / 2)) * 5;
    setStyle({
      transform: `perspective(500px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-3px)`,
      boxShadow: '0 16px 32px rgba(124,58,237,0.15)',
    });
  };
  const handleMouseLeave = () => setStyle({ transform: 'perspective(500px) rotateX(0) rotateY(0)', boxShadow: 'none' });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.1, type: 'spring', stiffness: 300, damping: 24 }}
    >
      <div
        ref={ref}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ ...style, transition: 'transform 0.15s ease-out, box-shadow 0.3s ease', willChange: 'transform' }}
        className="glass rounded-xl overflow-hidden"
      >
        {children}
      </div>
    </motion.div>
  );
}

export default function AnalyticsTab({ goals, profiles }: Props) {
  // Aggregate Thrust Areas
  const thrustAreaCounts = goals.reduce((acc, goal) => {
    const area = goal.thrust_area || 'Uncategorized';
    acc[area] = (acc[area] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sortedThrustAreas = Object.entries(thrustAreaCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

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

  const floatClasses = ['icon-float', 'icon-float-slow', 'icon-float-fast'];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <motion.div
        className="flex items-start justify-between"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-400" />
            Executive Analytics Dashboard
          </h3>
          <p className="text-sm text-slate-400 mt-1">
            Real-time organizational insights on goal distributions and manager effectiveness.
          </p>
        </div>
      </motion.div>

      {/* Metric Cards with 3D tilt + count-up */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {[
          { icon: Target, label: 'Total Active Goals', value: totalGoals, color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
          { icon: CheckCircle2, label: 'Org Approval Rate', value: approvedPercentage, suffix: '%', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
          { icon: AlertCircle, label: 'Pending Approval', value: statusCounts['pending_approval'] || 0, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
        ].map((m, i) => (
          <MetricTilt key={m.label} index={i}>
            <div className="p-5 flex items-center gap-4">
              <div className={cn(`w-12 h-12 rounded-full ${m.bg} border ${m.border} flex items-center justify-center shrink-0`, floatClasses[i])}>
                <m.icon className={`w-6 h-6 ${m.color}`} />
              </div>
              <div>
                <p className="text-slate-400 text-sm">{m.label}</p>
                <p className={`text-2xl font-bold ${m.color}`}>
                  <CountUp target={m.value} duration={1.5} suffix={m.suffix || ''} />
                </p>
              </div>
            </div>
          </MetricTilt>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Thrust Areas - animated bars */}
        <motion.div
          className="glass rounded-xl p-5"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h4 className="font-medium text-white mb-6">Top Thrust Areas</h4>
          {sortedThrustAreas.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-4">No data available.</p>
          ) : (
            <div className="space-y-4">
              {sortedThrustAreas.map(([area, count], idx) => {
                const widthPercent = (count / maxThrustAreaCount) * 100;
                return (
                  <motion.div
                    key={area}
                    className="space-y-1.5"
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + idx * 0.08 }}
                  >
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300 font-medium">{area}</span>
                      <span className="text-slate-500">{count} goals</span>
                    </div>
                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full shimmer-continuous"
                        initial={{ width: 0 }}
                        animate={{ width: `${widthPercent}%` }}
                        transition={{ delay: 0.6 + idx * 0.1, duration: 0.8, ease: 'easeOut' }}
                        style={{ boxShadow: '0 0 8px rgba(99,102,241,0.3)' }}
                      />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Goal Pipeline */}
        <motion.div
          className="glass rounded-xl p-5"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h4 className="font-medium text-white mb-6">Goal Pipeline Status</h4>
          <div className="space-y-5">
            {/* Stacked bar */}
            <div className="h-4 w-full bg-white/5 rounded-full overflow-hidden flex">
              <motion.div
                className="h-full bg-emerald-500"
                initial={{ width: 0 }}
                animate={{ width: `${approvedPercentage}%` }}
                transition={{ delay: 0.6, duration: 0.8, ease: 'easeOut' }}
                title="Approved"
              />
              <motion.div
                className="h-full bg-amber-500"
                initial={{ width: 0 }}
                animate={{ width: `${pendingPercentage}%` }}
                transition={{ delay: 0.7, duration: 0.8, ease: 'easeOut' }}
                title="Pending"
              />
              <motion.div
                className="h-full bg-slate-500"
                initial={{ width: 0 }}
                animate={{ width: `${draftPercentage}%` }}
                transition={{ delay: 0.8, duration: 0.8, ease: 'easeOut' }}
                title="Draft/Rejected"
              />
            </div>

            {/* Legend */}
            <div className="grid grid-cols-3 gap-2 text-center pt-2">
              {[
                { color: 'bg-emerald-500', pct: approvedPercentage, label: 'Approved' },
                { color: 'bg-amber-500', pct: pendingPercentage, label: 'Pending' },
                { color: 'bg-slate-500', pct: draftPercentage, label: 'Draft/Rework' },
              ].map((item, idx) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 + idx * 0.1 }}
                >
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <div className={cn('w-2.5 h-2.5 rounded-full', item.color)} />
                    <span className="text-white font-medium text-sm">{item.pct}%</span>
                  </div>
                  <p className="text-slate-500 text-xs">{item.label}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Manager Leaderboard */}
          <div className="mt-8 pt-6 border-t border-white/5">
            <h4 className="font-medium text-white mb-4 text-sm">Manager Effectiveness (Approval Rates)</h4>
            <div className="space-y-3 max-h-32 overflow-y-auto pr-2">
              {managerStats.map((mgr, i) => (
                <motion.div
                  key={mgr.name}
                  className="flex items-center justify-between"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.0 + i * 0.08 }}
                >
                  <span className="text-slate-300 text-sm truncate pr-4">{mgr.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 w-8 text-right">{mgr.approvalRate}%</span>
                    <div className="w-16 h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        className={cn('h-full rounded-full', mgr.approvalRate > 80 ? 'bg-emerald-500' : mgr.approvalRate > 40 ? 'bg-amber-500' : 'bg-red-500')}
                        initial={{ width: 0 }}
                        animate={{ width: `${mgr.approvalRate}%` }}
                        transition={{ delay: 1.1 + i * 0.1, duration: 0.6 }}
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
              {managerStats.length === 0 && <p className="text-slate-500 text-xs text-center">No managers found.</p>}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
