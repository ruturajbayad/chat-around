import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
    try {
        const { groupId } = await request.json();

        if (!groupId) {
            return NextResponse.json({ error: 'Missing groupId' }, { status: 400 });
        }

        const { error } = await supabase
            .from('groups')
            .update({ last_active_at: new Date().toISOString() })
            .eq('id', groupId);

        if (error) {
            console.error('Heartbeat update failed:', error);
            // Don't fail the request significantly if it's just a heartbeat
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Heartbeat error:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
