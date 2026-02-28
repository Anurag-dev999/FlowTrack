import { serverQuery } from '@/lib/supabase/server';
import { Task, TaskFilters } from '@/lib/types';

export async function getTasks(filters?: TaskFilters): Promise<{ data: Task[] | null; error: string | null }> {
  return serverQuery<Task[]>(async (client) => {
    let query = client.from('tasks').select('*');

    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }

    if (filters?.priority) {
      query = query.eq('priority', filters.priority);
    }

    if (filters?.assignee) {
      query = query.eq('assignee', filters.assignee);
    }

    return query.order('created_at', { ascending: false });
  });
}

export async function getTaskById(id: string): Promise<{ data: Task | null; error: string | null }> {
  return serverQuery<Task>(async (client) => {
    return client.from('tasks').select('*').eq('id', id).single();
  });
}

export async function createTask(
  task: Omit<Task, 'id' | 'created_at' | 'updated_at'>
): Promise<{ data: Task | null; error: string | null }> {
  // Validate required fields
  if (!task.title || !task.assignee || !task.due_date) {
    return { data: null, error: 'Missing required fields: title, assignee, due_date' };
  }

  return serverQuery<Task>(async (client) => {
    return client.from('tasks').insert([task]).select().single();
  });
}

export async function updateTask(
  id: string,
  updates: Partial<Omit<Task, 'id' | 'created_at' | 'updated_at'>>
): Promise<{ data: Task | null; error: string | null }> {
  return serverQuery<Task>(async (client) => {
    return client
      .from('tasks')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
  });
}

export async function deleteTask(id: string): Promise<{ error: string | null }> {
  const { error } = await serverQuery(async (client) => {
    return client.from('tasks').delete().eq('id', id);
  });

  return { error };
}

export async function getTaskStats(): Promise<{
  data: { completed: number; active: number; pending: number } | null;
  error: string | null;
}> {
  return serverQuery(async (client) => {
    const { data: tasks, error } = await client.from('tasks').select('status');

    if (error) return { data: null, error };

    const stats = {
      completed: tasks.filter((t) => t.status === 'completed').length,
      active: tasks.filter((t) => t.status === 'active').length,
      pending: tasks.filter((t) => t.status === 'pending').length,
    };

    return { data: stats, error: null };
  });
}
