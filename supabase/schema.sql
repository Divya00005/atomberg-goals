-- ============================================================
-- Goal Setting & Tracking Portal — Supabase Schema
-- Run this entire script in: Supabase Dashboard → SQL Editor
-- ============================================================

-- ─────────────────────────────────────────────
-- 0. CLEANUP (Drop existing objects to allow re-running)
-- ─────────────────────────────────────────────
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS goals_updated_at ON public.goals;
DROP TRIGGER IF EXISTS check_ins_updated_at ON public.check_ins;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.handle_updated_at();

DROP TABLE IF EXISTS public.check_ins;
DROP TABLE IF EXISTS public.goals;
DROP TABLE IF EXISTS public.profiles;

DROP TYPE IF EXISTS public.user_role;
DROP TYPE IF EXISTS public.goal_status;
DROP TYPE IF EXISTS public.checkin_quarter;
DROP TYPE IF EXISTS public.checkin_status;
DROP TYPE IF EXISTS public.uom_type;

-- ─────────────────────────────────────────────
-- 1. ENUMS
-- ─────────────────────────────────────────────
CREATE TYPE public.user_role AS ENUM ('employee', 'manager', 'admin');
CREATE TYPE public.goal_status AS ENUM ('draft', 'pending_approval', 'approved', 'rejected');
CREATE TYPE public.checkin_quarter AS ENUM ('Q1', 'Q2', 'Q3', 'Q4');
CREATE TYPE public.checkin_status AS ENUM ('not_started', 'on_track', 'completed');
CREATE TYPE public.uom_type AS ENUM ('numeric_min', 'numeric_max', 'timeline', 'zero');

-- ─────────────────────────────────────────────
-- 2. PROFILES TABLE
-- Extends auth.users with app-specific data.
-- ─────────────────────────────────────────────
CREATE TABLE public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  full_name   TEXT NOT NULL DEFAULT '',
  role        public.user_role NOT NULL DEFAULT 'employee',
  manager_id  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 3. GOALS TABLE
-- ─────────────────────────────────────────────
CREATE TABLE public.goals (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  thrust_area  TEXT NOT NULL DEFAULT '',
  title        TEXT NOT NULL,
  description  TEXT NOT NULL DEFAULT '',
  uom_type     public.uom_type NOT NULL DEFAULT 'numeric_max',
  target_value NUMERIC,
  deadline     DATE,
  weightage    INTEGER NOT NULL CHECK (weightage >= 10 AND weightage <= 100),
  status       public.goal_status NOT NULL DEFAULT 'draft',
  locked       BOOLEAN DEFAULT false,
  is_shared    BOOLEAN DEFAULT false,
  shared_from_goal_id UUID REFERENCES public.goals(id),
  rejection_reason TEXT,
  year         INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM NOW())::INTEGER,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ─────────────────────────────────────────────
-- 4. CHECK-INS TABLE
-- ─────────────────────────────────────────────
CREATE TABLE public.check_ins (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id             UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  quarter             public.checkin_quarter NOT NULL,
  quarter_year        INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM NOW())::INTEGER,
  actual_value        NUMERIC,
  progress_score      NUMERIC(5,2) NOT NULL CHECK (progress_score >= 0 AND progress_score <= 100),
  status              public.checkin_status DEFAULT 'not_started',
  employee_comments   TEXT NOT NULL DEFAULT '',
  manager_comments    TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(goal_id, quarter, quarter_year)
);

-- ─────────────────────────────────────────────
-- 4.5. AUDIT LOGS TABLE
-- ─────────────────────────────────────────────
CREATE TABLE public.audit_logs (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id            UUID REFERENCES public.goals(id) ON DELETE CASCADE,
  changed_by         UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  change_description TEXT NOT NULL,
  changed_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 5. AUTO-UPDATE TRIGGER FOR updated_at
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER goals_updated_at
  BEFORE UPDATE ON public.goals
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER check_ins_updated_at
  BEFORE UPDATE ON public.check_ins
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ─────────────────────────────────────────────
-- 6. AUTO-CREATE PROFILE ON SIGNUP TRIGGER
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'employee')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─────────────────────────────────────────────
-- 7. ROW LEVEL SECURITY (RLS)
-- ─────────────────────────────────────────────

-- Enable RLS on all tables
ALTER TABLE public.profiles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ── PROFILES policies ──────────────────────────────────────

-- Users can view their own profile
CREATE POLICY "profiles: own read"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Helper function to bypass RLS for admin checks
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin');
$$ LANGUAGE sql SECURITY DEFINER;

-- Managers can view profiles of their direct reports
CREATE POLICY "profiles: manager reads team"
  ON public.profiles FOR SELECT
  USING (
    manager_id = auth.uid()
    OR public.is_admin()
  );

-- Users can update their own profile
CREATE POLICY "profiles: own update"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "profiles: admin full read"
  ON public.profiles FOR SELECT
  USING (public.is_admin());

-- ── GOALS policies ─────────────────────────────────────────

-- Employees can do everything with their own goals
CREATE POLICY "goals: employee full access"
  ON public.goals FOR ALL
  USING (employee_id = auth.uid());

-- Managers can view and update status for their reports' goals
CREATE POLICY "goals: manager access"
  ON public.goals FOR ALL
  USING (
    employee_id IN (
      SELECT id FROM public.profiles WHERE manager_id = auth.uid()
    )
  );

-- Admins can view all goals
CREATE POLICY "goals: admin read all"
  ON public.goals FOR SELECT
  USING (public.is_admin());

-- ── CHECK-INS policies ─────────────────────────────────────

-- Employees can manage check-ins for their own goals
CREATE POLICY "check_ins: employee full access"
  ON public.check_ins FOR ALL
  USING (
    goal_id IN (
      SELECT id FROM public.goals WHERE employee_id = auth.uid()
    )
  );

-- Managers can view and update manager_comments for their reports
CREATE POLICY "check_ins: manager access"
  ON public.check_ins FOR ALL
  USING (
    goal_id IN (
      SELECT g.id FROM public.goals g
      JOIN public.profiles p ON g.employee_id = p.id
      WHERE p.manager_id = auth.uid()
    )
  );

-- Admins can view all check-ins
CREATE POLICY "check_ins: admin read all"
  ON public.check_ins FOR SELECT
  USING (public.is_admin());

-- ─────────────────────────────────────────────
-- 8. USEFUL INDEXES
-- ─────────────────────────────────────────────
CREATE INDEX idx_goals_employee_id ON public.goals(employee_id);
CREATE INDEX idx_goals_status      ON public.goals(status);
CREATE INDEX idx_check_ins_goal_id ON public.check_ins(goal_id);
CREATE INDEX idx_profiles_manager  ON public.profiles(manager_id);
