'use client';

import { useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Unlock, History, Activity, AlertCircle, Target, CheckCircle2, Clock } from 'lucide-react';
import { CountUp } from '@/components/effects/MotionWrappers';
import { cn } from '@/lib/utils';
import type { Profile, Goal, AuditLog } from '@/types/supabase';
import CsvExportButton from '@/components/admin/CsvExportButton';
import SharedGoalDialog from '@/components/admin/SharedGoalDialog';
import AnalyticsTab from '@/components/admin/AnalyticsTab';
import EscalationTab from '@/components/admin/EscalationTab';
import UnlockGoalButton from '@/components/admin/UnlockGoalButton';

// ── 3D Tilt Card ──────────────────────────────────────────────
function TiltCard({ children, className, index = 0 }: { children: React.ReactNode; className?: string; index?: number }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState({});

  const handleMouseMove = (e: React.MouseEvent) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const rotateX = ((y - rect.height / 2) / (rect.height / 2)) * -6;
    const rotateY = ((x - rect.width / 2) / (rect.width / 2)) * 6;
    setStyle({
      transform: `perspective(600px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`,
      boxShadow: '0 20px 40px rgba(124, 58, 237, 0.2), 0 0 0 1px rgba(124, 58, 237, 0.1)',
    });
  };

  const handleMouseLeave = () => {
    setStyle({ transform: 'perspective(600px) rotateX(0deg) rotateY(0deg)', boxShadow: 'none' });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24, delay: index * 0.1 }}
    >
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ ...style, transition: 'transform 0.15s ease-out, box-shadow 0.3s ease', willChange: 'transform' }}
        className={cn('glass rounded-xl overflow-hidden', className)}
      >
        {children}
      </div>
    </motion.div>
  );
}

// ── Tab definitions ───────────────────────────────────────────
const TABS = [
  { id: 'users', icon: Users, label: 'Users' },
  { id: 'analytics', icon: Activity, label: 'Analytics' },
  { id: 'escalations', icon: AlertCircle, label: 'Escalations' },
  { id: 'unlock', icon: Unlock, label: 'Goal Unlock' },
  { id: 'audit', icon: History, label: 'Audit Log' },
] as const;

const floatClasses = ['icon-float', 'icon-float-slow', 'icon-float-fast', 'icon-float-slower'];

// ── Main Component ────────────────────────────────────────────
type AdminDashboardClientProps = {
  profiles: Profile[];
  goals: Goal[];
  lockedGoals: Goal[];
  auditLogs: AuditLog[];
  activeTab: string;
};

export default function AdminDashboardClient({
  profiles,
  goals,
  lockedGoals,
  auditLogs,
  activeTab,
}: AdminDashboardClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const totalUsers = profiles.length;
  const totalGoals = goals.length;
  const pendingApprovals = goals.filter(g => g.status === 'pending_approval').length;
  const approvedGoals = goals.filter(g => g.status === 'approved').length;

  const getProfileName = (id?: string | null) => {
    if (!id) return '—';
    return profiles.find(p => p.id === id)?.full_name || '—';
  };

  const handleTabChange = (tabId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tabId);
    router.push(`/dashboard/admin?${params.toString()}`);
  };

  const stats = [
    { label: 'Total Users', value: totalUsers, icon: Users, color: 'text-violet-400', bg: 'bg-violet-500/10', glowColor: 'rgba(124,58,237,0.4)' },
    { label: 'Total Goals', value: totalGoals, icon: Target, color: 'text-indigo-400', bg: 'bg-indigo-500/10', glowColor: 'rgba(99,102,241,0.4)' },
    { label: 'Pending Approvals', value: pendingApprovals, icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10', glowColor: 'rgba(245,158,11,0.4)' },
    { label: 'Approved Goals', value: approvedGoals, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10', glowColor: 'rgba(16,185,129,0.4)' },
  ];

  return (
    <div className="space-y-8">
      {/* ── Header ─────────────────────────────────────── */}
      <motion.div
        className="flex flex-col md:flex-row md:items-end justify-between gap-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      >
        <div>
          <h2 className="text-2xl font-bold gradient-text" style={{ filter: 'drop-shadow(0 0 20px rgba(124,58,237,0.2))' }}>
            Admin Dashboard
          </h2>
          <motion.p
            className="text-slate-400 mt-1 text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Manage users, unlock goals, and audit system activity.
          </motion.p>
        </div>
        <motion.div
          className="flex items-center gap-3"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 20 }}
        >
          <SharedGoalDialog employees={profiles} />
          <CsvExportButton />
        </motion.div>
      </motion.div>

      {/* ── Stat Cards ─────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <TiltCard key={stat.label} index={i}>
              <div className="p-5 relative">
                <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center mb-1 ${floatClasses[i]}`}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div className="h-[2px] mb-3 rounded-full overflow-hidden bg-white/5">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: stat.glowColor, boxShadow: `0 0 8px ${stat.glowColor}` }}
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ delay: 0.5 + i * 0.15, duration: 0.6, ease: 'easeOut' }}
                  />
                </div>
                <p className={`text-2xl font-bold ${stat.color}`}>
                  {stat.value > 0 ? <CountUp target={stat.value} duration={1.5} /> : '0'}
                </p>
                <p className="text-white text-xs font-medium mt-0.5">{stat.label}</p>
              </div>
            </TiltCard>
          );
        })}
      </div>

      {/* ── Navigation Tabs ────────────────────────────── */}
      <div className="flex items-center gap-1 border-b border-white/10 pb-0 overflow-x-auto scrollbar-none relative">
        {TABS.map(({ id, icon: Icon, label }, i) => {
          const isActive = activeTab === id;
          return (
            <motion.button
              key={id}
              onClick={() => handleTabChange(id)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.06 }}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all duration-200 whitespace-nowrap relative group btn-bounce',
                isActive
                  ? 'text-white'
                  : 'text-slate-400 hover:text-white hover:scale-105'
              )}
            >
              <Icon className={cn(
                'w-4 h-4 transition-transform duration-200',
                !isActive && 'group-hover:rotate-12'
              )} />
              {label}
              {/* Animated active underline */}
              {isActive && (
                <motion.div
                  className="absolute bottom-0 left-2 right-2 h-[2px] bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full"
                  layoutId="admin-tab-underline"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  style={{ boxShadow: '0 0 10px rgba(124,58,237,0.4)' }}
                />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* ── Tab Content ────────────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
          className="glass rounded-xl overflow-hidden min-h-[400px]"
        >
          {activeTab === 'users' && <UsersTabAnimated profiles={profiles} getProfileName={getProfileName} />}
          {activeTab === 'analytics' && <AnalyticsTab goals={goals} profiles={profiles} />}
          {activeTab === 'escalations' && <EscalationTab goals={goals} profiles={profiles} />}
          {activeTab === 'unlock' && <UnlockTabAnimated lockedGoals={lockedGoals} getProfileName={getProfileName} />}
          {activeTab === 'audit' && <AuditTabAnimated logs={auditLogs} getProfileName={getProfileName} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ── Animated Users Tab ────────────────────────────────────────
function UsersTabAnimated({ profiles, getProfileName }: { profiles: Profile[]; getProfileName: (id: string | null) => string }) {
  const roleAvatarColor: Record<string, string> = {
    admin: 'bg-red-600 shadow-red-500/30',
    manager: 'bg-amber-600 shadow-amber-500/30',
    employee: 'bg-violet-600 shadow-violet-500/30',
  };
  const roleBadgeStyle: Record<string, string> = {
    admin: 'bg-red-500/10 text-red-400 border-red-500/20',
    manager: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    employee: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm text-slate-300">
        <thead className="text-xs text-slate-400 uppercase bg-gradient-to-r from-white/5 via-white/3 to-white/5 border-b border-white/10">
          <tr>
            <th className="px-6 py-4 font-medium tracking-wider">Name</th>
            <th className="px-6 py-4 font-medium tracking-wider">Email</th>
            <th className="px-6 py-4 font-medium tracking-wider">Role</th>
            <th className="px-6 py-4 font-medium tracking-wider">Manager</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {profiles.map((p, i) => (
            <motion.tr
              key={p.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05, type: 'spring', stiffness: 250, damping: 22 }}
              className="hover:bg-white/5 group transition-all duration-200 relative"
            >
              {/* Purple left border on hover */}
              <td className="px-6 py-4 font-medium text-white">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg shrink-0',
                    roleAvatarColor[p.role] || 'bg-slate-600'
                  )}>
                    {(p.full_name || p.email || '?').charAt(0).toUpperCase()}
                  </div>
                  {p.full_name || '—'}
                </div>
              </td>
              <td className="px-6 py-4 text-slate-400">{p.email}</td>
              <td className="px-6 py-4">
                <span className={cn(
                  'px-2.5 py-1 rounded-full text-xs font-medium border capitalize transition-transform hover:scale-110',
                  roleBadgeStyle[p.role] || 'bg-slate-500/10 text-slate-400'
                )}>
                  {p.role}
                </span>
              </td>
              <td className="px-6 py-4">
                {p.manager_id ? (
                  <span className="text-slate-300">{getProfileName(p.manager_id)}</span>
                ) : (
                  <span className="text-slate-600 italic">—</span>
                )}
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Animated Unlock Tab ───────────────────────────────────────
function UnlockTabAnimated({ lockedGoals, getProfileName }: { lockedGoals: Goal[]; getProfileName: (id: string | null) => string }) {
  if (lockedGoals.length === 0) {
    return (
      <motion.div
        className="p-12 text-center text-slate-400"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        No locked goals found.
      </motion.div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm text-slate-300">
        <thead className="text-xs text-slate-400 uppercase bg-gradient-to-r from-white/5 via-white/3 to-white/5 border-b border-white/10">
          <tr>
            <th className="px-6 py-4 font-medium tracking-wider">Employee</th>
            <th className="px-6 py-4 font-medium tracking-wider">Goal Title</th>
            <th className="px-6 py-4 font-medium tracking-wider">Status</th>
            <th className="px-6 py-4 font-medium tracking-wider text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {lockedGoals.map((g, i) => (
            <motion.tr
              key={g.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06, type: 'spring', stiffness: 250, damping: 22 }}
              className="hover:bg-white/5 transition-colors"
            >
              <td className="px-6 py-4 font-medium text-white">{getProfileName(g.employee_id)}</td>
              <td className="px-6 py-4 max-w-md truncate">{g.title}</td>
              <td className="px-6 py-4 capitalize">{g.status.replace('_', ' ')}</td>
              <td className="px-6 py-4 text-right">
                <UnlockGoalButton goalId={g.id} />
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Animated Audit Log Tab ────────────────────────────────────
function AuditTabAnimated({ logs, getProfileName }: { logs: AuditLog[]; getProfileName: (id: string | null) => string }) {
  if (logs.length === 0) {
    return (
      <motion.div
        className="p-12 text-center text-slate-400"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        No audit logs found.
      </motion.div>
    );
  }

  const getActionColor = (desc: string) => {
    const d = desc.toLowerCase();
    if (d.includes('approved') || d.includes('locked')) return 'bg-violet-500';
    if (d.includes('unlocked') || d.includes('created')) return 'bg-emerald-500';
    if (d.includes('rejected')) return 'bg-red-500';
    if (d.includes('nudge') || d.includes('escalation')) return 'bg-amber-500';
    return 'bg-indigo-500';
  };

  return (
    <div className="p-6 relative">
      {/* Timeline line */}
      <div className="absolute left-[2.15rem] top-6 bottom-6 w-[2px] bg-white/5" />

      <div className="space-y-1">
        {logs.map((log, i) => (
          <motion.div
            key={log.id}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04, type: 'spring', stiffness: 250, damping: 22 }}
            className="flex items-start gap-4 py-3 px-2 rounded-lg hover:bg-white/3 transition-colors group"
          >
            {/* Timeline dot */}
            <div className="relative z-10 mt-1.5 shrink-0">
              <div className={cn('w-3 h-3 rounded-full', getActionColor(log.change_description))} />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-slate-200 text-sm">{log.change_description}</p>
              <div className="flex items-center gap-3 mt-1">
                <motion.span
                  className="text-slate-500 text-xs"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 + i * 0.04 }}
                >
                  {new Date(log.changed_at).toLocaleString()}
                </motion.span>
                <span className="text-white text-xs font-medium">
                  {getProfileName(log.changed_by)}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
