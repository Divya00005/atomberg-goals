'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import type { Profile } from '@/types/supabase';
import {
  Target,
  TrendingUp,
  Users,
  ClipboardCheck,
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
    { href: '/dashboard/employee/checkins', icon: TrendingUp, label: 'My Check-ins' },
  ],
  manager: [
    { href: '/dashboard/manager', icon: Users, label: 'My Team' },
    { href: '/dashboard/manager/approvals', icon: ClipboardCheck, label: 'Approvals' },
    { href: '/dashboard/manager/checkins', icon: TrendingUp, label: 'Team Check-ins' },
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
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30 shrink-0">
            <Target className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-tight">GoalTracker</p>
            <p className="text-slate-500 text-xs">by Atomberg</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors lg:hidden">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-1">
        <p className="px-3 mb-3 text-xs font-medium text-slate-600 uppercase tracking-widest">
          {role === 'employee' ? 'My Space' : role === 'manager' ? 'Team' : 'Administration'}
        </p>
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group',
                active
                  ? 'bg-violet-500/15 text-violet-300'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              )}
            >
              <Icon
                className={cn(
                  'w-4 h-4 shrink-0 transition-colors',
                  active ? 'text-violet-400' : 'text-slate-500 group-hover:text-slate-300'
                )}
              />
              {label}
              {active && <ChevronRight className="w-3 h-3 ml-auto text-violet-400" />}
            </Link>
          );
        })}
      </nav>

      {/* User info + logout */}
      <div className="px-3 pt-4 border-t border-white/5">
        <div className="flex items-center gap-3 px-3 py-3 rounded-lg bg-white/3">
          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shrink-0">
            <span className="text-white text-xs font-semibold">
              {profile?.full_name?.charAt(0)?.toUpperCase() ?? '?'}
            </span>
          </div>
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
            className="h-7 w-7 text-slate-500 hover:text-red-400 hover:bg-red-500/10 shrink-0"
          >
            <LogOut className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
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
      <aside className="hidden lg:flex w-60 shrink-0 flex-col border-r border-white/5 bg-[#0D0D14]">
        <SidebarContent profile={profile} />
      </aside>

      {/* ── Mobile Sidebar Overlay ───────────────────── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside
        className={cn(
          'fixed top-0 left-0 h-full w-64 z-50 bg-[#0D0D14] border-r border-white/5 flex flex-col transition-transform duration-300 ease-in-out lg:hidden',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <SidebarContent profile={profile} onClose={() => setSidebarOpen(false)} />
      </aside>

      {/* ── Main Content ────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="sticky top-0 z-30 h-14 flex items-center justify-between px-4 lg:px-8 border-b border-white/5 bg-[#0A0A0F]/80 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-slate-400 hover:text-white transition-colors"
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
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
              <span className="text-white text-xs font-semibold">
                {profile?.full_name?.charAt(0)?.toUpperCase() ?? '?'}
              </span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
