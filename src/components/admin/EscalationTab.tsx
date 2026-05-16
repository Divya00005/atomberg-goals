'use client';

import { useState, useTransition } from 'react';
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

  // Rule 1: Employees with NO goals submitted (no pending/approved goals, and less than 100% draft weightage)
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
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            Rule-Based Escalation Module
          </h3>
          <p className="text-sm text-slate-400 mt-1">
            Automatically identifies bottlenecks. Click &quot;Nudge&quot; to simulate sending a Microsoft Teams/Email notification via the Audit Trail.
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <p className="text-emerald-400 text-sm">{successMsg}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Missing Goals Panel */}
        <div className="bg-white/3 border border-white/10 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-white/5 bg-white/5 flex items-center gap-2">
            <Clock className="w-4 h-4 text-red-400" />
            <h4 className="font-medium text-white">Employees Missing Goals</h4>
          </div>
          <div className="divide-y divide-white/5">
            {employeesNeedingNudge.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-sm">All employees have submitted their goals!</div>
            ) : (
              employeesNeedingNudge.map(emp => (
                <div key={emp.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                  <div>
                    <p className="text-white text-sm font-medium">{emp.full_name || 'Unnamed Employee'}</p>
                    <p className="text-slate-500 text-xs">{emp.email}</p>
                  </div>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => handleNudge(emp.id, 'Missing Goal Submission')}
                    disabled={isPending}
                    className="h-8 text-xs bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300"
                  >
                    <Send className="w-3 h-3 mr-1.5" />
                    Nudge
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Pending Approvals Panel */}
        <div className="bg-white/3 border border-white/10 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-white/5 bg-white/5 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400" />
            <h4 className="font-medium text-white">Pending Manager Approvals</h4>
          </div>
          <div className="divide-y divide-white/5">
            {managersWithPending.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-sm">No managers have pending approvals!</div>
            ) : (
              managersWithPending.map(mgr => (
                <div key={mgr.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                  <div>
                    <p className="text-white text-sm font-medium">{mgr.full_name || 'Unnamed Manager'}</p>
                    <p className="text-slate-500 text-xs">{mgr.email}</p>
                  </div>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => handleNudge(mgr.id, 'Pending Goal Approvals')}
                    disabled={isPending}
                    className="h-8 text-xs bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 hover:text-amber-300"
                  >
                    <Send className="w-3 h-3 mr-1.5" />
                    Nudge
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
