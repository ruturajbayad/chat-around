import ChatRoom from "@/components/ChatRoom";

interface PageProps {
    params: Promise<{ groupId: string }>;
}

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function getGroupName(groupId: string) {
    try {
        const { data, error } = await supabase
            .from('groups')
            .select('name')
            .eq('id', groupId)
            .single();

        if (data) {
            return data.name;
        }
    } catch (error) {
        console.error('Error fetching group name:', error);
    }
    return "Chat Room";
}

export default async function ChatPage({ params }: PageProps) {
    const { groupId } = await params;
    const groupName = await getGroupName(groupId);

    return <ChatRoom groupId={groupId} groupName={groupName} />;
}