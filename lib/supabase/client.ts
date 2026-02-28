import { createClient } from '@supabase/supabase-js';

// Client-side Supabase instance
export const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);

// Type-safe wrapper for better error handling
export async function queryWithError<T>(
  query: Promise<{ data: T | null; error: any }>
): Promise<{ data: T | null; error: string | null }> {
  try {
    const { data, error } = await query;
    if (error) {
      console.error('Supabase error:', error.message);
      return { data: null, error: error.message };
    }
    return { data, error: null };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Query error:', errorMessage);
    return { data: null, error: errorMessage };
  }
}
