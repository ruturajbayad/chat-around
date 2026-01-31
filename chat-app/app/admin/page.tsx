'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button, Card, CardHeader, CardContent, CardTitle } from '@/components/ui/basic';
import { Trash2 } from 'lucide-react';

interface Group {
    id: string;
    name: string;
    created_at: string;
    active_user_count: number;
}

interface Visit {
    count: number;
}

export default function AdminDashboard() {
    const [loading, setLoading] = useState(true);
    const [visitCount, setVisitCount] = useState(0);
    const [groups, setGroups] = useState<Group[]>([]);
    const router = useRouter();

    useEffect(() => {
        const checkAuthAndFetchData = async () => {
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                router.push('/admin/login');
                return;
            }

            // Fetch Unique Visits
            // Note: For large scale, use a database view or RPC. For MVP, we fetch distinct visitor_ids.
            const { data: visits } = await supabase
                .from('site_visits')
                .select('visitor_id');

            if (visits) {
                const uniqueVisitors = new Set(visits.map(v => v.visitor_id).filter(Boolean));
                setVisitCount(uniqueVisitors.size);
            } else {
                setVisitCount(0);
            }

            // Fetch Groups
            const { data: groupsData } = await supabase
                .from('groups')
                .select('*')
                .order('created_at', { ascending: false });

            if (groupsData) {
                setGroups(groupsData);
            }

            setLoading(false);
        };

        checkAuthAndFetchData();
    }, [router]);

    const handleDeleteGroup = async (groupId: string) => {
        if (!confirm('Are you sure you want to delete this group?')) return;

        const { error } = await supabase
            .from('groups')
            .delete()
            .eq('id', groupId);

        if (error) {
            alert('Failed to delete group: ' + error.message);
        } else {
            setGroups(groups.filter(g => g.id !== groupId));
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/admin/login');
    };

    if (loading) {
        return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
    }

    return (
        <div className="container mx-auto p-6 max-w-4xl">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                <Button onClick={handleLogout} variant="outline">Logout</Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2 mb-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Unique Visitors</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-4xl font-bold">{visitCount}</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Active Groups</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-4xl font-bold">{groups.length}</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Manage Groups</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {groups.length === 0 ? (
                            <p className="text-muted-foreground">No active groups.</p>
                        ) : (
                            groups.map((group) => (
                                <div key={group.id} className="flex justify-between items-center p-4 border rounded-lg hover:bg-muted/50 transition">
                                    <div>
                                        <h3 className="font-semibold">{group.name}</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Created: {new Date(group.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <Button
                                        variant="destructive"
                                        size="icon"
                                        onClick={() => handleDeleteGroup(group.id)}
                                        title="Delete Group"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
