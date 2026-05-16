'use client';

import { useState, useTransition } from 'react';
import { deleteGoal, submitGoalsForApproval } from '@/app/actions/goals';
import type { Goal, GoalStatus, UomType } from '@/types/supabase';
import GoalForm from './GoalForm';

import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  SendHorizonal,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Target,
  Lock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ── UoM label map ────────────────────────────────────────────
const UOM_LABELS: Record<UomType, string> = {
  numeric_max: '↑ Maximize',
  numeric_min: '↓ Minimize',
  timeline:    '📅 Timeline',
  zero:        '⊘ Zero Target',
};

// ── Status config ─────────────────────────────────────────────
const STATUS_CONFIG: Record<
  GoalStatus,
  { label: string; color: string; icon: React.ElementType }
> = {
  draft: {
    label: 'Draft',
    color: 'bg-slate-700/50 text-slate-300 border-slate-600/50',
    icon: Pencil,
  },
  pending_approval: {
    label: 'Pending',
    color: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
    icon: Clock,
  },
  approved: {
    label: 'Approved',
    color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
    icon: CheckCircle2,
  },
  rejected: {
    label: 'Rejected',
    color: 'bg-red-500/15 text-red-400 border-red-500/25',
    icon: XCircle,
  },
};

type Props = {
  goals: Goal[];
  year: number;
};

export default function GoalList({ goals, year }: Props) {
  const [formOpen, setFormOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const totalWeightage = goals.reduce((sum, g) => sum + g.weightage, 0);
  const draftGoals = goals.filter((g) => g.status === 'draft');
  const rejectedGoals = goals.filter((g) => g.status === 'rejected');
  const editableGoals = [...draftGoals, ...rejectedGoals];
  const hasDrafts = draftGoals.length > 0;
  const hasRejected = rejectedGoals.length > 0;
  // Locked only if there are pending_approval or approved goals
  const isLocked = goals.some((g) => g.status === 'pending_approval' || g.status === 'approved');
  const canAddMore = goals.length < 8 && !isLocked;
  const canSubmit = (hasDrafts || hasRejected) && totalWeightage === 100 && !isLocked;
  const usedWeightage = totalWeightage;

  const handleEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setFormOpen(true);
  };

  const handleAdd = () => {
    setEditingGoal(null);
    setFormOpen(true);
  };

  const handleDelete = (id: string) => {
    setError(null);
    startTransition(async () => {
      const result = await deleteGoal(id);
      if (!result.success) setError(result.error);
    });
  };

  const handleSubmit = () => {
    setError(null);
    startTransition(async () => {
      const result = await submitGoalsForApproval();
      if (!result.success) setError(result.error);
    });
  };

  const weightageColor =
    totalWeightage === 100
      ? 'bg-emerald-500'
      : totalWeightage > 100
      ? 'bg-red-500'
      : 'bg-violet-500';

  return (
    <div className="space-y-6">
      {/* ── Header + Weightage Summary ───────────────────── */}
      <div className="bg-white/3 border border-white/5 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="text-white font-semibold text-sm">
              Goals for {year}
            </h3>
            <p className="text-slate-500 text-xs mt-0.5">
              {goals.length} / 8 goals &nbsp;·&nbsp; {totalWeightage}% allocated
            </p>
          </div>

          {!isLocked && (
            <Button
              onClick={handleAdd}
              disabled={!canAddMore || isPending}
              size="sm"
              className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white border-0 shadow-lg shadow-violet-500/20 gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Goal
            </Button>
          )}
        </div>

        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="h-2.5 bg-white/5 rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all duration-500', weightageColor)}
              style={{ width: `${Math.min(totalWeightage, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-600">
            <span>0%</span>
            <span
              className={cn(
                'font-medium',
                totalWeightage === 100
                  ? 'text-emerald-400'
                  : totalWeightage > 100
                  ? 'text-red-400'
                  : 'text-slate-400'
              )}
            >
              {totalWeightage === 100
                ? '✓ Ready to submit'
                : totalWeightage > 100
                ? 'Over 100% — reduce weightage'
                : `${100 - totalWeightage}% remaining`}
            </span>
            <span>100%</span>
          </div>
        </div>
      </div>

      {/* ── Error Banner ─────────────────────────────────── */}
      {error && (
        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* ── Empty State ──────────────────────────────────── */}
      {goals.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-white/5 border-dashed rounded-xl">
          <div className="w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-4">
            <Target className="w-6 h-6 text-violet-400" />
          </div>
          <p className="text-white font-medium mb-1">No goals yet</p>
          <p className="text-slate-500 text-sm mb-5 max-w-xs">
            Add up to 8 goals for {year}. Each goal needs at least 10% weightage, and your total must reach 100% before you can submit.
          </p>
          <Button
            onClick={handleAdd}
            size="sm"
            className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white border-0 gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Add your first goal
          </Button>
        </div>
      )}

      {/* ── Rejection Banner ──────────────────────────────── */}
      {hasRejected && goals[0]?.rejection_reason && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
          <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-red-400 font-medium text-sm">Manager returned your goals for revision</p>
            <p className="text-red-300/80 text-sm mt-1">&ldquo;{goals[0].rejection_reason}&rdquo;</p>
            <p className="text-slate-500 text-xs mt-2">Edit your goals below and resubmit when ready.</p>
          </div>
        </div>
      )}

      {/* ── Goal Cards ───────────────────────────────────── */}
      {goals.length > 0 && (
        <div className="space-y-3">
          {goals.map((goal) => {
            const status = STATUS_CONFIG[goal.status];
            const StatusIcon = status.icon;
            const isDraft = goal.status === 'draft';
            const isRejected = goal.status === 'rejected';
            const isEditable = (isDraft || isRejected) && !isLocked;

            return (
              <div
                key={goal.id}
                className={cn(
                  "group bg-white/3 border hover:border-white/10 rounded-xl p-5 transition-all duration-200",
                  isRejected ? 'border-red-500/20' : 'border-white/5'
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Shared badge */}
                    {goal.is_shared && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border bg-indigo-500/15 text-indigo-400 border-indigo-500/25 mb-1.5">
                        🔗 Shared Goal
                      </span>
                    )}
                    {/* Thrust area tag */}
                    {goal.thrust_area && (
                      <p className="text-violet-400/70 text-[11px] font-medium uppercase tracking-wider mb-1">
                        {goal.thrust_area}
                      </p>
                    )}
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-white font-medium text-sm truncate">
                        {goal.title}
                      </span>
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border',
                          status.color
                        )}
                      >
                        <StatusIcon className="w-3 h-3" />
                        {status.label}
                      </span>
                    </div>
                    {goal.description && (
                      <p className="text-slate-500 text-sm leading-relaxed mt-1 line-clamp-2">
                        {goal.description}
                      </p>
                    )}
                    {/* Meta row: UoM + Target + Deadline */}
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      <span className="text-[11px] px-1.5 py-0.5 rounded bg-white/5 text-slate-400 border border-white/8">
                        {UOM_LABELS[goal.uom_type] ?? goal.uom_type}
                      </span>
                      {goal.target_value != null && (
                        <span className="text-[11px] text-slate-500">
                          Target: <span className="text-slate-300">{goal.target_value}</span>
                        </span>
                      )}
                      {goal.deadline && (
                        <span className="text-[11px] text-slate-500">
                          Deadline: <span className="text-slate-300">{new Date(goal.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Weightage pill */}
                  <div className="shrink-0 flex flex-col items-end gap-2">
                    <div className="bg-violet-500/10 border border-violet-500/20 rounded-lg px-3 py-1.5 text-center">
                      <p className="text-violet-300 font-bold text-lg leading-none">
                        {goal.weightage}%
                      </p>
                      <p className="text-violet-500 text-[10px] mt-0.5">weight</p>
                    </div>
                  </div>
                </div>

                {/* Weightage bar per card */}
                <div className="mt-4">
                  <Progress
                    value={goal.weightage}
                    className="h-1 bg-white/5"
                  />
                </div>


                {/* Actions (for draft and rejected goals) */}
                {isEditable && (
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(goal)}
                      disabled={isPending}
                      className="h-7 px-3 text-slate-400 hover:text-white hover:bg-white/5 gap-1.5 text-xs"
                    >
                      <Pencil className="w-3 h-3" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(goal.id)}
                      disabled={isPending}
                      className="h-7 px-3 text-slate-400 hover:text-red-400 hover:bg-red-500/10 gap-1.5 text-xs"
                    >
                      {isPending ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Trash2 className="w-3 h-3" />
                      )}
                      Delete
                    </Button>
                  </div>
                )}

                {/* Locked indicator */}
                {!isEditable && !isRejected && !isDraft && (
                  <div className="flex items-center gap-1.5 mt-4 pt-4 border-t border-white/5">
                    <Lock className="w-3 h-3 text-slate-600" />
                    <span className="text-slate-600 text-xs">
                      Goal is locked — awaiting manager review
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Submit Panel ─────────────────────────────────── */}
      {hasDrafts && (
        <div
          className={cn(
            'border rounded-xl p-5 flex items-center justify-between gap-4 flex-wrap transition-colors duration-300',
            canSubmit
              ? 'bg-emerald-500/5 border-emerald-500/20'
              : 'bg-white/3 border-white/5'
          )}
        >
          <div>
            <p className="text-white font-medium text-sm">
              {canSubmit ? '🎉 Ready to submit!' : 'Almost there…'}
            </p>
            <p className="text-slate-500 text-xs mt-0.5">
              {canSubmit
                ? 'Your goals total 100%. Submit them for manager approval.'
                : `Total weightage is ${totalWeightage}% — must be exactly 100% to submit.`}
            </p>
          </div>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || isPending}
            className={cn(
              'gap-2 border-0 shadow-lg font-medium shrink-0',
              canSubmit
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-500/20'
                : 'bg-white/5 text-slate-500 cursor-not-allowed'
            )}
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting…
              </>
            ) : (
              <>
                <SendHorizonal className="w-4 h-4" />
                Submit for Approval
              </>
            )}
          </Button>
        </div>
      )}

      {/* ── GoalForm Modal ───────────────────────────────── */}
      <GoalForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingGoal(null);
        }}
        editingGoal={editingGoal}
        usedWeightage={usedWeightage}
      />
    </div>
  );
}
