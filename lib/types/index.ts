// Core database types with strict typing
export type TaskStatus = 'pending' | 'active' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  title: string;
  description: string;
  assignee: string;
  priority: TaskPriority;
  status: TaskStatus;
  due_date: string;
  created_at: string;
  updated_at: string;
}

export interface Revenue {
  id: string;
  month: string;
  amount: number;
  created_at: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar_url?: string;
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

// KPI and metrics types
export interface KPIMetrics {
  totalRevenue: number;
  activeTasks: number;
  completionRate: number;
  totalActivities: number;
  tasksByStatus: {
    completed: number;
    active: number;
    pending: number;
  };
}

export interface DashboardData {
  kpi: KPIMetrics;
  monthlyRevenue: Revenue[];
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
