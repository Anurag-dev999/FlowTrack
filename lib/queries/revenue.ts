import { serverQuery } from '@/lib/supabase/server';
import { Revenue } from '@/lib/types';

export async function getMonthlyRevenue(): Promise<{ data: Revenue[] | null; error: string | null }> {
  return serverQuery<Revenue[]>(async (client) => {
    return client.from('revenue').select('*').order('month', { ascending: true });
  });
}

export async function getTotalRevenue(): Promise<{ data: number | null; error: string | null }> {
  return serverQuery<number>(async (client) => {
    const { data, error } = await client.from('revenue').select('amount');

    if (error) return { data: null, error };

    const total = data.reduce((sum, record) => sum + (record.amount || 0), 0);
    return { data: total, error: null };
  });
}

export async function getRevenueByMonth(month: string): Promise<{ data: Revenue | null; error: string | null }> {
  return serverQuery<Revenue>(async (client) => {
    return client.from('revenue').select('*').eq('month', month).single();
  });
}

export async function getRevenueRange(startMonth: string, endMonth: string): Promise<{
  data: Revenue[] | null;
  error: string | null;
}> {
  return serverQuery<Revenue[]>(async (client) => {
    return client
      .from('revenue')
      .select('*')
      .gte('month', startMonth)
      .lte('month', endMonth)
      .order('month', { ascending: true });
  });
}
