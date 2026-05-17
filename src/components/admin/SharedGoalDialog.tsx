'use client';

import { useState, useTransition } from 'react';
import { createSharedGoal, type SharedGoalFormData } from '@/app/actions/shared-goals';
import type { Profile, UomType } from '@/types/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertCircle, Loader2, Share2, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

const UOM_OPTIONS: { value: UomType; label: string }[] = [
  { value: 'numeric_max', label: 'Numeric — Maximize' },
  { value: 'numeric_min', label: 'Numeric — Minimize' },
  { value: 'timeline',    label: 'Timeline / Date' },
  { value: 'zero',        label: 'Zero Target' },
];

type Props = {
  employees: Profile[];
};

export default function SharedGoalDialog({ employees }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [thrustArea, setThrustArea] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [uomType, setUomType] = useState<UomType>('numeric_max');
  const [targetValue, setTargetValue] = useState('');
  const [deadline, setDeadline] = useState('');
  const [weightage, setWeightage] = useState(10);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);

  const toggleEmployee = (id: string) => {
    setSelectedEmployees(prev =>
      prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!thrustArea.trim()) return setError('Thrust area is required.');
    if (!title.trim()) return setError('Goal title is required.');
    if (weightage < 10) return setError('Minimum weightage is 10%.');
    if (selectedEmployees.length === 0) return setError('Select at least one employee.');

    startTransition(async () => {
      const data: SharedGoalFormData = {
        thrust_area: thrustArea,
        title,
        description,
        uom_type: uomType,
        target_value: targetValue ? parseFloat(targetValue) : null,
        deadline: uomType === 'timeline' ? deadline || null : null,
        weightage,
        employee_ids: selectedEmployees,
      };

      const result = await createSharedGoal(data);
      if (result.success) {
        setSuccess(true);
        setThrustArea('');
        setTitle('');
        setDescription('');
        setUomType('numeric_max');
        setTargetValue('');
        setDeadline('');
        setWeightage(10);
        setSelectedEmployees([]);
        setTimeout(() => { setOpen(false); setSuccess(false); }, 1500);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  };

  const employeeList = employees.filter(e => e.role === 'employee');

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        size="sm"
        className="bg-indigo-600 hover:bg-indigo-500 text-white border-0 gap-1.5 rounded-lg shadow-lg shadow-indigo-500/20"
      >
        <Share2 className="w-3.5 h-3.5" />
        Push Shared Goal
      </Button>

      <Dialog open={open} onOpenChange={(v) => { if (!v) { setOpen(false); setError(null); setSuccess(false); } }}>
        <DialogContent className="bg-[#13131a] border-white/10 text-white max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center">
                <Share2 className="w-4 h-4 text-indigo-400" />
              </div>
              <DialogTitle className="text-white text-base font-semibold">
                Push Shared Goal
              </DialogTitle>
            </div>
            <DialogDescription className="text-slate-400 text-sm">
              Create a departmental KPI and push it to selected employees. They can only adjust the weightage.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label className="text-slate-300 text-sm">Thrust Area <span className="text-red-400">*</span></Label>
              <Input
                placeholder="e.g. Sales Growth, Cost Optimization"
                value={thrustArea}
                onChange={(e) => setThrustArea(e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus-visible:ring-indigo-500 h-10"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-slate-300 text-sm">Goal Title <span className="text-red-400">*</span></Label>
              <Input
                placeholder="e.g. Achieve ₹50L quarterly revenue"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus-visible:ring-indigo-500 h-10"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-slate-300 text-sm">Description</Label>
              <Textarea
                placeholder="Details about the shared KPI..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus-visible:ring-indigo-500 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-slate-300 text-sm">UoM Type</Label>
                <select
                  value={uomType}
                  onChange={(e) => setUomType(e.target.value as UomType)}
                  className="flex w-full items-center rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
                >
                  {UOM_OPTIONS.map(o => (
                    <option key={o.value} value={o.value} className="bg-[#1a1a24] text-white">{o.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-slate-300 text-sm">Target Value</Label>
                <Input
                  type="number"
                  placeholder="e.g. 5000000"
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus-visible:ring-indigo-500 h-10"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-slate-300 text-sm">Default Weightage (%)</Label>
              <Input
                type="number"
                min={10}
                max={100}
                value={weightage}
                onChange={(e) => setWeightage(parseInt(e.target.value, 10) || 0)}
                className="bg-white/5 border-white/10 text-white focus-visible:ring-indigo-500 h-10"
              />
            </div>

            {/* Employee selection */}
            <div className="space-y-2">
              <Label className="text-slate-300 text-sm">Assign to Employees <span className="text-red-400">*</span></Label>
              <div className="max-h-40 overflow-y-auto border border-white/10 rounded-lg p-2 space-y-1 bg-white/3">
                {employeeList.length === 0 ? (
                  <p className="text-slate-500 text-xs p-2">No employees found.</p>
                ) : (
                  employeeList.map(emp => (
                    <label
                      key={emp.id}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors text-sm",
                        selectedEmployees.includes(emp.id) ? 'bg-indigo-500/15 text-white' : 'hover:bg-white/5 text-slate-400'
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={selectedEmployees.includes(emp.id)}
                        onChange={() => toggleEmployee(emp.id)}
                        className="rounded border-white/30 bg-white/10 text-indigo-500 focus:ring-indigo-500"
                      />
                      <span>{emp.full_name || emp.email}</span>
                    </label>
                  ))
                )}
              </div>
              <p className="text-slate-500 text-xs">{selectedEmployees.length} employee(s) selected</p>
            </div>

            {error && (
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <p className="text-emerald-400 text-sm">Shared goal pushed successfully!</p>
              </div>
            )}

            <DialogFooter className="gap-2 pt-1">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="text-slate-400 hover:text-white hover:bg-white/5">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending || !title.trim() || !thrustArea.trim() || selectedEmployees.length === 0}
                className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white border-0 shadow-lg shadow-indigo-500/20"
              >
                {isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Pushing...</>
                ) : (
                  <><Share2 className="w-4 h-4 mr-2" />Push to {selectedEmployees.length} Employee(s)</>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
