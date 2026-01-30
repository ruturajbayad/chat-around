import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Handle Join/Leave actions
export async function POST(
    request: Request,
    props: { params: Promise<{ groupId: string }> }
) {
    try {
        const params = await props.params;
        const { action } = await request.json(); // { action: 'join' | 'leave' }

        if (action === 'join') {
            // Increment count
            const { error } = await supabase.rpc('increment_active_users', { group_id: params.groupId });

            if (error) {
                console.error('RPC increment failed, falling back manually:', error);

                // Fallback attempt: Read -> Increment -> Write
                const { data: current } = await supabase
                    .from('groups')
                    .select('active_user_count')
                    .eq('id', params.groupId)
                    .single();

                if (current) {
                    await supabase
                        .from('groups')
                        .update({ active_user_count: (current.active_user_count || 0) + 1 })
                        .eq('id', params.groupId);
                }
            }
        } else if (action === 'leave') {
            // Decrement count
            const { error } = await supabase.rpc('decrement_active_users', { group_id: params.groupId });

            if (error) {
                console.error('RPC decrement failed, falling back manually:', error);
                // Fallback
                const { data: current } = await supabase
                    .from('groups')
                    .select('active_user_count')
                    .eq('id', params.groupId)
                    .single();

                if (current) {
                    const newCount = Math.max(0, (current.active_user_count || 1) - 1);
                    await supabase
                        .from('groups')
                        .update({ active_user_count: newCount })
                        .eq('id', params.groupId);

                    if (newCount === 0) {
                        console.log('Group empty (fallback), deleting:', params.groupId);
                        await supabase.from('groups').delete().eq('id', params.groupId);
                    }
                }
            } else {
                // Check count to verify if it should be deleted (in case RPC didn't delete it)
                const { data: group } = await supabase
                    .from('groups')
                    .select('active_user_count')
                    .eq('id', params.groupId)
                    .single();

                if (group && group.active_user_count <= 0) {
                    console.log('Group empty (RPC successful), deleting:', params.groupId);
                    await supabase.from('groups').delete().eq('id', params.groupId);
                }
            }
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Membership error:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
