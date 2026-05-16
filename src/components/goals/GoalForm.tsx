'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createGoal, updateGoal, type GoalFormData } from '@/app/actions/goals';
import type { Goal, UomType } from '@/types/supabase';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertCircle, Loader2, Target, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

// ── UoM options ───────────────────────────────────────────────
const UOM_OPTIONS: { value: UomType; label: string; description: string }[] = [
  { value: 'numeric_max', label: 'Numeric — Maximize', description: 'Higher score = better (e.g. revenue, calls made)' },
  { value: 'numeric_min', label: 'Numeric — Minimize', description: 'Lower score = better (e.g. errors, turnaround time)' },
  { value: 'timeline',    label: 'Timeline / Date',    description: 'Measured by completion deadline' },
  { value: 'zero',        label: 'Zero Target',        description: 'Goal is to achieve zero occurrences (e.g. accidents)' },
];

type Props = {
  open: boolean;
  onClose: () => void;
  editingGoal?: Goal | null;
  /** Total weightage already used by ALL goals (including this one if editing) */
  usedWeightage: number;
};

const EMPTY_FORM: GoalFormData = {
  thrust_area: '',
  title: '',
  description: '',
  uom_type: 'numeric_max',
  target_value: null,
  deadline: null,
  weightage: 10,
};

export default function GoalForm({ open, onClose, editingGoal, usedWeightage }: Props) {
  const [form, setForm] = useState<GoalFormData>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Pre-fill when editing
  useEffect(() => {
    if (editingGoal) {
      setForm({
        thrust_area: editingGoal.thrust_area,
        title: editingGoal.title,
        description: editingGoal.description,
        uom_type: editingGoal.uom_type,
        target_value: editingGoal.target_value,
        deadline: editingGoal.deadline,
        weightage: editingGoal.weightage,
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setError(null);
  }, [editingGoal, open]);

  // Weightage math
  const baseUsed = editingGoal ? usedWeightage - editingGoal.weightage : usedWeightage;
  const remaining = 100 - baseUsed;
  const afterThis = baseUsed + (form.weightage || 0);
  const isOverBudget = (form.weightage || 0) > remaining;
  const isBelowMin = (form.weightage || 0) < 10;
  const isTimeline = form.uom_type === 'timeline';
  const isShared = editingGoal?.is_shared ?? false;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.thrust_area.trim()) return setError('Thrust area is required.');
    if (!form.title.trim())       return setError('Goal title is required.');
    if (isBelowMin)               return setError('Minimum weightage is 10%.');
    if (isOverBudget)             return setError(`Only ${remaining}% remaining. Reduce this goal's weightage.`);
    if (isTimeline && !form.deadline) return setError('Please select a deadline for timeline goals.');

    setLoading(true);
    const result = editingGoal
      ? await updateGoal(editingGoal.id, form)
      : await createGoal(form);
    setLoading(false);

    if (!result.success) { setError(result.error); return; }
    onClose();
    router.refresh();
  };

  const set = <K extends keyof GoalFormData>(key: K, value: GoalFormData[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-[#13131a] border-white/10 text-white max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-lg bg-violet-500/15 border border-violet-500/20 flex items-center justify-center">
              <Target className="w-4 h-4 text-violet-400" />
            </div>
            <DialogTitle className="text-white text-base font-semibold">
              {editingGoal ? (isShared ? 'Edit Shared Goal' : 'Edit Goal') : 'New Goal'}
            </DialogTitle>
          </div>
        </DialogHeader>

        {isShared && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20 mt-2">
            <span className="text-indigo-400 text-sm">🔗 This is a shared goal. You can only adjust the <strong>weightage</strong>.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">

          {/* ── Thrust Area ─────────────────────── */}
          <div className="space-y-1.5">
            <Label htmlFor="thrust-area" className="text-slate-300 text-sm">
              Thrust Area <span className="text-red-400">*</span>
            </Label>
            <Input
              id="thrust-area"
              placeholder="e.g. Customer Experience, Operational Efficiency"
              value={form.thrust_area}
              onChange={(e) => set('thrust_area', e.target.value)}
              maxLength={100}
              disabled={isShared}
              className={cn("bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus-visible:ring-violet-500 h-10", isShared && 'opacity-60 cursor-not-allowed')}
            />
          </div>

          {/* ── Goal Title ──────────────────────── */}
          <div className="space-y-1.5">
            <Label htmlFor="goal-title" className="text-slate-300 text-sm">
              Goal Title <span className="text-red-400">*</span>
            </Label>
            <Input
              id="goal-title"
              placeholder="e.g. Improve NPS score from 42 to 55"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              maxLength={120}
              disabled={isShared}
              className={cn("bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus-visible:ring-violet-500 h-10", isShared && 'opacity-60 cursor-not-allowed')}
            />
          </div>

          {/* ── Description ─────────────────────── */}
          <div className="space-y-1.5">
            <Label htmlFor="goal-desc" className="text-slate-300 text-sm">
              Description
            </Label>
            <Textarea
              id="goal-desc"
              placeholder="What does success look like? How will this be measured?"
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              rows={3}
              className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus-visible:ring-violet-500 resize-none"
            />
          </div>

          {/* ── UoM Type ────────────────────────── */}
          <div className="space-y-1.5">
            <Label htmlFor="uom-type" className="text-slate-300 text-sm">
              Unit of Measurement (UoM) <span className="text-red-400">*</span>
            </Label>
            <Select
              value={form.uom_type}
              onValueChange={(v) => set('uom_type', v as UomType)}
            >
              <SelectTrigger
                id="uom-type"
                className="bg-white/5 border-white/10 text-white focus:ring-violet-500 h-10"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a24] border-white/10">
                {UOM_OPTIONS.map(({ value, label, description }) => (
                  <SelectItem
                    key={value}
                    value={value}
                    className="text-white focus:bg-violet-500/20 focus:text-white"
                  >
                    <div>
                      <p className="font-medium text-sm">{label}</p>
                      <p className="text-slate-500 text-xs">{description}</p>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* ── Target Value + Deadline (conditional) ── */}
          <div className={cn('grid gap-4', isTimeline ? 'grid-cols-2' : 'grid-cols-1')}>
            {/* Target Value — hidden for timeline & zero */}
            {form.uom_type !== 'zero' && (
              <div className="space-y-1.5">
                <Label htmlFor="target-value" className="text-slate-300 text-sm">
                  Target Value {form.uom_type !== 'timeline' && <span className="text-red-400">*</span>}
                </Label>
                <Input
                  id="target-value"
                  type="number"
                  placeholder={isTimeline ? 'Optional' : 'e.g. 55'}
                  value={form.target_value ?? ''}
                  onChange={(e) =>
                    set('target_value', e.target.value ? parseFloat(e.target.value) : null)
                  }
                  className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus-visible:ring-violet-500 h-10"
                />
              </div>
            )}

            {/* Deadline — only for timeline */}
            {isTimeline && (
              <div className="space-y-1.5">
                <Label htmlFor="deadline" className="text-slate-300 text-sm">
                  Deadline <span className="text-red-400">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="deadline"
                    type="date"
                    value={form.deadline ?? ''}
                    onChange={(e) => set('deadline', e.target.value || null)}
                    min={new Date().toISOString().split('T')[0]}
                    className="bg-white/5 border-white/10 text-white focus-visible:ring-violet-500 h-10 [color-scheme:dark]"
                  />
                  <Calendar className="absolute right-3 top-2.5 w-4 h-4 text-slate-500 pointer-events-none" />
                </div>
              </div>
            )}
          </div>

          {/* ── Weightage ───────────────────────── */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="goal-weightage" className="text-slate-300 text-sm">
                Weightage (%) <span className="text-red-400">*</span>
              </Label>
              <span
                className={cn(
                  'text-xs font-medium px-2 py-0.5 rounded-full border',
                  remaining <= 0
                    ? 'bg-red-500/10 text-red-400 border-red-500/20'
                    : 'bg-slate-800 text-slate-400 border-white/10'
                )}
              >
                {remaining}% remaining
              </span>
            </div>

            <Input
              id="goal-weightage"
              type="number"
              min={10}
              max={100}
              value={form.weightage}
              onChange={(e) => set('weightage', parseInt(e.target.value, 10) || 0)}
              className={cn(
                'bg-white/5 border-white/10 text-white focus-visible:ring-violet-500 h-10',
                (isOverBudget || isBelowMin) && 'border-red-500/50 focus-visible:ring-red-500'
              )}
            />

            {/* Visual bar */}
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-300',
                  afterThis > 100
                    ? 'bg-red-500'
                    : afterThis === 100
                    ? 'bg-emerald-500'
                    : 'bg-violet-500'
                )}
                style={{ width: `${Math.min(afterThis, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-600">
              <span>0%</span>
              <span className={cn(
                'font-medium',
                afterThis === 100 ? 'text-emerald-400' : afterThis > 100 ? 'text-red-400' : 'text-slate-400'
              )}>
                {afterThis}% used
              </span>
              <span>100%</span>
            </div>
          </div>

          {/* ── Error ───────────────────────────── */}
          {error && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <DialogFooter className="gap-2 pt-1">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="text-slate-400 hover:text-white hover:bg-white/5"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                loading ||
                isOverBudget ||
                isBelowMin ||
                !form.title.trim() ||
                !form.thrust_area.trim()
              }
              className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white border-0 shadow-lg shadow-violet-500/20"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving…</>
              ) : editingGoal ? 'Save Changes' : 'Add Goal'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
