import { createClient } from '@supabase/supabase-js';

// Server-side Supabase instance for Route Handlers and Server Components

// Helper to detect network/SSL/connectivity errors
function isConnectionError(msg: string): boolean {
  return (
    msg.includes('fetch failed') ||
    msg.includes('SSL handshake') ||
    msg.includes('<!DOCTYPE') ||
    msg.includes('ECONNREFUSED') ||
    msg.includes('ETIMEDOUT') ||
    msg.includes('ERR_CONNECTION')
  );
}

export function getSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    // Return a dummy client or log warning to avoid crashing during build
    console.warn('Supabase environment variables are missing. Using mock client for build.');
    return createClient('https://placeholder.supabase.co', 'placeholder');
  }

  return createClient(url, key);
}

// Type-safe server-side query wrapper
export async function serverQuery<T>(
  fn: (client: ReturnType<typeof getSupabaseServerClient>) => Promise<{ data: T | null; error: any }>
): Promise<{ data: T | null; error: string | null }> {
  try {
    const client = getSupabaseServerClient();
    const { data, error } = await fn(client);

    if (error) {
      const msg = error?.message || String(error);
      if (!isConnectionError(msg)) {
        console.error('Supabase server error:', msg.slice(0, 200));
      }
      return { data: null, error: isConnectionError(msg) ? 'Database connection unavailable' : msg };
    }

    return { data, error: null };
  } catch (err: any) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    if (isConnectionError(errorMessage)) {
      return { data: null as T, error: 'Database connection unavailable. Showing offline mode.' };
    }
    console.error('Server query error:', errorMessage.slice(0, 200));
    return { data: null, error: errorMessage };
  }
}
