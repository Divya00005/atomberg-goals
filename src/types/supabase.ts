// Supabase generated types — to be replaced with auto-generated output from Supabase CLI
// Run: npx supabase gen types typescript --project-id <your-project-id> > src/types/supabase.ts

export type Role = 'employee' | 'manager' | 'admin';
export type GoalStatus = 'draft' | 'pending_approval' | 'approved' | 'rejected';
export type Quarter = 'Q1' | 'Q2' | 'Q3' | 'Q4';
export type CheckinStatus = 'not_started' | 'on_track' | 'completed';
export type UomType = 'numeric_min' | 'numeric_max' | 'timeline' | 'zero';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  manager_id: string | null;
  created_at: string;
}

export interface Goal {
  id: string;
  employee_id: string;
  thrust_area: string;
  title: string;
  description: string;
  uom_type: UomType;
  target_value: number | null;
  deadline: string | null;
  weightage: number;
  status: GoalStatus;
  locked: boolean;
  is_shared: boolean;
  shared_from_goal_id: string | null;
  rejection_reason: string | null;
  year: number;
  created_at: string;
  updated_at: string;
}



export interface CheckIn {
  id: string;
  goal_id: string;
  quarter: Quarter;
  quarter_year: number;
  actual_value: number | null;
  progress_score: number;
  status: CheckinStatus;
  employee_comments: string;
  manager_comments: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  goal_id: string;
  changed_by: string | null;
  change_description: string;
  changed_at: string;
}
