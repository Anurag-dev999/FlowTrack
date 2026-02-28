import { serverQuery } from '@/lib/supabase/server';
import { ActivityLog } from '@/lib/types';

export async function getRecentActivities(limit: number = 10): Promise<{
  data: ActivityLog[] | null;
  error: string | null;
}> {
  return serverQuery<ActivityLog[]>(async (client) => {
    return client
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
  });
}

export async function getActivitiesByResource(resourceType: string): Promise<{
  data: ActivityLog[] | null;
  error: string | null;
}> {
  return serverQuery<ActivityLog[]>(async (client) => {
    return client
      .from('activity_logs')
      .select('*')
      .eq('entity_type', resourceType)
      .order('created_at', { ascending: false });
  });
}

export async function logActivity(
  action: string,
  resourceType: string,
  details: string,
  resourceId?: string
): Promise<{ data: ActivityLog | null; error: string | null }> {
  // Validate inputs
  if (!action || !resourceType || !details) {
    return { data: null, error: 'Missing required fields: action, resourceType, details' };
  }

  return serverQuery<ActivityLog>(async (client) => {
    return client.from('activity_logs').insert([{ action, entity_type: resourceType, details, entity_id: resourceId }]).select().single();
  });
}

export async function getTotalActivityCount(): Promise<{ data: number | null; error: string | null }> {
  return serverQuery<number>(async (client) => {
    const { count, error } = await client.from('activity_logs').select('*', { count: 'exact', head: true });

    if (error) return { data: null, error };

    return { data: count || 0, error: null };
  });
}
