'use client';

import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { CountUp } from '@/components/effects/MotionWrappers';
import type { LucideIcon } from 'lucide-react';

type StatItem = {
  label: string;
  value: number | string;
  icon: LucideIcon;
  color: string;
  bg: string;
  sub: string;
};

export default function AnimatedStats({ stats }: { stats: StatItem[] }) {
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
