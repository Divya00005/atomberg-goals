'use client';

import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { CountUp } from '@/components/effects/MotionWrappers';
import { Target, TrendingUp, Clock, CheckCircle2 } from 'lucide-react';

type AnimatedStatsProps = {
  totalGoals: number;
  totalWeightage: number;
  pendingCount: number;
  approvedCount: number;
};

export default function AnimatedStats({ totalGoals, totalWeightage, pendingCount, approvedCount }: AnimatedStatsProps) {
  const stats = [
    {
      label: 'Total Goals',
      value: totalGoals || '—',
      icon: Target,
      color: 'text-violet-400',
      bg: 'bg-violet-500/10',
      sub: `${totalGoals} / 8`,
    },
    {
      label: 'Total Weightage',
      value: totalWeightage > 0 ? totalWeightage : '—',
      icon: TrendingUp,
      color: totalWeightage === 100 ? 'text-emerald-400' : 'text-amber-400',
      bg: totalWeightage === 100 ? 'bg-emerald-500/10' : 'bg-amber-500/10',
      sub: totalWeightage === 100 ? 'Ready to submit' : `${100 - totalWeightage}% remaining`,
    },
    {
      label: 'Pending Approval',
      value: pendingCount || '—',
      icon: Clock,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      sub: pendingCount > 0 ? 'Awaiting manager' : 'None pending',
    },
    {
      label: 'Approved Goals',
      value: approvedCount || '—',
      icon: CheckCircle2,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      sub: approvedCount > 0 ? `${approvedCount} locked in` : 'None yet',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map(({ label, value, icon: Icon, color, bg, sub }, i) => (
        <motion.div
          key={label}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 24,
            delay: i * 0.1,
          }}
        >
          <Card className="bg-white/3 border-white/5 card-hover glow-violet-hover overflow-hidden relative">
            <CardContent className="p-5">
              <motion.div
                className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center mb-4`}
                whileHover={{ rotate: 15, scale: 1.1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 15 }}
              >
                <Icon className={`w-4 h-4 ${color}`} />
              </motion.div>
              <p className={`text-2xl font-bold ${color}`}>
                {typeof value === 'number' && value > 0 ? (
                  <CountUp
                    target={value}
                    duration={1.5}
                    suffix={label.includes('Weightage') ? '%' : ''}
                  />
                ) : (
                  value
                )}
              </p>
              <p className="text-white text-xs font-medium mt-0.5">{label}</p>
              <p className="text-slate-600 text-[11px] mt-0.5">{sub}</p>
            </CardContent>
            {/* Subtle gradient border glow on hover */}
            <div className="absolute inset-0 rounded-xl opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none border border-violet-500/20" />
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
