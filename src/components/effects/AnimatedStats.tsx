'use client';

import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { CountUp } from '@/components/effects/MotionWrappers';
import { Target, TrendingUp, Clock, CheckCircle2 } from 'lucide-react';

type AnimatedStatsProps = {
  totalGoals: number;
  totalWeightage: number;
  pendingCount: number;
  approvedCount: number;
};

// 3D Tilt card wrapper
function TiltCard({ children, index }: { children: React.ReactNode; index: number }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState({});

  const handleMouseMove = (e: React.MouseEvent) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -8;
    const rotateY = ((x - centerX) / centerX) * 8;
    setStyle({
      transform: `perspective(600px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`,
      boxShadow: '0 20px 40px rgba(124, 58, 237, 0.2), 0 0 0 1px rgba(124, 58, 237, 0.1)',
    });
  };

  const handleMouseLeave = () => {
    setStyle({
      transform: 'perspective(600px) rotateX(0deg) rotateY(0deg) translateY(0)',
      boxShadow: 'none',
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 24,
        delay: index * 0.1,
      }}
    >
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          ...style,
          transition: 'transform 0.15s ease-out, box-shadow 0.3s ease',
          willChange: 'transform',
        }}
        className="glass rounded-xl overflow-hidden relative"
      >
        {children}
      </div>
    </motion.div>
  );
}

export default function AnimatedStats({ totalGoals, totalWeightage, pendingCount, approvedCount }: AnimatedStatsProps) {
  const floatClasses = ['icon-float', 'icon-float-slow', 'icon-float-fast', 'icon-float-slower'];

  const stats = [
    {
      label: 'Total Goals',
      value: totalGoals,
      icon: Target,
      color: 'text-violet-400',
      glowColor: 'bg-violet-500',
      bg: 'bg-violet-500/10',
      sub: `${totalGoals} / 8`,
      suffix: '',
    },
    {
      label: 'Total Weightage',
      value: totalWeightage,
      icon: TrendingUp,
      color: totalWeightage === 100 ? 'text-emerald-400' : 'text-amber-400',
      glowColor: totalWeightage === 100 ? 'bg-emerald-500' : 'bg-amber-500',
      bg: totalWeightage === 100 ? 'bg-emerald-500/10' : 'bg-amber-500/10',
      sub: totalWeightage === 100 ? 'Ready to submit' : `${100 - totalWeightage}% remaining`,
      suffix: '%',
    },
    {
      label: 'Pending Approval',
      value: pendingCount,
      icon: Clock,
      color: 'text-amber-400',
      glowColor: 'bg-amber-500',
      bg: 'bg-amber-500/10',
      sub: pendingCount > 0 ? 'Awaiting manager' : 'None pending',
      suffix: '',
    },
    {
      label: 'Approved Goals',
      value: approvedCount,
      icon: CheckCircle2,
      color: 'text-emerald-400',
      glowColor: 'bg-emerald-500',
      bg: 'bg-emerald-500/10',
      sub: approvedCount > 0 ? `${approvedCount} locked in` : 'None yet',
      suffix: '',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <TiltCard key={stat.label} index={i}>
            <div className="p-5 relative">
              {/* Floating icon */}
              <div className={`w-9 h-9 rounded-lg ${stat.bg} flex items-center justify-center mb-1 ${floatClasses[i]}`}>
                <Icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              {/* Animated glow line under icon */}
              <div className="h-[2px] mb-3 rounded-full overflow-hidden bg-white/5">
                <motion.div
                  className={`h-full ${stat.glowColor} rounded-full`}
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: '100%', opacity: 1 }}
                  transition={{ delay: 0.5 + i * 0.15, duration: 0.6, ease: 'easeOut' }}
                  style={{ boxShadow: `0 0 8px ${stat.glowColor === 'bg-violet-500' ? 'rgba(124,58,237,0.5)' : stat.glowColor === 'bg-emerald-500' ? 'rgba(16,185,129,0.5)' : 'rgba(245,158,11,0.5)'}` }}
                />
              </div>
              {/* Count up number */}
              <p className={`text-2xl font-bold ${stat.color}`}>
                {stat.value > 0 ? (
                  <CountUp target={stat.value} duration={1.5} suffix={stat.suffix} />
                ) : (
                  '—'
                )}
              </p>
              <p className="text-white text-xs font-medium mt-0.5">{stat.label}</p>
              <p className="text-slate-600 text-[11px] mt-0.5">{stat.sub}</p>
            </div>
          </TiltCard>
        );
      })}
    </div>
  );
}
