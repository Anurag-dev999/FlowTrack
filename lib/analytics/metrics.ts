import { getSupabaseServerClient } from '@/lib/supabase/server';
import { KPIMetrics, Task } from '@/lib/types';
import { computeDashboardMetrics } from '@/lib/analytics';

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
 * Fetch all tasks and compute KPI metrics using the analytics engine.
 * All metrics are derived from task data — no separate revenue table needed.
 */
export async function generateKPIMetrics(): Promise<KPIMetrics> {
  const client = getSupabaseServerClient();

  try {
    const { data, error } = await client
      .from('tasks')
      .select('id,title,description,status,priority,assignee,due_date,estimated_value,completed_at,created_at,updated_at');

    if (error) {
      if (error.message && error.message.trim() !== '' && !isConnectionError(error.message)) {
        // suppress noisy connection errors
      }
      return emptyMetrics();
    }

    const tasks: Task[] = (data || []).map((t: any) => ({
      ...t,
      estimated_value: t.estimated_value ?? 10,
    }));

    return computeDashboardMetrics(tasks);
  } catch (err: any) {
    if (!isConnectionError(err?.message || String(err))) {
      // suppress noisy connection errors
    }
    return emptyMetrics();
  }
}

function emptyMetrics(): KPIMetrics {
  return {
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    completionRate: 0,
    productivityValue: 0,
    weeklyGrowth: 0,
  };
}
