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

export async function GET(request: Request) {
    const supabase = getClient(request);
    try {
        const { data, error } = await supabase
            .from('team_members')
            .select(TEAM_FIELDS)
            .order('name');

        if (error) throw error;
        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to fetch team members' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    const supabase = getClient(request);

    try {
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { name, email, role, avatar_url, avatar_color, phone, joined_date } = body;

        if (!name || !email || !role) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('team_members')
            .insert([{
                name,
                email,
                role,
                avatar_url,
                avatar_color: avatar_color || 'blue',
                phone,
                joined_date: joined_date || new Date().toISOString()
            }])
            .select(TEAM_FIELDS)
            .single();

        if (error) throw error;

        // Log activity
        await supabase.from('activity_logs').insert([{
            user_id: user.id,
            action: 'created',
            entity_type: 'team_member',
            entity_id: data.id,
            details: `Added team member: ${name}`
        }]);

        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to create team member' }, { status: 500 });
    }
}
