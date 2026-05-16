'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Target, TrendingUp, Users, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import { TypeWriter, StaggerContainer, StaggerItem, FadeIn } from '@/components/effects/MotionWrappers';

// Lazy load Three.js orb to avoid SSR issues
const ThreeOrb = dynamic(() => import('@/components/effects/ThreeOrb'), {
  ssr: false,
  loading: () => <div className="absolute inset-0" />,
});

const features = [
  {
    icon: Target,
    title: 'Smart Goal Setting',
    desc: 'Define up to 8 goals with weighted priorities that sum to 100%.',
  },
  {
    icon: TrendingUp,
    title: 'Quarterly Check-ins',
    desc: 'Track progress every quarter with structured scoring and comments.',
  },
  {
    icon: Users,
    title: 'Manager Approval Flow',
    desc: 'Goals are reviewed and locked by your manager before execution begins.',
  },
  {
    icon: CheckCircle,
    title: 'Achievement Reports',
    desc: 'Export full achievement summaries as CSV for performance reviews.',
  },
];

// Floating particle component
function Particles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className="particle"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${60 + Math.random() * 40}%`,
            animationDuration: `${8 + Math.random() * 12}s`,
            animationDelay: `${Math.random() * 5}s`,
            width: `${1 + Math.random() * 2}px`,
            height: `${1 + Math.random() * 2}px`,
          }}
        />
      ))}
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      const role = profile?.role ?? 'employee';
      router.push(`/dashboard/${role}`);
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen flex bg-[#0A0A0F]">
      {/* ── Left Panel ──────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden">
        {/* Animated gradient mesh background */}
        <div className="absolute inset-0 gradient-mesh-bg" />
        {/* Static overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-950/80 via-indigo-950/60 to-transparent" />
        {/* Glowing orbs */}
        <motion.div
          className="absolute top-1/4 -left-20 w-80 h-80 bg-violet-600/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.35, 0.2],
          }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-1/4 right-0 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.15, 0.3, 0.15],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        />

        {/* 3D Three.js Orb */}
        <ThreeOrb />

        {/* Floating particles */}
        <Particles />

        {/* Aurora wave at bottom */}
        <div className="aurora-wave" />

        {/* Logo */}
        <FadeIn direction="down" delay={0.1}>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <motion.div
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30"
                whileHover={{ rotate: 360, scale: 1.1 }}
                transition={{ duration: 0.6 }}
              >
                <Target className="w-5 h-5 text-white" />
              </motion.div>
              <span className="text-white font-semibold text-3xl tracking-tight">GoalTracker</span>
            </div>
          </div>
        </FadeIn>

        {/* Main heading + features */}
        <div className="relative z-10">
          <FadeIn direction="up" delay={0.3}>
            <h1 className="text-5xl font-bold text-white leading-tight mb-4">
              Achieve more,<br />
              <span className="gradient-text">
                together.
              </span>
            </h1>
          </FadeIn>

          <FadeIn direction="up" delay={0.5}>
            <p className="text-slate-400 text-base leading-relaxed mb-10 max-w-md">
              A structured performance management portal built for teams that care about growth, accountability, and clarity.
            </p>
          </FadeIn>

          <StaggerContainer delay={0.7} staggerDelay={0.12} className="space-y-4">
            {features.map(({ icon: Icon, title, desc }) => (
              <StaggerItem key={title}>
                <motion.div
                  className="flex items-start gap-4 icon-spin-hover group cursor-default"
                  whileHover={{ x: 8 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                >
                  <div className="w-10 h-10 rounded-xl glass-strong flex items-center justify-center shrink-0 mt-0.5 group-hover:border-violet-500/40 group-hover:shadow-lg group-hover:shadow-violet-500/10 transition-all duration-300">
                    <Icon className="w-4 h-4 text-violet-400 icon-target" />
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">{title}</p>
                    <p className="text-slate-500 text-sm mt-0.5">{desc}</p>
                  </div>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>

        {/* Copyright */}
        <FadeIn direction="up" delay={1.5}>
          <div className="relative z-10">
            <p className="text-slate-600 text-xs">
              © {new Date().getFullYear()} GoalTracker. All rights reserved.
            </p>
          </div>
        </FadeIn>
      </div>

      {/* ── Right Panel ─────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative overflow-hidden">
        {/* Animated grid pattern */}
        <div className="absolute inset-0 grid-pattern" />
        {/* Subtle radial glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-500/5 rounded-full blur-3xl pointer-events-none" />

        <motion.div
          className="w-full max-w-md relative z-10"
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{
            type: 'spring',
            stiffness: 150,
            damping: 20,
            delay: 0.2,
          }}
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
              <Target className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-semibold text-2xl">GoalTracker</span>
          </div>

          {/* Form card with glassmorphism */}
          <div className="glass-strong rounded-2xl p-8 glow-violet">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">
                <TypeWriter text="Welcome back" speed={60} delay={500} />
              </h2>
              <motion.p
                className="text-slate-400 text-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
              >
                Sign in to continue to your dashboard.
              </motion.p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <motion.div
                className="space-y-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, type: 'spring', stiffness: 200, damping: 20 }}
              >
                <Label htmlFor="email" className="text-slate-300 text-sm font-medium">
                  Work Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 h-11 transition-all duration-300 focus:border-violet-500/50 focus:shadow-[0_0_20px_rgba(124,58,237,0.15)] focus-visible:ring-violet-500 focus-visible:border-violet-500"
                />
              </motion.div>

              <motion.div
                className="space-y-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55, type: 'spring', stiffness: 200, damping: 20 }}
              >
                <Label htmlFor="password" className="text-slate-300 text-sm font-medium">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 h-11 transition-all duration-300 focus:border-violet-500/50 focus:shadow-[0_0_20px_rgba(124,58,237,0.15)] focus-visible:ring-violet-500 focus-visible:border-violet-500"
                />
              </motion.div>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    className="flex items-center gap-2.5 p-3 rounded-lg bg-red-500/10 border border-red-500/20"
                  >
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <p className="text-red-400 text-sm">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, type: 'spring', stiffness: 200, damping: 20 }}
              >
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-medium shadow-lg shadow-violet-500/25 transition-all duration-200 border-0 shimmer btn-bounce"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Signing in…
                    </>
                  ) : (
                    'Sign in'
                  )}
                </Button>
              </motion.div>
              
              {/* Hackathon Judge Demo Login Buttons */}
              <motion.div 
                className="pt-4 border-t border-white/10 mt-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.0 }}
              >
                <p className="text-center text-[10px] text-slate-500 uppercase tracking-widest font-medium mb-3">
                  Hackathon Judge Fast-Login
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => { setEmail('employee@example.com'); setPassword('password123'); }} 
                    className="h-8 text-[11px] bg-sky-500/10 border-sky-500/20 hover:bg-sky-500/20 text-sky-400 btn-bounce"
                  >
                    Employee
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => { setEmail('manager@example.com'); setPassword('password123'); }} 
                    className="h-8 text-[11px] bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/20 text-amber-400 btn-bounce"
                  >
                    Manager
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => { setEmail('admin@example.com'); setPassword('password123'); }} 
                    className="h-8 text-[11px] bg-red-500/10 border-red-500/20 hover:bg-red-500/20 text-red-400 btn-bounce"
                  >
                    Admin
                  </Button>
                </div>
              </motion.div>
            </form>
          </div>

          <motion.p
            className="text-center text-slate-600 text-xs mt-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
          >
            Don&apos;t have an account? Contact your administrator.
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}
