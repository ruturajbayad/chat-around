import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// DELETE /api/groups/cleanup - Delete groups with 0 users that have been empty for 5+ minutes
export async function DELETE() {
    try {
        // Calculate timestamp for 5 minutes ago
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

        // Find and delete groups with 0 users that were last updated more than 5 minutes ago
        const { data: deletedGroups, error } = await supabase
            .from('groups')
            .delete()
            .eq('active_user_count', 0)
            .lt('updated_at', fiveMinutesAgo)
            .select();

        if (error) throw error;

        return NextResponse.json({
            success: true,
            deleted: deletedGroups?.length || 0,
            groups: deletedGroups
        });
    } catch (err) {
        console.error('Error cleaning up groups:', err);
        return NextResponse.json({ error: 'Failed to clean up groups' }, { status: 500 });
    }
}

// GET /api/groups/cleanup - Check which groups would be deleted (for testing)
export async function GET() {
    try {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

        const { data: groups, error } = await supabase
            .from('groups')
            .select('*')
            .eq('active_user_count', 0)
            .lt('updated_at', fiveMinutesAgo);

        if (error) throw error;

        return NextResponse.json({
            count: groups?.length || 0,
            groups
        });
    } catch (err) {
        console.error('Error checking groups for cleanup:', err);
        return NextResponse.json({ error: 'Failed to check groups' }, { status: 500 });
    }
}
