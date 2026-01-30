import ChatRoom from "@/components/ChatRoom";

interface PageProps {
  params: Promise<{ groupId: string }>;
}

async function getGroupName(groupId: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_URL}/api/groups/${groupId}`, {
      cache: 'no-store'
    });
    if (res.ok) {
      const group = await res.json();
      return group.name;
    }
  } catch (error) {
    console.error(error);
  }
  return "Chat Room";
}

export default async function ChatPage({ params }: PageProps) {
  const { groupId } = await params;
  const groupName = await getGroupName(groupId);

  return <ChatRoom groupId={groupId} groupName={groupName} />;
}