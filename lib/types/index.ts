// Core database types with strict typing
export type TaskStatus = 'todo' | 'in_progress' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  title: string;
  description: string;
  assignee: string;
  priority: TaskPriority;
  status: TaskStatus;
  due_date: string;
  estimated_value: number;
  completed_at: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar_url?: string;
  avatar_color?: string;
  phone?: string;
  joined_date: string;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  user_id?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  details: string;
  created_at: string;
}

// KPI and metrics types — all derived from tasks
export interface KPIMetrics {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  completionRate: number;
  productivityValue: number;
  weeklyGrowth: number;
}

export interface DashboardData {
  kpi: KPIMetrics;
  recentActivities: ActivityLog[];
}

export interface TaskFilters {
  status?: TaskStatus | 'all';
  priority?: TaskPriority;
  assignee?: string;
}

export type DatabaseError = {
  code: string;
  message: string;
};
