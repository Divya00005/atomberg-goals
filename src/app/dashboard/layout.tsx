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
  FileDown,
  Menu,
  X,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

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
    { href: '/dashboard/admin', icon: BarChart3, label: 'Overview' },
    { href: '/dashboard/admin/users', icon: Users, label: 'All Users' },
    { href: '/dashboard/admin/goals', icon: Target, label: 'All Goals' },
    { href: '/dashboard/admin/export', icon: FileDown, label: 'Reports & Export' },
  ],
};

const ROLE_BADGE: Record<string, { label: string; color: string }> = {
  employee: { label: 'Employee', color: 'bg-sky-500/15 text-sky-400 border-sky-500/20' },
  manager: { label: 'Manager', color: 'bg-violet-500/15 text-violet-400 border-violet-500/20' },
  admin: { label: 'Admin', color: 'bg-amber-500/15 text-amber-400 border-amber-500/20' },
};

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
  const badge = ROLE_BADGE[role];

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
            whileHover={{ rotate: 360, scale: 1.1 }}
            transition={{ duration: 0.5 }}
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
          className="px-3 mb-3 text-xs font-medium text-slate-600 uppercase tracking-widest"
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
                    'w-4 h-4 shrink-0 transition-colors',
                    active ? 'text-violet-400' : 'text-slate-500 group-hover:text-slate-300'
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
        <div className="flex items-center gap-3 px-3 py-3 rounded-lg glass">
          {/* Avatar */}
          <motion.div
            className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-lg shadow-violet-500/20"
            whileHover={{ scale: 1.15 }}
          >
            <span className="text-white text-xs font-semibold">
              {profile?.full_name?.charAt(0)?.toUpperCase() ?? '?'}
            </span>
          </motion.div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-medium truncate">
              {profile?.full_name || 'User'}
            </p>
            <span
              className={cn(
                'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border mt-0.5',
                badge?.color
              )}
            >
              {badge?.label}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            title="Sign out"
            className="h-7 w-7 text-slate-500 hover:text-red-400 hover:bg-red-500/10 shrink-0 btn-bounce"
          >
            <LogOut className="w-3.5 h-3.5" />
          </Button>
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
      checkins: 'Check-ins',
      users: 'All Users',
      goals: 'All Goals',
      export: 'Reports & Export',
    };
    return titles[last] ?? 'Dashboard';
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex">
      {/* ── Desktop Sidebar ──────────────────────────── */}
      <motion.aside
        className="hidden lg:flex w-60 shrink-0 flex-col border-r border-white/5 bg-[#0D0D14]"
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
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <motion.header
          className="sticky top-0 z-30 h-14 flex items-center justify-between px-4 lg:px-8 border-b border-white/5 bg-[#0A0A0F]/80 backdrop-blur-md"
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
            <span className="text-slate-500 text-sm hidden sm:block truncate max-w-[200px]">
              {profile?.email}
            </span>
            <motion.div
              className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <span className="text-white text-xs font-semibold">
                {profile?.full_name?.charAt(0)?.toUpperCase() ?? '?'}
              </span>
            </motion.div>
          </div>
        </motion.header>

        {/* Page content with fade-in */}
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
