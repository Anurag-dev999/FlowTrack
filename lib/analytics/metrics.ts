import { getSupabaseServerClient } from '@/lib/supabase/server';
import { KPIMetrics } from '@/lib/types';

// Helper to detect connection/SSL errors (HTML responses, timeouts, etc.)
function isConnectionError(msg: string): boolean {
  return (
    msg.includes('fetch failed') ||
    msg.includes('SSL handshake') ||
    msg.includes('<!DOCTYPE') ||
    msg.includes('ECONNREFUSED') ||
    msg.includes('ETIMEDOUT') ||
    msg.includes('ERR_CONNECTION') ||
    msg.includes('Failed to fetch')
  );
}

/**
 * Calculate total revenue across all months
 */
export async function calculateTotalRevenue(): Promise<number> {
  const client = getSupabaseServerClient();

  try {
    const { data, error } = await client.from('revenue').select('amount');

    if (error) {
      if (error.message && error.message.trim() !== '' && !isConnectionError(error.message)) {
        console.error('Error calculating total revenue:', error.message.slice(0, 100));
      }
      return 0;
    }

    return data.reduce((sum, record) => sum + (record.amount || 0), 0);
  } catch (err: any) {
    if (isConnectionError(err?.message || String(err))) return 0;
    console.error('Unexpected error in calculateTotalRevenue:', (err?.message || '').slice(0, 100));
    return 0;
  }
}

/**
 * Calculate active tasks count
 */
export async function calculateActiveTasks(): Promise<number> {
  const client = getSupabaseServerClient();

  try {
    const { data, error } = await client
      .from('tasks')
      .select('id, status')
      .neq('status', 'completed');

    if (error) {
      if (error.message && error.message.trim() !== '' && !isConnectionError(error.message)) {
        console.error('Error calculating active tasks:', error.message.slice(0, 100));
      }
      return 0;
    }

    return data.length;
  } catch (err: any) {
    if (isConnectionError(err?.message || String(err))) return 0;
    console.error('Unexpected error in calculateActiveTasks:', (err?.message || '').slice(0, 100));
    return 0;
  }
}

/**
 * Calculate task completion rate as percentage
 */
export async function calculateCompletionRate(): Promise<number> {
  const client = getSupabaseServerClient();

  try {
    const { data, error } = await client.from('tasks').select('id, status');

    if (error) {
      if (error.message && error.message.trim() !== '' && !isConnectionError(error.message)) {
        console.error('Error calculating completion rate:', error.message.slice(0, 100));
      }
      return 0;
    }

    if (data.length === 0) return 0;

    const completedCount = data.filter((t) => t.status === 'completed').length;
    return Math.round((completedCount / data.length) * 100);
  } catch (err: any) {
    if (isConnectionError(err?.message || String(err))) return 0;
    console.error('Unexpected error in calculateCompletionRate:', (err?.message || '').slice(0, 100));
    return 0;
  }
}

/**
 * Get task status distribution
 */
export async function getTaskStatusDistribution(): Promise<{
  completed: number;
  active: number;
  pending: number;
}> {
  const client = getSupabaseServerClient();

  try {
    const { data, error } = await client.from('tasks').select('status');

    if (error) {
      if (error.message && error.message.trim() !== '' && !isConnectionError(error.message)) {
        console.error('Error getting task status distribution:', error.message.slice(0, 100));
      }
      return { completed: 0, active: 0, pending: 0 };
    }

    return {
      completed: data.filter((t) => t.status === 'completed').length,
      active: data.filter((t) => t.status === 'active').length,
      pending: data.filter((t) => t.status === 'pending').length,
    };
  } catch (err: any) {
    if (isConnectionError(err?.message || String(err))) return { completed: 0, active: 0, pending: 0 };
    console.error('Unexpected error in getTaskStatusDistribution:', (err?.message || '').slice(0, 100));
    return { completed: 0, active: 0, pending: 0 };
  }
}

/**
 * Calculate total activity count
 */
export async function calculateTotalActivities(): Promise<number> {
  const client = getSupabaseServerClient();

  try {
    const { count, error } = await client
      .from('activity_logs')
      .select('*', { count: 'exact', head: true });

    if (error) {
      if (error.message && error.message.trim() !== '' && !isConnectionError(error.message)) {
        console.error('Error calculating total activities:', error.message.slice(0, 100));
      }
      return 0;
    }

    return count || 0;
  } catch (err: any) {
    if (isConnectionError(err?.message || String(err))) return 0;
    console.error('Unexpected error in calculateTotalActivities:', (err?.message || '').slice(0, 100));
    return 0;
  }
}

/**
 * Calculate team productivity (average tasks per team member)
 */
export async function calculateTeamProductivity(): Promise<number> {
  const client = getSupabaseServerClient();

  try {
    const [tasksRes, teamRes] = await Promise.all([
      client.from('tasks').select('id'),
      client.from('team_members').select('id'),
    ]);

    if (tasksRes.error || teamRes.error) {
      const errMsg = tasksRes.error?.message || teamRes.error?.message || '';
      if (!isConnectionError(errMsg)) {
        console.error('Error calculating team productivity');
      }
      return 0;
    }

    const taskCount = tasksRes.data.length;
    const teamCount = teamRes.data.length;

    return teamCount > 0 ? Math.round(taskCount / teamCount) : 0;
  } catch (err: any) {
    if (isConnectionError(err?.message || String(err))) return 0;
    console.error('Unexpected error in calculateTeamProductivity:', (err?.message || '').slice(0, 100));
    return 0;
  }
}

/**
 * Generate complete KPI metrics
 */
export async function generateKPIMetrics(): Promise<KPIMetrics> {
  const [totalRevenue, activeTasks, completionRate, totalActivities, tasksByStatus] = await Promise.all([
    calculateTotalRevenue(),
    calculateActiveTasks(),
    calculateCompletionRate(),
    calculateTotalActivities(),
    getTaskStatusDistribution(),
  ]);

  return {
    totalRevenue,
    activeTasks,
    completionRate,
    totalActivities,
    tasksByStatus,
  };
}
