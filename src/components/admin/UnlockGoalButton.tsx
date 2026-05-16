'use client';

import { useState, useTransition } from 'react';
import { unlockGoal } from '@/app/actions/admin';
import { Button } from '@/components/ui/button';
import { Loader2, Unlock, AlertCircle } from 'lucide-react';

export default function UnlockGoalButton({ goalId }: { goalId: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleUnlock = () => {
    setError(null);
    startTransition(async () => {
      const res = await unlockGoal(goalId);
      if (!res.success) {
        setError(res.error);
      }
    });
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={handleUnlock}
        disabled={isPending}
        size="sm"
        className="bg-amber-600 hover:bg-amber-500 text-white gap-1.5 h-8 text-xs"
      >
        {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Unlock className="w-3.5 h-3.5" />}
        Unlock Goal
      </Button>
      {error && <span className="text-red-400 text-xs flex items-center gap-1"><AlertCircle className="w-3 h-3"/>{error}</span>}
    </div>
  );
}
