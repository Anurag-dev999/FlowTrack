import { serverQuery } from '@/lib/supabase/server';
import { TeamMember } from '@/lib/types';

const TEAM_FIELDS = 'id,name,email,role,avatar_url,avatar_color,phone,joined_date,created_at';

export async function getTeamMembers(): Promise<{ data: TeamMember[] | null; error: string | null }> {
    return serverQuery<TeamMember[]>(async (client) => {
        return client.from('team_members').select(TEAM_FIELDS).order('name');
    });
}

export async function createTeamMember(
    member: Omit<TeamMember, 'id' | 'created_at'>
): Promise<{ data: TeamMember | null; error: string | null }> {
    if (!member.name || !member.email || !member.role) {
        return { data: null, error: 'Missing required fields: name, email, role' };
    }

    return serverQuery<TeamMember>(async (client) => {
        return client.from('team_members').insert([member]).select(TEAM_FIELDS).single();
    });
}

export async function updateTeamMember(
    id: string,
    updates: Partial<Omit<TeamMember, 'id' | 'created_at'>>
): Promise<{ data: TeamMember | null; error: string | null }> {
    return serverQuery<TeamMember>(async (client) => {
        return client
            .from('team_members')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select(TEAM_FIELDS)
            .single();
    });
}

export async function deleteTeamMember(id: string): Promise<{ error: string | null }> {
    const { error } = await serverQuery(async (client) => {
        return client.from('team_members').delete().eq('id', id);
    });

    return { error };
}
