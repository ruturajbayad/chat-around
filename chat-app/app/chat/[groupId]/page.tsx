import ChatRoom from "@/components/ChatRoom";

export default async function ChatPage({ params }: { params: { groupId: string } }) {
    // We need to await params in Next.js 15+ (actually App Router params are promise-like in some versions, but standard destructuring works in most stable versions. 
    // However, let's treat it safely or just use simple component prop driling.
    // The 'params' prop is an object.
    const { groupId } = await params;

    return <ChatRoom groupId={groupId} />;
}
