import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const TEAM_FIELDS = 'id,name,email,role,avatar_url,avatar_color,phone,joined_date,created_at';

function getClient(request: Request) {
    const authHeader = request.headers.get('Authorization');
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { global: { headers: { Authorization: authHeader || '' } } }
    );
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    const supabase = getClient(request);

    try {
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const updates = await request.json();

        const { data, error } = await supabase
            .from('team_members')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select(TEAM_FIELDS)
            .single();

        if (error) throw error;

        // Log activity
        await supabase.from('activity_logs').insert([{
            user_id: user.id,
            action: 'updated',
            entity_type: 'team_member',
            entity_id: id,
            details: `Updated team member: ${data.name}`
        }]);

        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to update team member' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    const supabase = getClient(request);

    try {
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        // Get name first for logging
        const { data: member } = await supabase.from('team_members').select('name').eq('id', id).single();

        const { error } = await supabase.from('team_members').delete().eq('id', id);
        if (error) throw error;

        // Log activity
        await supabase.from('activity_logs').insert([{
            user_id: user.id,
            action: 'deleted',
            entity_type: 'team_member',
            entity_id: id,
            details: `Removed team member: ${member?.name || 'Unknown'}`
        }]);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to delete team member' }, { status: 500 });
    }
}
