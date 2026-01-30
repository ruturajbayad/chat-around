"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button, Card, CardContent } from './ui/basic';
import { Users, MessageSquarePlus, LogIn, Zap, Plus } from 'lucide-react';
import CreateGroupModal from './CreateGroupModal';
import ModeToggle from './ModeToggle';

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

    const cleanupEmptyGroups = async () => {
        try {
            await fetch('/api/groups/cleanup', { method: 'DELETE' });
        } catch (err) {
            console.error('Cleanup error:', err);
        }
    };

    useEffect(() => {
        fetchGroups();
        cleanupEmptyGroups();

        const fetchInterval = setInterval(fetchGroups, 5000);
        const cleanupInterval = setInterval(cleanupEmptyGroups, 60000);

        return () => {
            clearInterval(fetchInterval);
            clearInterval(cleanupInterval);
        };
    }, []);

    return (
        <div className="min-h-screen bg-background relative overflow-hidden animate-in fade-in duration-700">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12 space-y-8 sm:space-y-12 relative z-10">
                {/* Header */}
                <header className="flex flex-row justify-between items-center gap-4 border-b border-border/40 pb-6 sm:pb-8">
                    <div className="space-y-2 sm:space-y-4">
                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-foreground flex items-center gap-3">
                            Chat Around
                            <Zap className="w-8 h-8 text-foreground fill-current" />
                        </h1>
                    </div>

                    <div className="flex items-center gap-3 sm:gap-4 md:w-auto">
                        <ModeToggle />

                    </div>
                </header>

                {/* Content Area */}
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="h-48 sm:h-52 rounded-[2rem] bg-muted animate-pulse border border-border/50" />
                        ))}
                    </div>
                ) : groups.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 sm:py-24 lg:py-32 text-center space-y-6 px-4">
                        <div className="bg-secondary p-6 sm:p-8 rounded-full backdrop-blur-md border border-border">
                            <MessageSquarePlus className="h-10 w-10 sm:h-12 sm:w-12 text-foreground" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl sm:text-2xl font-bold text-foreground">It&apos;s quiet here...</h3>
                            <p className="text-sm sm:text-base text-muted-foreground max-w-sm mx-auto">
                                Be the first to start a conversation. Create a group and share the invite.
                            </p>
                        </div>
                        <Button
                            size="lg"
                            onClick={() => setShowCreateModal(true)}
                            className="rounded-full text-sm sm:text-base bg-secondary hover:bg-secondary/80 text-foreground border border-border backdrop-blur-md h-12 px-8"
                        >
                            Start a Group
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        {groups.map(group => (
                            <Card key={group.id} className="group relative overflow-hidden bg-card/50 backdrop-blur-xl rounded-[2rem] transition-all duration-300 hover:-translate-y-2 hover:shadow-xl border border-border/50 hover:border-foreground/50">
                                <CardContent className="p-6 sm:p-8 flex flex-col h-full justify-between relative z-10">
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-start gap-3">
                                            <div className="space-y-3 overflow-hidden flex-1 min-w-0">
                                                <h3 className="font-bold text-xl truncate text-foreground tracking-tight group-hover:text-foreground/80 transition-colors duration-300">
                                                    {group.name}
                                                </h3>
                                                <div className="flex items-center gap-2">
                                                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-md border transition-all duration-300 ${group.active_user_count > 0
                                                        ? 'bg-foreground/10 text-foreground border-foreground/20'
                                                        : 'bg-muted text-muted-foreground border-border'
                                                        }`}>
                                                        <span className="relative flex h-2 w-2 shrink-0">
                                                            {group.active_user_count > 0 && (
                                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-foreground opacity-75"></span>
                                                            )}
                                                            <span className={`relative inline-flex rounded-full h-2 w-2 ${group.active_user_count > 0 ? 'bg-foreground' : 'bg-muted-foreground/30'}`}></span>
                                                        </span>
                                                        <Users className="h-3 w-3" />
                                                        <span>{group.active_user_count}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            {group.tags?.slice(0, 3).map((tag, i) => (
                                                <span key={i} className="text-[10px] font-bold text-foreground bg-foreground/5 px-3 py-1.5 rounded-full uppercase tracking-wide border border-border">
                                                    #{tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="pt-6 mt-auto">
                                        <Button asChild className="w-full rounded-full font-bold transition-all duration-300 hover:scale-[1.02] bg-secondary hover:bg-foreground hover:text-background text-foreground border border-border hover:border-foreground h-12 backdrop-blur-sm group/btn" variant="secondary">
                                            <Link href={`/chat/${group.id}#key=${encodeURIComponent(group.key || '')}`}>
                                                <span className="hidden sm:inline">Join Conversation</span>
                                                <span className="sm:hidden">Join</span>
                                                <LogIn className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                                            </Link>
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Floating Action Button (FAB) for Create Group */}
            <Button
                size="icon"
                onClick={() => setShowCreateModal(true)}
                className="fixed bottom-8 right-8 z-50 rounded-full h-14 w-14 sm:h-16 sm:w-16 shadow-2xl bg-foreground text-background hover:bg-foreground/90 hover:scale-110 transition-all duration-300"
            >
                <Plus className="h-6 w-6 sm:h-8 sm:w-8" />
            </Button>

            {showCreateModal && <CreateGroupModal onClose={() => setShowCreateModal(false)} />}
        </div>
    );
}