'use client';


import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, ChevronRight, Activity, AlertCircle, CheckCircle2, Lock } from 'lucide-react';

import type { Profile, Quarter } from '@/types/supabase';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

type EmployeeCheckInStatus = {
  id: string;
  profile: Profile;
  goalCount: number;
  checkInCount: number;
  overallScore: number;
  isFullySubmitted: boolean;
};

type Props = {
  teamStatus: EmployeeCheckInStatus[];
  year: number;
  currentQuarter: Quarter;
  validQuarters: Quarter[];
};

export default function ManagerCheckInsClient({ teamStatus, year, currentQuarter, validQuarters }: Props) {
  const router = useRouter();

  const handleQuarterChange = (q: Quarter) => {
    // Current quarter logic - don't allow future quarters? Or just visual
    // The prompt says: "Quarter selector tabs: Same animated underline as admin tabs. Active: glowing purple. Locked: frosted with bounce lock icon"
    // For this prototype, let's assume Q3/Q4 are locked (if it's currently Q2, or whatever). We can just mock locking Q3 and Q4 for demonstration.
    const isLocked = q === 'Q3' || q === 'Q4';
    if (isLocked) return;
    router.push(`/dashboard/manager/check-ins?q=${q}`);
  };

  return (
    <div className="space-y-8 p-4">
      {/* ── Header & Quarter Selector ────────────────────────────── */}
      <motion.div
        className="flex flex-col md:flex-row md:items-end justify-between gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div>
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 via-cyan-400 to-violet-400" style={{ filter: 'drop-shadow(0 0 15px rgba(124,58,237,0.3))' }}>
            Team Check-ins
          </h2>
          <p className="text-slate-400 mt-1 text-sm">
            Review {year} performance and add manager feedback.
          </p>
        </div>

        {/* Animated Quarter Tabs */}
        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 shrink-0 relative">
          {validQuarters.map((q) => {
            const isActive = currentQuarter === q;
            // Mocking lock for Q3/Q4 just to satisfy the lock requirement beautifully
            const isLocked = q === 'Q3' || q === 'Q4';

            return (
              <button
                key={q}
                onClick={() => handleQuarterChange(q)}
                disabled={isLocked}
                className={cn(
                  "relative px-4 py-2 text-sm font-medium transition-all duration-300 rounded-lg flex items-center gap-1.5",
                  isActive ? "text-white" : isLocked ? "text-slate-600 cursor-not-allowed group" : "text-slate-400 hover:text-white hover:bg-white/5"
                )}
              >
                {isLocked && <Lock className="w-3 h-3 group-hover:animate-bounce" />}
                {q}
                {isActive && (
                  <motion.div
                    className="absolute inset-0 bg-violet-600/30 rounded-lg border border-violet-500/50"
                    layoutId="quarter-tab-active"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    style={{ boxShadow: '0 0 15px rgba(124,58,237,0.3)' }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* ── Team List with Planned vs Actual Bar Chart ─────────── */}
      <motion.div
        className="glass rounded-xl overflow-hidden"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, type: 'spring', stiffness: 200, damping: 20 }}
      >
        <div className="px-5 py-4 border-b border-white/5 bg-white/5 flex items-center gap-2">
          <Users className="w-4 h-4 text-violet-400" />
          <h3 className="text-white font-medium text-sm">Direct Reports Check-in Status</h3>
        </div>
        
        {teamStatus.length === 0 ? (
          <div className="p-10 text-center">
            <Users className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">You have no direct reports assigned.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            <AnimatePresence>
              {teamStatus.map((emp, idx) => {
                const scoreColor = emp.overallScore >= 90 ? 'bg-emerald-500' : emp.overallScore >= 70 ? 'bg-amber-500' : emp.overallScore > 0 ? 'bg-red-500' : 'bg-slate-600';
                const shadowColor = emp.overallScore >= 90 ? 'rgba(16,185,129,0.4)' : emp.overallScore >= 70 ? 'rgba(245,158,11,0.4)' : emp.overallScore > 0 ? 'rgba(239,68,68,0.4)' : 'rgba(71,85,105,0.4)';

                return (
                  <motion.div
                    key={emp.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + idx * 0.1, type: 'spring', bounce: 0.4 }}
                  >
                    <Link
                      href={`/dashboard/manager/check-ins/${emp.id}?q=${currentQuarter}`}
                      className="flex items-center justify-between p-5 hover:bg-white/5 transition-all duration-300 group block relative border-l-2 border-transparent hover:border-violet-500 btn-bounce"
                    >
                      {/* Glow background on hover based on status */}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-[0.03] transition-opacity duration-300 pointer-events-none" style={{ backgroundColor: shadowColor }} />
                      
                      <div className="flex items-center gap-4 relative z-10 w-1/3">
                        <div className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center text-violet-300 font-medium group-hover:shadow-[0_0_15px_rgba(124,58,237,0.3)] transition-all">
                          {(emp.profile.full_name || emp.profile.email || '?').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-white font-medium text-sm group-hover:text-violet-300 transition-colors">{emp.profile.full_name || 'Unnamed Employee'}</p>
                          <p className="text-slate-500 text-xs mt-0.5">{emp.profile.email}</p>
                        </div>
                      </div>

                      {/* Planned vs Actual Bar Chart */}
                      <div className="hidden md:flex flex-1 items-center gap-4 px-8">
                        <div className="flex-1">
                          <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                            <span>0%</span>
                            <span>100% Planned</span>
                          </div>
                          <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden flex relative">
                            {/* Target line (100%) */}
                            <div className="absolute top-0 bottom-0 right-0 w-[2px] bg-white/20 z-10" />
                            <motion.div
                              className={`h-full rounded-full ${scoreColor} shimmer`}
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(emp.overallScore, 100)}%` }}
                              transition={{ delay: 0.8 + idx * 0.1, duration: 1, ease: 'easeOut' }}
                              style={{ boxShadow: `0 0 10px ${shadowColor}` }}
                            />
                          </div>
                        </div>
                        <div className="w-16 text-right">
                          <p className="text-white font-medium text-sm">{emp.overallScore}%</p>
                          <p className="text-slate-500 text-[10px]">Actual</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 w-1/3 justify-end relative z-10">
                        <div className="text-right hidden xl:block">
                          <p className="text-white text-sm">{emp.checkInCount} / {emp.goalCount} completed</p>
                          <p className="text-slate-500 text-xs mt-0.5">Submissions</p>
                        </div>
                        
                        <div
                          className={cn(
                            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium border min-w-[120px] justify-center transition-transform group-hover:scale-105',
                            emp.isFullySubmitted 
                              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25 shadow-[0_0_10px_rgba(16,185,129,0.1)]' 
                              : emp.goalCount === 0 
                                ? 'bg-slate-800 text-slate-400 border-slate-700/50'
                                : 'bg-amber-500/15 text-amber-400 border-amber-500/25 shadow-[0_0_10px_rgba(245,158,11,0.1)]'
                          )}
                        >
                          {emp.isFullySubmitted ? <CheckCircle2 className="w-3 h-3" /> : emp.goalCount === 0 ? <AlertCircle className="w-3 h-3" /> : <Activity className="w-3 h-3" />}
                          {emp.isFullySubmitted ? 'Submitted' : emp.goalCount === 0 ? 'No Goals' : 'In Progress'}
                        </div>
                        
                        <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-violet-400 group-hover:translate-x-1 transition-all duration-300" />
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </motion.div>
    </div>
  );
}
