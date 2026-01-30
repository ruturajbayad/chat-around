
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/groups - List active groups
export async function GET() {
    try {
        const { data: groups, error } = await supabase
            .from('groups')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);

        if (error) throw error;

        return NextResponse.json(groups);
    } catch (err) {
        console.error('Error fetching groups:', err);
        return NextResponse.json({ error: 'Failed to fetch groups' }, { status: 500 });
    }
}

// POST /api/groups - Create a new group
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, tags, key } = body;

        if (!name || name.trim().length === 0) {
            return NextResponse.json({ error: 'Group name is required' }, { status: 400 });
        }

        // Check max groups limit
        const { count, error: countError } = await supabase
            .from('groups')
            .select('*', { count: 'exact', head: true });

        if (countError) throw countError;

        if (count !== null && count >= 10) {
            return NextResponse.json({ error: 'Global maximum of 10 active groups reached. Please join an existing group.' }, { status: 403 });
        }

        // Create group
        const { data, error } = await supabase
            .from('groups')
            .insert([
                {
                    name: name.trim().slice(0, 30),
                    tags: Array.isArray(tags) ? tags.slice(0, 5) : [],
                    key: key, // Store the public key
                    active_user_count: 0
                }
            ])
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(data, { status: 201 });
    } catch (err) {
        console.error('Error creating group:', err);
        return NextResponse.json({ error: 'Failed to create group' }, { status: 500 });
    }
}
