'use client';

import { useState, useTransition } from 'react';
import { updateManagerComment } from '@/app/actions/checkins';
import type { Goal, CheckIn, Profile } from '@/types/supabase';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, Save, CheckCircle2 } from 'lucide-react';

type Props = {
  employee: Profile;
  goals: Goal[];
  checkIns: CheckIn[];
};

export default function ManagerCheckInReview({ employee, goals, checkIns }: Props) {
  // Local state for comments to avoid full re-renders on every keystroke
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
      {goals.map(goal => {
        const checkIn = checkIns.find(c => c.goal_id === goal.id);
        const hasCheckIn = !!checkIn;
        
        return (
          <div key={goal.id} className="bg-white/3 border border-white/5 rounded-xl overflow-hidden flex flex-col md:flex-row">
            
            {/* Goal Info (Left) */}
            <div className="p-5 flex-1 border-b md:border-b-0 md:border-r border-white/5 min-w-0">
              <p className="text-violet-400/70 text-[11px] font-medium uppercase tracking-wider mb-1">
                {goal.thrust_area}
              </p>
              <h4 className="text-white font-medium mb-2">{goal.title}</h4>
              
              <div className="flex gap-4 text-sm text-slate-400 mb-4">
                <div>Target: <span className="text-white">{goal.target_value ?? 'N/A'}</span></div>
                <div>Weight: <span className="text-white">{goal.weightage}%</span></div>
              </div>

              {!hasCheckIn ? (
                <div className="text-sm text-amber-400/80 bg-amber-500/10 p-3 rounded border border-amber-500/20">
                  {employee.full_name} has not submitted a check-in for this goal yet.
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex gap-4 bg-black/20 p-3 rounded-lg border border-white/5">
                    <div>
                      <p className="text-xs text-slate-500">Actual Value</p>
                      <p className="text-white font-medium text-lg">{checkIn.actual_value ?? 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Score</p>
                      <p className="text-emerald-400 font-bold text-lg">{checkIn.progress_score}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Status</p>
                      <p className="text-white mt-1 text-sm capitalize">{checkIn.status.replace('_', ' ')}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500 mb-1">Employee Comments</p>
                    <div className="text-sm text-slate-300 bg-white/5 p-3 rounded border border-white/5 whitespace-pre-wrap min-h-[60px]">
                      {checkIn.employee_comments || <span className="text-slate-500 italic">No comments provided.</span>}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Manager Comment (Right) */}
            <div className="p-5 w-full md:w-80 shrink-0 bg-black/10 flex flex-col justify-between">
              <div>
                <label className="text-xs text-violet-300 font-medium tracking-wide uppercase block mb-2">
                  Manager Feedback
                </label>
                {hasCheckIn ? (
                  <Textarea
                    placeholder="Provide feedback on this progress..."
                    value={comments[checkIn.id] ?? ''}
                    onChange={(e) => setComments(prev => ({ ...prev, [checkIn.id]: e.target.value }))}
                    disabled={isPending}
                    className="bg-white/5 border-white/10 text-white min-h-[120px] resize-none focus-visible:ring-violet-500"
                  />
                ) : (
                  <p className="text-sm text-slate-500 italic">Waiting for check-in to provide feedback.</p>
                )}
              </div>

              {hasCheckIn && (
                <div className="flex justify-end mt-4">
                  <Button
                    onClick={() => handleSaveComment(checkIn.id)}
                    disabled={isPending}
                    size="sm"
                    variant={savedId === checkIn.id ? "outline" : "default"}
                    className={savedId === checkIn.id 
                      ? "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 w-full"
                      : "bg-violet-600 hover:bg-violet-500 text-white border-0 w-full"}
                  >
                    {savingId === checkIn.id ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : savedId === checkIn.id ? (
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    {savedId === checkIn.id ? 'Saved' : 'Save Feedback'}
                  </Button>
                </div>
              )}
            </div>

          </div>
        );
      })}
    </div>
  );
}
