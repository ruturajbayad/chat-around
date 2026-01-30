import GroupList from "@/components/GroupList";

export default function GroupsPage() {
    return (
        <main className="min-h-screen bg-background pb-20 selection:bg-primary selection:text-primary-foreground">
            <GroupList />
        </main>
    );
}