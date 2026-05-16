'use client';

import { useState, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { updateManagerComment } from '@/app/actions/checkins';
import type { Goal, CheckIn, Profile } from '@/types/supabase';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, Save, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type Props = {
  employee: Profile;
  goals: Goal[];
  checkIns: CheckIn[];
};

export default function ManagerCheckInReview({ employee, goals, checkIns }: Props) {
  const [comments, setComments] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    checkIns.forEach(c => {
      initial[c.id] = c.manager_comments ?? '';
    });
    return initial;
  });

  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSaveComment = (checkInId: string) => {
    setSavingId(checkInId);
    setSavedId(null);
    const text = comments[checkInId] || '';

    startTransition(async () => {
      const res = await updateManagerComment(checkInId, text);
      setSavingId(null);
      if (res.success) {
        setSavedId(checkInId);
        setTimeout(() => setSavedId(null), 2000);
      }
    });
  };

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {goals.map((goal, i) => {
          const checkIn = checkIns.find(c => c.goal_id === goal.id);
          const hasCheckIn = !!checkIn;
          const charCount = hasCheckIn ? (comments[checkIn.id]?.length || 0) : 0;
          
          return (
            <motion.div
              key={goal.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, type: 'spring', stiffness: 200, damping: 20 }}
              className="glass rounded-xl overflow-hidden flex flex-col md:flex-row group border border-white/5 hover:border-violet-500/30 transition-colors duration-300"
            >
              {/* Goal Info (Left) */}
              <div className="p-6 flex-1 border-b md:border-b-0 md:border-r border-white/5 min-w-0">
                <p className="text-violet-400/70 text-[11px] font-medium uppercase tracking-wider mb-2 flex items-center gap-2">
                  {goal.thrust_area}
                </p>
                <h4 className="text-white font-medium mb-3 text-lg">{goal.title}</h4>
                
                <div className="flex gap-6 text-sm text-slate-400 mb-6 bg-white/5 inline-flex p-2 rounded-lg border border-white/5">
                  <div>Target: <span className="text-white font-medium">{goal.target_value ?? 'N/A'}</span></div>
                  <div className="w-[1px] bg-white/10" />
                  <div>Weight: <span className="text-white font-medium">{goal.weightage}%</span></div>
                </div>

                {!hasCheckIn ? (
                  <div className="text-sm text-amber-400/80 bg-amber-500/10 p-4 rounded-lg border border-amber-500/20 flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    {employee.full_name} has not submitted a check-in for this goal yet.
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex gap-6 bg-black/30 p-4 rounded-lg border border-white/5 relative overflow-hidden">
                      <div className="absolute top-0 left-0 bottom-0 w-1 bg-emerald-500/50" />
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Actual Value</p>
                        <p className="text-white font-medium text-xl">{checkIn.actual_value ?? 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Score</p>
                        <p className="text-emerald-400 font-bold text-xl drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]">{checkIn.progress_score}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Status</p>
                        <p className="text-white text-sm capitalize px-2 py-1 bg-white/10 rounded">{checkIn.status.replace('_', ' ')}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400 mb-2 uppercase tracking-wider font-medium">Employee Comments</p>
                      <div className="text-sm text-slate-300 bg-white/5 p-4 rounded-lg border border-white/5 whitespace-pre-wrap min-h-[60px] leading-relaxed">
                        {checkIn.employee_comments || <span className="text-slate-500 italic">No comments provided.</span>}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Manager Comment (Right) */}
              <div className="p-6 w-full md:w-80 shrink-0 bg-black/20 flex flex-col justify-between relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-violet-500/5 to-transparent pointer-events-none" />
                <div className="relative z-10">
                  <label className="text-xs text-violet-300 font-medium tracking-wide uppercase block mb-3">
                    Manager Feedback
                  </label>
                  {hasCheckIn ? (
                    <div className="relative">
                      <Textarea
                        placeholder="Provide feedback on this progress..."
                        value={comments[checkIn.id] ?? ''}
                        onChange={(e) => setComments(prev => ({ ...prev, [checkIn.id]: e.target.value }))}
                        disabled={isPending}
                        className="bg-white/5 border-white/10 text-white min-h-[140px] resize-none focus-visible:ring-violet-500 focus-visible:border-violet-500 transition-all duration-300 shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] pb-6"
                      />
                      <div className="absolute bottom-2 right-2 text-[10px] font-medium text-slate-500 pointer-events-none">
                        <motion.span 
                          key={charCount}
                          initial={{ scale: 1.5, color: '#A78BFA' }}
                          animate={{ scale: 1, color: '#64748B' }}
                        >
                          {charCount}
                        </motion.span> chars
                      </div>
                    </div>
                  ) : (
                    <div className="h-[140px] border border-white/5 border-dashed rounded-lg flex items-center justify-center text-center p-4">
                      <p className="text-sm text-slate-500 italic">Waiting for check-in to provide feedback.</p>
                    </div>
                  )}
                </div>

                {hasCheckIn && (
                  <div className="flex justify-end mt-4 relative z-10">
                    <Button
                      onClick={() => handleSaveComment(checkIn.id)}
                      disabled={isPending}
                      size="sm"
                      variant={savedId === checkIn.id ? "outline" : "default"}
                      className={cn(
                        "w-full transition-all duration-300 btn-bounce relative overflow-hidden",
                        savedId === checkIn.id 
                          ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                          : "bg-violet-600 hover:bg-violet-500 text-white border-0 shadow-[0_0_15px_rgba(124,58,237,0.3)] hover:shadow-[0_0_25px_rgba(124,58,237,0.5)]"
                      )}
                    >
                      {/* Shimmer effect inside button */}
                      {savedId !== checkIn.id && !isPending && (
                        <div className="absolute inset-0 -translate-x-full hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12" />
                      )}
                      
                      {savingId === checkIn.id ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin relative z-10" />
                      ) : savedId === checkIn.id ? (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="flex items-center"
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                        </motion.div>
                      ) : (
                        <Save className="w-4 h-4 mr-2 relative z-10" />
                      )}
                      <span className="relative z-10">{savedId === checkIn.id ? 'Saved' : 'Save Feedback'}</span>
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
