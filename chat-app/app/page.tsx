import GroupList from "@/components/GroupList";

export default function Home() {
  return (
    <main className="min-h-screen bg-background pb-20 selection:bg-primary selection:text-primary-foreground">
      <GroupList />
    </main>
  );
}
