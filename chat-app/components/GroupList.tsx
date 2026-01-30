"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button, Card, CardContent } from './ui/basic';
import { Users, Hash, MessageSquarePlus, LogIn, Sparkles } from 'lucide-react';
import CreateGroupModal from './CreateGroupModal';
import { ModeToggle } from './ModeToggle';

interface Group {
    id: string;
    name: string;
    tags: string[];
    active_user_count: number;
    key?: string;
}

export default function GroupList() {
    const [groups, setGroups] = useState<Group[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);

    // ... (fetch logic remains same)
    const fetchGroups = async () => {
        try {
            const res = await fetch('/api/groups');
            if (res.ok) {
                const data = await res.json();
                setGroups(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGroups();
        const interval = setInterval(fetchGroups, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="max-w-5xl mx-auto px-6 py-12 space-y-12 animate-in fade-in duration-700">
            {/* Minimalist Header */}
            <header className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-border/40 pb-8">
                <div className="space-y-4">
                    <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-foreground">
                        Chat Around.
                    </h1>
                </div>

                <div className="flex items-center gap-4">
                    <ModeToggle />
                    <Button
                        size="lg"
                        onClick={() => setShowCreateModal(true)}
                        className="rounded-full px-8 font-bold text-md shadow-xl shadow-primary/10 hover:shadow-primary/20 transition-all hover:scale-105"
                    >
                        <MessageSquarePlus className="mr-2 h-5 w-5" />
                        Create Group
                    </Button>
                </div>
            </header>

            {/* Content Area */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="h-48 rounded-2xl bg-muted/50 animate-pulse" />
                    ))}
                </div>
            ) : groups.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 text-center space-y-6">
                    <div className="bg-secondary p-8 rounded-full">
                        <MessageSquarePlus className="h-12 w-12 text-muted-foreground" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-2xl font-bold text-foreground">It's quiet here...</h3>
                        <p className="text-muted-foreground max-w-sm mx-auto">
                            Be the first to start a conversation. Create a group and share the invite.
                        </p>
                    </div>
                    <Button variant="outline" size="lg" onClick={() => setShowCreateModal(true)}>
                        Start a Group
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {groups.map(group => (
                        <Card key={group.id} className="group relative overflow-hidden bg-card transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/5 border-border/50">
                            {/* Hover Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                            <CardContent className="p-6 flex flex-col h-full justify-between relative z-10">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-1.5 overflow-hidden">
                                            <h3 className="font-bold text-xl truncate text-foreground tracking-tight">{group.name}</h3>
                                            <div className="flex items-center text-xs font-medium text-muted-foreground/80 uppercase tracking-wider">
                                                <span className="relative flex h-2 w-2 mr-2">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                                </span>
                                                {group.active_user_count} active
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        {group.tags?.slice(0, 3).map((tag, i) => (
                                            <span key={i} className="text-[10px] font-bold text-muted-foreground bg-secondary px-2.5 py-1 rounded-md uppercase tracking-wide">
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-6 mt-auto">
                                    <Button asChild className="w-full font-bold transition-colors" variant="secondary">
                                        <Link href={`/chat/${group.id}#key=${encodeURIComponent(group.key || '')}`}>
                                            Join Conversation
                                            <LogIn className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                                        </Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {showCreateModal && <CreateGroupModal onClose={() => setShowCreateModal(false)} />}
        </div>
    );
}
