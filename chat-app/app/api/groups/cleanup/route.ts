import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function DELETE(request: Request) {
    try {
        // Delete all groups with 0 or fewer active users
        // Note: This relies on RLS allowing deletion or the key having delete permissions
        const { data, error } = await supabase
            .from('groups')
            .delete()
            .lte('active_user_count', 0)
            .select();

        if (error) {
            console.error('Cleanup failed:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, deleted: data });
    } catch (err) {
        console.error('Cleanup error:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
