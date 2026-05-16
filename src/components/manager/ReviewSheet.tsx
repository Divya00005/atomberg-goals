'use client';

import { useState, useTransition } from 'react';
import { updateGoalInline, approveGoalSheet, rejectGoalSheet } from '@/app/actions/manager';
import type { Goal, Profile } from '@/types/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Loader2, CheckCircle2, XCircle, AlertCircle, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

type Props = {
  employee: Profile;
  initialGoals: Goal[];
  year: number;
};

export default function ReviewSheet({ employee, initialGoals, year }: Props) {
  const router = useRouter();
  const [goals, setGoals] = useState<Goal[]>(initialGoals);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const status = initialGoals.length > 0 ? initialGoals[0].status : 'draft';
  const isPendingApproval = status === 'pending_approval';

  const totalWeightage = goals.reduce((sum, g) => sum + g.weightage, 0);
  const isWeightageValid = totalWeightage === 100;

  // Handle inline edits locally before saving
  const handleEdit = (id: string, field: 'weightage' | 'target_value', value: string) => {
    setGoals(prev => prev.map(g => {
      if (g.id !== id) return g;
      const numValue = value === '' ? null : parseFloat(value);
      return { ...g, [field]: numValue };
    }));
  };

  // Save inline edits
  const handleSaveInline = (id: string) => {
    const goal = goals.find(g => g.id === id);
    if (!goal) return;

    setError(null);
    startTransition(async () => {
      const res = await updateGoalInline(id, {
        target_value: goal.target_value,
        weightage: goal.weightage,
      });
      if (!res.success) {
        setError(res.error);
        // Revert local state on error by triggering a refresh
        router.refresh(); 
      }
    });
  };

  const handleApprove = () => {
    setError(null);
    startTransition(async () => {
      const res = await approveGoalSheet(employee.id, year);
      if (res.success) {
        setApproveOpen(false);
      } else {
        setError(res.error);
      }
    });
  };

  const handleReject = () => {
    setError(null);
    if (!rejectionReason.trim()) {
      setError('Please provide a reason for rejection.');
      return;
    }
    startTransition(async () => {
      const res = await rejectGoalSheet(employee.id, year, rejectionReason);
      if (res.success) {
        setRejectOpen(false);
      } else {
        setError(res.error);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="bg-white/3 border border-white/5 rounded-xl p-5 flex items-center justify-between flex-wrap gap-4 sticky top-20 z-10 backdrop-blur-md">
        <div>
          <h2 className="text-xl font-bold text-white">{employee.full_name}&apos;s Goals</h2>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-slate-400 text-sm">
              {goals.length} goals &nbsp;·&nbsp; Total Weightage: <span className={cn('font-medium', totalWeightage === 100 ? 'text-emerald-400' : 'text-red-400')}>{totalWeightage}%</span>
            </p>
            {error && (
              <p className="text-red-400 text-xs flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {error}
              </p>
            )}
          </div>
        </div>

        {isPendingApproval && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setRejectOpen(true)}
              disabled={isPending}
              className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 gap-1.5"
            >
              <XCircle className="w-4 h-4" />
              Reject & Return
            </Button>
            <Button
              onClick={() => setApproveOpen(true)}
              disabled={isPending || !isWeightageValid}
              className="bg-emerald-600 hover:bg-emerald-500 text-white border-0 gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              Approve Sheet
            </Button>
          </div>
        )}
      </div>

      {/* Goal List */}
      <div className="space-y-4">
        {goals.map((goal) => (
          <div key={goal.id} className="bg-white/3 border border-white/5 rounded-xl p-5 flex flex-col md:flex-row gap-6">
            <div className="flex-1 min-w-0">
              <p className="text-violet-400/70 text-[11px] font-medium uppercase tracking-wider mb-1">
                {goal.thrust_area}
              </p>
              <h3 className="text-white font-medium text-base mb-1">{goal.title}</h3>
              <p className="text-slate-400 text-sm mb-3 line-clamp-2">{goal.description}</p>
              
              <div className="flex flex-wrap gap-2 text-[11px] text-slate-500">
                <span className="px-2 py-1 rounded bg-white/5 border border-white/10">UoM: {goal.uom_type}</span>
                {goal.deadline && (
                  <span className="px-2 py-1 rounded bg-white/5 border border-white/10">
                    Deadline: {new Date(goal.deadline).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>

            {/* Editable Fields for Manager */}
            <div className="flex flex-col gap-3 shrink-0 w-full md:w-48 bg-black/20 p-4 rounded-lg border border-white/5">
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400">Target Value</label>
                <Input
                  type="number"
                  disabled={!isPendingApproval || isPending || goal.uom_type === 'zero'}
                  value={goal.target_value ?? ''}
                  onChange={(e) => handleEdit(goal.id, 'target_value', e.target.value)}
                  onBlur={() => handleSaveInline(goal.id)}
                  className="bg-white/5 border-white/10 h-8 text-sm focus-visible:ring-violet-500"
                  placeholder="N/A"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400">Weightage (%)</label>
                <Input
                  type="number"
                  disabled={!isPendingApproval || isPending}
                  value={goal.weightage}
                  onChange={(e) => handleEdit(goal.id, 'weightage', e.target.value)}
                  onBlur={() => handleSaveInline(goal.id)}
                  className={cn(
                    "bg-white/5 border-white/10 h-8 text-sm focus-visible:ring-violet-500",
                    goal.weightage < 10 && "border-red-500/50"
                  )}
                />
              </div>
              {isPendingApproval && (
                <p className="text-[10px] text-slate-500 text-center flex items-center justify-center gap-1">
                  <Save className="w-3 h-3" /> Auto-saves on blur
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Approve Dialog */}
      <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
        <DialogContent className="bg-[#13131a] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Approve Goals?</DialogTitle>
            <DialogDescription className="text-slate-400 pt-2">
              Are you sure you want to approve these {goals.length} goals for {employee.full_name}? This will lock the goals and they will become active for check-ins.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="ghost" onClick={() => setApproveOpen(false)} disabled={isPending} className="text-slate-400 hover:text-white">Cancel</Button>
            <Button onClick={handleApprove} disabled={isPending} className="bg-emerald-600 hover:bg-emerald-500 text-white">
              {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />} Confirm Approval
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="bg-[#13131a] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-red-400">Reject Goal Sheet</DialogTitle>
            <DialogDescription className="text-slate-400 pt-2">
              Returning these goals to {employee.full_name} for revision. Please provide a clear reason so they know what to fix.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <Textarea
              placeholder="e.g. Please increase the target value on the revenue goal and adjust weightages..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="bg-white/5 border-white/10 text-white focus-visible:ring-red-500 resize-none h-24"
            />
          </div>
          <DialogFooter className="mt-4">
            <Button variant="ghost" onClick={() => setRejectOpen(false)} disabled={isPending} className="text-slate-400 hover:text-white">Cancel</Button>
            <Button onClick={handleReject} disabled={isPending || !rejectionReason.trim()} className="bg-red-600 hover:bg-red-500 text-white">
              {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />} Reject & Return
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
