import { serverQuery } from '@/lib/supabase/server';
import { Task, TaskFilters } from '@/lib/types';

const TASK_FIELDS =
  'id,title,description,status,priority,assignee,due_date,estimated_value,completed_at,deleted_at,created_at,updated_at';

export async function getTasks(filters?: TaskFilters): Promise<{ data: Task[] | null; error: string | null }> {
  return serverQuery<Task[]>(async (client) => {
    let query = client.from('tasks').select(TASK_FIELDS).filter('deleted_at', 'is', null);

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
    return client.from('tasks').select(TASK_FIELDS).eq('id', id).single();
  });
}

export async function createTask(
  task: Omit<Task, 'id' | 'created_at' | 'updated_at'>
): Promise<{ data: Task | null; error: string | null }> {
  if (!task.title || !task.assignee || !task.due_date) {
    return { data: null, error: 'Missing required fields: title, assignee, due_date' };
  }

  return serverQuery<Task>(async (client) => {
    return client
      .from('tasks')
      .insert([{ ...task, estimated_value: task.estimated_value ?? 10, completed_at: task.completed_at ?? null }])
      .select(TASK_FIELDS)
      .single();
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
      .select(TASK_FIELDS)
      .single();
  });
}

export async function deleteTask(id: string): Promise<{ error: string | null }> {
  const { error } = await serverQuery(async (client) => {
    return client
      .from('tasks')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);
  });

  return { error };
}

export async function getTaskStats(): Promise<{
  data: { completed: number; in_progress: number; todo: number } | null;
  error: string | null;
}> {
  return serverQuery(async (client) => {
    const { data: tasks, error } = await client
      .from('tasks')
      .select('status')
      .filter('deleted_at', 'is', null);

    if (error) return { data: null, error };

    const stats = {
      completed: tasks.filter((t) => t.status === 'completed').length,
      in_progress: tasks.filter((t) => t.status === 'in_progress').length,
      todo: tasks.filter((t) => t.status === 'todo').length,
    };

    return { data: stats, error: null };
  });
}
