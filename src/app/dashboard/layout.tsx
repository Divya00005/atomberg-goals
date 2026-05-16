'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import type { Profile } from '@/types/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target,
  TrendingUp,
  Users,
  BarChart3,
  Menu,
  X,
  LogOut,
  ChevronRight,
} from 'lucide-react';


// ── Nav config per role ─────────────────────────────────────
const NAV_ITEMS = {
  employee: [
    { href: '/dashboard/employee', icon: Target, label: 'My Goals' },
    { href: '/dashboard/employee/check-ins', icon: TrendingUp, label: 'My Check-ins' },
  ],
  manager: [
    { href: '/dashboard/manager', icon: Users, label: 'My Team' },
    { href: '/dashboard/manager/check-ins', icon: TrendingUp, label: 'Team Check-ins' },
  ],
  admin: [
    { href: '/dashboard/admin', icon: BarChart3, label: 'Dashboard Home' },
  ],
};

const ROLE_BADGES = {
  employee: 'bg-violet-500/10 text-violet-400 border-violet-500/20 shadow-[0_0_10px_rgba(124,58,237,0.2)]',
  manager: 'bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.3)] animate-pulse',
  admin: 'bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.2)]',
};

// ── Floating particles for global background ────────────────
function GlobalParticles() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {Array.from({ length: 25 }).map((_, i) => (
        <div
          key={i}
          className="particle"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${60 + Math.random() * 40}%`,
            animationDuration: `${10 + Math.random() * 15}s`,
            animationDelay: `${Math.random() * 8}s`,
            width: `${1 + Math.random() * 2}px`,
            height: `${1 + Math.random() * 2}px`,
          }}
        />
      ))}
    </div>
  );
}

function SidebarContent({
  profile,
  onClose,
}: {
  profile: Profile | null;
  onClose?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const role = profile?.role ?? 'employee';
  const navItems = NAV_ITEMS[role] ?? [];
  const badgeClass = ROLE_BADGES[role as keyof typeof ROLE_BADGES] || ROLE_BADGES.employee;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <div className="flex flex-col h-full py-6">
      {/* Logo */}
      <div className="px-5 mb-8 flex items-center justify-between">
        <motion.div
          className="flex items-center gap-3"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.1 }}
        >
          <motion.div
            className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20"
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          >
            <Target className="w-4 h-4 text-white" />
          </motion.div>
          <p className="text-white font-semibold text-xl tracking-tight">GoalTracker</p>
        </motion.div>
        {onClose && (
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors lg:hidden">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-1">
        <motion.p
          className="px-3 mb-3 text-xs font-medium text-slate-600 uppercase tracking-widest animated-underline"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {role === 'employee' ? 'My Space' : role === 'manager' ? 'Team' : 'Administration'}
        </motion.p>
        {navItems.map(({ href, icon: Icon, label }, i) => {
          const active = pathname === href;
          return (
            <motion.div
              key={href}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                type: 'spring',
                stiffness: 250,
                damping: 20,
                delay: 0.3 + i * 0.08,
              }}
            >
              <Link
                href={href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative',
                  active
                    ? 'bg-violet-500/15 text-violet-300'
                    : 'text-slate-400 hover:text-white hover:bg-white/5 hover:translate-x-1'
                )}
              >
                {/* Animated active indicator */}
                {active && (
                  <motion.div
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-gradient-to-b from-violet-400 to-indigo-500 rounded-full"
                    layoutId="active-nav-indicator"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon
                  className={cn(
                    'w-4 h-4 shrink-0 transition-all duration-200',
                    active ? 'text-violet-400' : 'text-slate-500 group-hover:text-slate-300 group-hover:rotate-12'
                  )}
                />
                {label}
                {active && <ChevronRight className="w-3 h-3 ml-auto text-violet-400" />}
              </Link>
            </motion.div>
          );
        })}
      </nav>

      {/* User info + logout */}
      <motion.div
        className="px-3 pt-4 border-t border-white/5"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <div className="p-4 border-t border-white/5 bg-black/20 backdrop-blur-md">
          <div className="flex items-center justify-between group/user">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="relative">
                {role === 'manager' ? (
                  <div className="absolute -inset-1 rounded-full border border-amber-500/40 border-dashed animate-[spin_8s_linear_infinite]" />
                ) : role === 'admin' ? (
                  <div className="absolute -inset-1 rounded-full border border-red-500/40 border-dashed animate-[spin_8s_linear_infinite]" />
                ) : (
                  <div className="absolute -inset-1 rounded-full border border-violet-500/40 border-dashed animate-[spin_8s_linear_infinite]" />
                )}
                <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center font-medium text-white shadow-inner relative z-10">
                  {profile?.full_name?.charAt(0)?.toUpperCase() ?? '?'}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-medium truncate">
                  {profile?.full_name || 'User'}
                </p>
                <span
                  className={cn(
                    'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border mt-0.5',
                    badgeClass
                  )}
                >
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </span>
              </div>
            </div>
            <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-300 hover:rotate-12 hover:shadow-[0_0_15px_rgba(239,68,68,0.3)]">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      setProfile(data);
    };
    fetchProfile();
  }, [supabase]);

  // Close mobile sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Derive page title from pathname
  const getPageTitle = () => {
    const segments = pathname.split('/').filter(Boolean);
    const last = segments[segments.length - 1];
    const titles: Record<string, string> = {
      employee: 'My Goals',
      manager: 'My Team',
      admin: 'Overview',
      approvals: 'Approvals',
      'check-ins': 'Check-ins',
      users: 'All Users',
      goals: 'All Goals',
      export: 'Reports & Export',
    };
    return titles[last] ?? 'Dashboard';
  };

  return (
    <div className="min-h-screen page-bg dot-grid flex">
      {/* Global floating particles */}
      <GlobalParticles />

      {/* ── Desktop Sidebar ──────────────────────────── */}
      <motion.aside
        className="hidden lg:flex w-60 shrink-0 flex-col border-r border-white/5 bg-[#0D0D14]/90 backdrop-blur-xl relative z-10"
        initial={{ x: -60, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 25 }}
      >
        <SidebarContent profile={profile} />
      </motion.aside>

      {/* ── Mobile Sidebar Overlay ───────────────────── */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            className="fixed top-0 left-0 h-full w-64 z-50 bg-[#0D0D14] border-r border-white/5 flex flex-col lg:hidden"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <SidebarContent profile={profile} onClose={() => setSidebarOpen(false)} />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ── Main Content ────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        {/* Topbar - glassmorphism + gradient border */}
        <motion.header
          className="sticky top-0 z-30 h-14 flex items-center justify-between px-4 lg:px-8 bg-[#07070d]/70 backdrop-blur-xl border-b header-gradient-border"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 300, damping: 25 }}
        >
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-slate-400 hover:text-white transition-colors btn-bounce"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-white font-semibold text-base">{getPageTitle()}</h1>
          </div>
          <div className="flex items-center gap-3">
            <motion.span
              className="text-slate-500 text-sm hidden sm:block truncate max-w-[200px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              {profile?.email}
            </motion.span>
            <motion.div
              className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center avatar-glow"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <span className="text-white text-xs font-semibold">
                {profile?.full_name?.charAt(0)?.toUpperCase() ?? '?'}
              </span>
            </motion.div>
          </div>
        </motion.header>

        {/* Page content with fade-in transition */}
        <motion.main
          key={pathname}
          className="flex-1 p-4 lg:p-8"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
}
