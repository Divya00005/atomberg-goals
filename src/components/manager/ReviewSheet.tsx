'use client';

import { useState, useTransition, useRef } from 'react';
import { updateGoalInline, approveGoalSheet, rejectGoalSheet } from '@/app/actions/manager';
import type { Goal, Profile } from '@/types/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Loader2, CheckCircle2, XCircle, AlertCircle, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

type Props = {
  employee: Profile;
  initialGoals: Goal[];
  year: number;
};

function TiltGoalCard({ children, index }: { children: React.ReactNode; index: number }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState({});

  const handleMouseMove = (e: React.MouseEvent) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const rotateX = ((y - rect.height / 2) / (rect.height / 2)) * -5;
    const rotateY = ((x - rect.width / 2) / (rect.width / 2)) * 5;
    setStyle({
      transform: `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-2px)`,
    });
  };

  const handleMouseLeave = () => {
    setStyle({ transform: 'perspective(800px) rotateX(0deg) rotateY(0deg)' });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.2 + index * 0.1, type: 'spring', stiffness: 250, damping: 20 }}
    >
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ ...style, transition: 'transform 0.2s ease-out', willChange: 'transform' }}
        className="glass border border-white/5 rounded-xl p-5 flex flex-col md:flex-row gap-6 hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)] group relative"
      >
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-xl bg-gradient-to-br from-white/5 to-transparent" />
        {children}
      </div>
    </motion.div>
  );
}

export default function ReviewSheet({ employee, initialGoals, year }: Props) {
  const router = useRouter();
  const [goals, setGoals] = useState<Goal[]>(initialGoals);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Success animation states
  const [isApprovedAnimation, setIsApprovedAnimation] = useState(false);
  const [showToast, setShowToast] = useState(false);

  // Dialog states
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  // Use state to track status locally for immediate visual feedback
  const [status, setStatus] = useState(initialGoals.length > 0 ? initialGoals[0].status : 'draft');
  const isPendingApproval = status === 'pending_approval';

  const totalWeightage = goals.reduce((sum, g) => sum + (g.weightage || 0), 0);
  const isWeightageValid = totalWeightage === 100;

  const handleEdit = (id: string, field: 'weightage' | 'target_value', value: string) => {
    setGoals(prev => prev.map(g => {
      if (g.id !== id) return g;
      const numValue = value === '' ? null : parseFloat(value);
      return { ...g, [field]: numValue };
    }));
  };

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
        router.refresh(); 
      }
    });
  };

  const fireConfetti = () => {
    const duration = 3 * 1000;
    const end = Date.now() + duration;
    (function frame() {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#10B981', '#34D399', '#059669']
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#10B981', '#34D399', '#059669']
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    }());
  };

  const handleApprove = () => {
    setError(null);
    startTransition(async () => {
      const res = await approveGoalSheet(employee.id, year);
      if (res.success) {
        setApproveOpen(false);
        setIsApprovedAnimation(true);
        setStatus('approved');
        fireConfetti();
        setShowToast(true);
        setTimeout(() => setShowToast(false), 5000);
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
        setStatus('rejected');
        // Vibrate/Shake error effect if needed, but just changing status is fine
      } else {
        setError(res.error);
      }
    });
  };

  return (
    <motion.div
      className="space-y-6 relative"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {/* Success Toast */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -50, x: 20 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-6 right-6 z-50 glass bg-emerald-900/40 border-emerald-500/30 p-4 rounded-xl shadow-2xl flex items-center gap-3"
          >
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-white font-medium text-sm">All goals approved!</p>
              <p className="text-emerald-200/70 text-xs">The goals are now locked and active.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Bar */}
      <div className="glass-strong rounded-xl p-5 flex items-center justify-between flex-wrap gap-4 sticky top-20 z-10">
        <div>
          <h2 className="text-xl font-bold text-white">{employee.full_name}&apos;s Goals</h2>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-slate-400 text-sm">
              {goals.length} goals &nbsp;·&nbsp; Total Weightage: <span className={cn('font-medium transition-colors', totalWeightage === 100 ? 'text-emerald-400' : 'text-red-400')}>{totalWeightage}%</span>
            </p>
            {error && (
              <p className="text-red-400 text-xs flex items-center gap-1 bg-red-500/10 px-2 py-1 rounded">
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
              className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 gap-1.5 btn-bounce hover:shadow-[0_0_15px_rgba(239,68,68,0.3)] transition-all"
            >
              <XCircle className="w-4 h-4 group-hover:animate-pulse" />
              Reject & Return
            </Button>
            <Button
              onClick={() => setApproveOpen(true)}
              disabled={isPending || !isWeightageValid}
              className="bg-emerald-600 hover:bg-emerald-500 text-white border-0 gap-1.5 btn-bounce hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all group"
            >
              <CheckCircle2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
              Approve Sheet
            </Button>
          </div>
        )}
        
        {status === 'approved' && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-sm font-medium"
          >
            <CheckCircle2 className="w-4 h-4" /> Goal Sheet Approved
          </motion.div>
        )}
      </div>

      {/* Goal List */}
      <div className="space-y-4">
        {goals.map((goal, idx) => (
          <TiltGoalCard key={goal.id} index={idx}>
            <div className="flex-1 min-w-0 z-10 relative">
              <p className="text-violet-400/70 text-[11px] font-medium uppercase tracking-wider mb-1 flex items-center gap-2">
                {goal.thrust_area}
                {isApprovedAnimation && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0, rotate: -15 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    transition={{ delay: 0.5 + idx * 0.1, type: 'spring' }}
                    className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  >
                    APPROVED
                  </motion.span>
                )}
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
            <div className="flex flex-col gap-3 shrink-0 w-full md:w-48 bg-black/20 p-4 rounded-lg border border-white/5 z-10 relative">
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400">Target Value</label>
                <Input
                  type="number"
                  disabled={!isPendingApproval || isPending || goal.uom_type === 'zero'}
                  value={goal.target_value ?? ''}
                  onChange={(e) => handleEdit(goal.id, 'target_value', e.target.value)}
                  onBlur={() => handleSaveInline(goal.id)}
                  className="bg-white/5 border-white/10 h-8 text-sm focus-visible:ring-violet-500 transition-all hover:bg-white/10"
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
                    "bg-white/5 border-white/10 h-8 text-sm focus-visible:ring-violet-500 transition-all hover:bg-white/10",
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
          </TiltGoalCard>
        ))}
      </div>

      {/* Approve Dialog */}
      <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
        <DialogContent className="glass-strong border-emerald-500/20 text-white overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-teal-500" />
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" /> Approve Goals?
            </DialogTitle>
            <DialogDescription className="text-slate-400 pt-2 text-base">
              Are you sure you want to approve these {goals.length} goals for <span className="text-white font-medium">{employee.full_name}</span>? This will lock the goals and they will become active for check-ins.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6">
            <Button variant="ghost" onClick={() => setApproveOpen(false)} disabled={isPending} className="text-slate-400 hover:text-white">Cancel</Button>
            <Button onClick={handleApprove} disabled={isPending} className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2 shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] transition-all">
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Approving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" /> Confirm Approval
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="glass-strong border-red-500/20 text-white overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-400 to-orange-500" />
          <DialogHeader>
            <DialogTitle className="text-red-400 flex items-center gap-2 text-xl">
              <XCircle className="w-6 h-6" /> Reject Goal Sheet
            </DialogTitle>
            <DialogDescription className="text-slate-400 pt-2">
              Returning these goals to <span className="text-white font-medium">{employee.full_name}</span> for revision. Please provide a clear reason so they know what to fix.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <Textarea
              placeholder="e.g. Please increase the target value on the revenue goal and adjust weightages..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="bg-black/20 border-white/10 text-white focus-visible:ring-red-500 focus-visible:border-red-500/50 resize-none h-32 transition-all hover:bg-white/5"
            />
          </div>
          <DialogFooter className="mt-6">
            <Button variant="ghost" onClick={() => setRejectOpen(false)} disabled={isPending} className="text-slate-400 hover:text-white">Cancel</Button>
            <motion.div whileTap={{ scale: 0.95 }}>
              <Button onClick={handleReject} disabled={isPending || !rejectionReason.trim()} className="bg-red-600 hover:bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.3)] transition-all">
                {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />} Reject & Return
              </Button>
            </motion.div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
