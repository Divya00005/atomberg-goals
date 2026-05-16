'use client';

import { useState, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Profile, Goal } from '@/types/supabase';
import { AlertCircle, Send, CheckCircle2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { sendEscalationNudge } from '@/app/actions/escalations';

type Props = {
  profiles: Profile[];
  goals: Goal[];
};

export default function EscalationTab({ profiles, goals }: Props) {
  const [isPending, startTransition] = useTransition();
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const employees = profiles.filter(p => p.role === 'employee');
  const managers = profiles.filter(p => p.role === 'manager');

  // Rule 1: Employees with NO goals submitted
  const employeesNeedingNudge = employees.filter(emp => {
    const empGoals = goals.filter(g => g.employee_id === emp.id);
    const hasSubmitted = empGoals.some(g => g.status !== 'draft' && g.status !== 'rejected');
    if (hasSubmitted) return false;
    const draftWeightage = empGoals.filter(g => g.status === 'draft').reduce((sum, g) => sum + g.weightage, 0);
    return draftWeightage < 100;
  });

  // Rule 2: Managers with pending approvals
  const managersWithPending = managers.filter(mgr => {
    const teamMembers = employees.filter(e => e.manager_id === mgr.id);
    const teamGoals = goals.filter(g => teamMembers.some(tm => tm.id === g.employee_id));
    return teamGoals.some(g => g.status === 'pending_approval');
  });

  const handleNudge = (userId: string, reason: string) => {
    startTransition(async () => {
      const result = await sendEscalationNudge(userId, reason);
      if (result.success) {
        setSuccessMsg(result.message || 'Nudge sent successfully!');
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    });
  };

  return (
    <div className="space-y-6 p-6">
      <motion.div
        className="flex items-start justify-between"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-500 lock-bounce" />
            Rule-Based Escalation Module
          </h3>
          <p className="text-sm text-slate-400 mt-1">
            Automatically identifies bottlenecks. Click &quot;Nudge&quot; to simulate sending a Microsoft Teams/Email notification via the Audit Trail.
          </p>
        </div>
      </motion.div>

      <AnimatePresence>
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <p className="text-emerald-400 text-sm">{successMsg}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Missing Goals Panel */}
        <motion.div
          className="glass rounded-xl overflow-hidden border-l-4 border-l-red-500/50"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 22 }}
          style={{ boxShadow: '0 0 20px rgba(239,68,68,0.05)' }}
        >
          <div className="p-4 border-b border-white/5 bg-white/5 flex items-center gap-2">
            <Clock className="w-4 h-4 text-red-400 lock-bounce" />
            <h4 className="font-medium text-white">Employees Missing Goals</h4>
          </div>
          <div className="divide-y divide-white/5">
            {employeesNeedingNudge.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-sm">All employees have submitted their goals!</div>
            ) : (
              employeesNeedingNudge.map((emp, i) => (
                <motion.div
                  key={emp.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.06 }}
                  className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-red-600/30 flex items-center justify-center text-red-400 text-xs font-bold shrink-0">
                      {(emp.full_name || emp.email || '?').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">{emp.full_name || 'Unnamed Employee'}</p>
                      <p className="text-slate-500 text-xs">{emp.email}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleNudge(emp.id, 'Missing Goal Submission')}
                    disabled={isPending}
                    className="h-8 text-xs bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 btn-bounce"
                  >
                    <Send className="w-3 h-3 mr-1.5" />
                    Nudge
                  </Button>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>

        {/* Pending Approvals Panel */}
        <motion.div
          className="glass rounded-xl overflow-hidden border-l-4 border-l-amber-500/50"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.35, type: 'spring', stiffness: 200, damping: 22 }}
          style={{ boxShadow: '0 0 20px rgba(245,158,11,0.05)' }}
        >
          <div className="p-4 border-b border-white/5 bg-white/5 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 lock-bounce" />
            <h4 className="font-medium text-white">Pending Manager Approvals</h4>
          </div>
          <div className="divide-y divide-white/5">
            {managersWithPending.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-sm">No managers have pending approvals!</div>
            ) : (
              managersWithPending.map((mgr, i) => (
                <motion.div
                  key={mgr.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.06 }}
                  className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-amber-600/30 flex items-center justify-center text-amber-400 text-xs font-bold shrink-0">
                      {(mgr.full_name || mgr.email || '?').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">{mgr.full_name || 'Unnamed Manager'}</p>
                      <p className="text-slate-500 text-xs">{mgr.email}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleNudge(mgr.id, 'Pending Goal Approvals')}
                    disabled={isPending}
                    className="h-8 text-xs bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 hover:text-amber-300 btn-bounce"
                  >
                    <Send className="w-3 h-3 mr-1.5" />
                    Nudge
                  </Button>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
