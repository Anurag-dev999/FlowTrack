import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

function isConnectionError(msg: string): boolean {
  return (
    msg.includes('fetch failed') ||
    msg.includes('SSL handshake') ||
    msg.includes('<!DOCTYPE') ||
    msg.includes('ECONNREFUSED') ||
    msg.includes('ETIMEDOUT') ||
    msg.includes('Failed to fetch')
  );
}

function getClient(request: Request) {
  const authHeader = request.headers.get('Authorization');
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: authHeader || '' } } }
  );
}

export async function GET(request: Request) {
  const supabase = getClient(request);
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      if (isConnectionError(error.message || '')) {
        return NextResponse.json([]);
      }
      throw error;
    }

    return NextResponse.json(data);
  } catch (error: any) {
    const msg = error?.message || String(error);
    if (isConnectionError(msg)) {
      return NextResponse.json([]);
    }
    console.error('Tasks API error:', msg.slice(0, 200));
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const authHeader = request.headers.get('Authorization') || '';
  const token = authHeader.replace('Bearer ', '');
  const supabase = getClient(request);
  let body: any = {};

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      if (!isConnectionError(authError?.message || '')) {
        console.warn('Auth error or no user:', authError?.message);
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    body = await request.json();
    const { title, description, priority, status, due_date } = body;

    if (!title || !due_date) {
      return NextResponse.json({ error: 'Title and due date are required' }, { status: 400 });
    }

    const payload: any = { title, description, priority: priority || 'medium', status: status || 'pending', due_date };
    if (user) {
      payload.user_id = user.id;
    }

    const { data, error } = await supabase
      .from('tasks')
      .insert([payload])
      .select();

    if (error) {
      if (isConnectionError(error.message || '')) {
        // Return optimistic task so UI still works when offline
        return NextResponse.json([{
          ...body,
          id: `offline-${Date.now()}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }]);
      }
      throw error;
    }

    // Log activity (non-blocking)
    if (data && data.length > 0) {
      (async () => {
        try {
          const logPayload: any = { action: 'created', resource_type: 'task', resource_id: data[0].id, details: `Created task: ${title}` };
          if (user) logPayload.user_id = user.id;
          await supabase.from('activity_logs').insert([logPayload]);
        } catch (_) { }
      })();
    }

    return NextResponse.json(data);
  } catch (error: any) {
    const msg = error?.message || String(error);
    if (isConnectionError(msg)) {
      return NextResponse.json([{
        ...body,
        id: `offline-${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }]);
    }
    console.error('Create task error:', msg.slice(0, 200));
    return NextResponse.json({ error: 'Failed to create task. Please try again.' }, { status: 500 });
  }
}
