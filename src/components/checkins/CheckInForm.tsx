'use client';

import { useState, useTransition } from 'react';
import { upsertCheckIn, type CheckInFormData } from '@/app/actions/checkins';
import type { Goal, CheckIn, Quarter, CheckinStatus } from '@/types/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Save, AlertCircle, CheckCircle2 } from 'lucide-react';

type Props = {
  goal: Goal;
  quarter: Quarter;
  quarterYear: number;
  existingCheckIn?: CheckIn | null;
};

export default function CheckInForm({ goal, quarter, quarterYear, existingCheckIn }: Props) {
  const [actualValue, setActualValue] = useState<string>(
    existingCheckIn?.actual_value != null ? String(existingCheckIn.actual_value) : ''
  );
  const [status, setStatus] = useState<CheckinStatus>(
    existingCheckIn?.status ?? 'not_started'
  );
  const [comments, setComments] = useState(
    existingCheckIn?.employee_comments ?? ''
  );
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  // ── Auto-Calculate Progress Score ────────────────────────────
  const actualNum = actualValue === '' ? null : parseFloat(actualValue);
  let progressScore = 0;

  if (actualNum != null) {
    if (goal.uom_type === 'numeric_max' && goal.target_value) {
      // Standard Maximize: (actual / target) * 100
      progressScore = (actualNum / goal.target_value) * 100;
    } 
    else if (goal.uom_type === 'numeric_min' && goal.target_value) {
      // Standard Minimize: (target / actual) * 100
      progressScore = actualNum === 0 ? 100 : (goal.target_value / actualNum) * 100;
    } 
    else if (goal.uom_type === 'timeline') {
      progressScore = actualNum >= 1 ? 100 : 0;
    } 
    else if (goal.uom_type === 'zero') {
      progressScore = actualNum === 0 ? 100 : 0;
    }
  }

  // Cap at 100 and floor at 0
  progressScore = Math.max(0, Math.min(100, Math.round(progressScore)));

  const handleSave = () => {
    setError(null);
    setSuccess(false);

    if (actualNum === null) {
      setError('Please enter an actual value.');
      return;
    }

    startTransition(async () => {
      const payload: CheckInFormData = {
        goal_id: goal.id,
        quarter,
        quarter_year: quarterYear,
        actual_value: actualNum,
        progress_score: progressScore,
        status,
        employee_comments: comments,
      };

      const result = await upsertCheckIn(payload);
      if (result.success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <div className="bg-white/3 border border-white/5 rounded-xl p-5 mb-4 space-y-4">
      
      {/* Header Info */}
      <div className="flex items-start justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <p className="text-violet-400/70 text-[11px] font-medium uppercase tracking-wider mb-1">
            {goal.thrust_area}
          </p>
          <h4 className="text-white font-medium text-sm">{goal.title}</h4>
          <div className="flex gap-3 mt-1.5 text-xs text-slate-500">
            <span>UoM: <strong className="text-slate-300">{goal.uom_type}</strong></span>
            {goal.target_value != null && <span>Target: <strong className="text-slate-300">{goal.target_value}</strong></span>}
            <span>Weight: <strong className="text-slate-300">{goal.weightage}%</strong></span>
          </div>
        </div>

        {/* Live Score Display */}
        <div className="shrink-0 flex flex-col items-end">
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-1.5 text-center min-w-[70px]">
            <p className="text-emerald-400 font-bold text-xl leading-none">
              {progressScore}%
            </p>
            <p className="text-emerald-500/70 text-[9px] mt-0.5 uppercase tracking-wider">score</p>
          </div>
        </div>
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs text-slate-400">Actual Value</label>
          <Input
            type="number"
            placeholder={goal.uom_type === 'timeline' ? "1 for done, 0 for not done" : "Enter current number"}
            value={actualValue}
            onChange={(e) => setActualValue(e.target.value)}
            disabled={isPending}
            className="bg-white/5 border-white/10 text-white h-9 focus-visible:ring-violet-500"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs text-slate-400">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as CheckinStatus)}
            disabled={isPending}
            className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
          >
            <option value="not_started" className="bg-[#1a1a24] text-white">Not Started</option>
            <option value="on_track" className="bg-[#1a1a24] text-white">On Track</option>
            <option value="completed" className="bg-[#1a1a24] text-white">Completed</option>
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs text-slate-400">Comments / Justification</label>
        <Textarea
          placeholder="Briefly explain your progress..."
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          disabled={isPending}
          className="bg-white/5 border-white/10 text-white resize-none min-h-[60px] focus-visible:ring-violet-500"
        />
      </div>

      {/* Error & Success States */}
      {error && (
        <div className="flex items-center gap-2 p-2.5 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 p-2.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs transition-opacity animate-in fade-in">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Saved successfully
        </div>
      )}

      {/* Action Bar */}
      <div className="flex justify-end pt-2">
        <Button
          onClick={handleSave}
          disabled={isPending || actualValue === ''}
          size="sm"
          className="bg-violet-600 hover:bg-violet-500 text-white gap-1.5 shadow-lg shadow-violet-500/20 border-0"
        >
          {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          Save Check-in
        </Button>
      </div>

      {/* Manager Comments Display */}
      {existingCheckIn?.manager_comments && (
        <div className="mt-4 p-3 bg-violet-500/5 border border-violet-500/10 rounded-lg">
          <p className="text-[10px] font-semibold text-violet-400 uppercase tracking-wider mb-1">Manager Feedback</p>
          <p className="text-sm text-slate-300">{existingCheckIn.manager_comments}</p>
        </div>
      )}
    </div>
  );
}
