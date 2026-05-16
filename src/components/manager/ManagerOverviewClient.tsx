'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Users, ChevronRight } from 'lucide-react';
import { CountUp } from '@/components/effects/MotionWrappers';
import { cn } from '@/lib/utils';
import type { Profile } from '@/types/supabase';

type TeamStatus = {
  id: string;
  profile: Profile;
  statusLabel: string;
  statusColor: string;
  icon: React.ElementType;
  goalCount: number;
  totalWeightage: number;
};

type Props = {
  teamStatus: TeamStatus[];
  stats: {
    label: string;
    value: number;
    icon: React.ElementType;
    color: string;
    bg: string;
    glowColor: string;
  }[];
  year: number;
};

function TypewriterText({ text }: { text: string }) {
  const [displayed, setDisplayed] = useState('');
  const [index, setIndex] = useState(0);

  // Simple un-optimized typewriter effect for the subtitle
  if (index < text.length) {
    setTimeout(() => {
      setDisplayed(text.substring(0, index + 1));
      setIndex(index + 1);
    }, 40);
  }

  return <span>{displayed}</span>;
}

function TiltCard({ children, index = 0 }: { children: React.ReactNode; index?: number }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState({});

  const handleMouseMove = (e: React.MouseEvent) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const rotateX = ((y - rect.height / 2) / (rect.height / 2)) * -15; // Max 15deg
    const rotateY = ((x - rect.width / 2) / (rect.width / 2)) * 15;
    setStyle({
      transform: `perspective(600px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`,
    });
  };

  const handleMouseLeave = () => {
    setStyle({ transform: 'perspective(600px) rotateX(0deg) rotateY(0deg)' });
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.5 + index * 0.15 }}
    >
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ ...style, transition: 'transform 0.15s ease-out', willChange: 'transform' }}
        className="glass-strong rounded-xl overflow-hidden relative group"
      >
        {children}
      </div>
    </motion.div>
  );
}

const floatClasses = ['icon-float', 'icon-float-slow', 'icon-float-fast'];

export default function ManagerOverviewClient({ teamStatus, stats, year }: Props) {
  return (
    <div className="space-y-8 p-4">
      {/* ── Header ────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.4 }}
      >
        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 via-cyan-400 to-violet-400" style={{ filter: 'drop-shadow(0 0 15px rgba(124,58,237,0.3))' }}>
          Team Overview
        </h2>
        <p className="text-slate-400 mt-1 text-sm h-5">
          <TypewriterText text={`Review and approve goals for your direct reports for ${year}.`} />
        </p>
      </motion.div>

      {/* ── Stat Cards ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <TiltCard key={stat.label} index={i}>
              {/* Rotating Gradient Border */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none gradient-border" />
              
              <div className="p-6 relative z-10 transition-shadow duration-300 group-hover:shadow-[inset_0_0_40px_rgba(124,58,237,0.1)]" style={{ '--tw-shadow-color': stat.glowColor } as React.CSSProperties}>
                <div className={`w-12 h-12 rounded-lg ${stat.bg} flex items-center justify-center mb-4 ${floatClasses[i]} shadow-[0_0_20px_var(--tw-shadow-color)]`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <p className={`text-4xl font-black ${stat.color} transition-all duration-1000`}>
                  <CountUp target={stat.value} duration={2} />
                </p>
                <p className="text-white text-sm font-medium mt-1">{stat.label}</p>
              </div>
            </TiltCard>
          );
        })}
      </div>

      {/* ── Direct Reports List ───────────────────────────────── */}
      <motion.div
        className="glass rounded-xl overflow-hidden relative z-10"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, type: 'spring', stiffness: 200, damping: 20 }}
      >
        <div className="px-5 py-4 border-b border-white/5 bg-white/5 flex items-center gap-2">
          <h3 className="text-white font-medium text-sm flex items-center gap-1">
            Direct Reports (<span className="text-violet-400">{teamStatus.length}</span>)
          </h3>
        </div>

        {teamStatus.length === 0 ? (
          <div className="p-10 text-center">
            <Users className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">You have no direct reports assigned.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5 relative">
            {teamStatus.map((emp, i) => {
              const StatusIcon = emp.icon;
              return (
                <motion.div
                  key={emp.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.0 + i * 0.1, type: 'spring', bounce: 0.4 }}
                >
                  <Link
                    href={`/dashboard/manager/report/${emp.id}`}
                    className="flex items-center justify-between p-5 hover:bg-white/10 transition-all duration-300 group block relative border-l-2 border-transparent hover:border-violet-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-violet-500/10 btn-bounce"
                  >
                    {/* Animated gradient left line on hover */}
                    <div className="absolute left-0 top-0 bottom-0 w-0 group-hover:w-[3px] bg-gradient-to-b from-violet-500 to-cyan-500 transition-all duration-300" />
                    
                    <div className="flex items-center gap-4">
                      {/* Avatar with rotating ring */}
                      <div className="relative">
                        <div className="absolute -inset-1 rounded-full border border-violet-500/30 border-dashed animate-[spin_8s_linear_infinite] group-hover:animate-[spin_3s_linear_infinite]" />
                        <div className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center text-violet-300 font-medium avatar-glow">
                          {(emp.profile.full_name || emp.profile.email || '?').charAt(0).toUpperCase()}
                        </div>
                      </div>
                      <div>
                        <motion.p className="text-white font-medium text-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 + i * 0.1 }}>
                          {emp.profile.full_name || 'Unnamed Employee'}
                        </motion.p>
                        <motion.p className="text-slate-500 text-xs mt-0.5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 + i * 0.1 }}>
                          {emp.profile.email}
                        </motion.p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right hidden md:block">
                        <p className="text-white text-sm"><CountUp target={emp.goalCount} /> / 8 goals</p>
                        <div className="mt-1 space-y-1">
                          <p className="text-slate-500 text-xs"><CountUp target={emp.totalWeightage} />% weightage</p>
                          <div className="h-1 w-24 bg-white/5 rounded-full overflow-hidden ml-auto">
                            <motion.div
                              className="h-full bg-violet-500 rounded-full shimmer"
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(emp.totalWeightage, 100)}%` }}
                              transition={{ delay: 1.5 + i * 0.1, duration: 1 }}
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div
                        className={cn(
                          'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium border min-w-[120px] justify-center transition-all duration-300 group-hover:scale-105',
                          emp.statusColor,
                          emp.statusLabel === 'Not Started' && 'animate-pulse shadow-[0_0_10px_rgba(148,163,184,0.2)]'
                        )}
                      >
                        <StatusIcon className="w-3.5 h-3.5" />
                        {emp.statusLabel}
                      </div>
                      
                      <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-violet-400 group-hover:translate-x-1 transition-all duration-300" style={{ filter: 'drop-shadow(0 0 5px rgba(124,58,237,0.5))' }} />
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}
