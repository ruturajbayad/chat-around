"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button, Card, CardContent } from './ui/basic';
import { Users, MessageSquarePlus, LogIn, Zap } from 'lucide-react';
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
        <div className="min-h-screen bg-[#FAFAFA] dark:bg-black relative overflow-hidden animate-in fade-in duration-700">
            {/* Fun soft lime/pink gradient spread */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#D4FF90]/20 rounded-full blur-[150px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#FFB6C1]/10 rounded-full blur-[150px] animate-pulse [animation-delay:2s]" />
                <div className="absolute top-[40%] right-[20%] w-[30%] h-[30%] bg-[#D4FF90]/10 rounded-full blur-[100px]" />
                <div className="absolute top-[60%] left-[10%] w-[40%] h-[40%] bg-[#FFE4E1]/30 dark:bg-[#FFE4E1]/5 rounded-full blur-[120px]" />
            </div>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12 space-y-8 sm:space-y-12 relative z-10">
                {/* Fun Header */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 sm:gap-6 border-b border-[#D4FF90]/30 pb-6 sm:pb-8">
                    <div className="space-y-2 sm:space-y-4">
                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-foreground dark:text-white flex items-center gap-3">
                            Chat Around
                            <Zap className="w-8 h-8 text-[#D4FF90] fill-[#D4FF90]" />
                        </h1>
                    </div>

                    <div className="flex items-center gap-3 sm:gap-4 w-full md:w-auto">
                        <ModeToggle />
                        <Button
                            size="lg"
                            onClick={() => setShowCreateModal(true)}
                            className="rounded-full px-6 sm:px-8 font-bold text-sm sm:text-md bg-[#D4FF90] hover:bg-[#D4FF90]/90 text-black shadow-lg shadow-[#D4FF90]/30 hover:shadow-[#D4FF90]/50 hover:scale-105 transition-all flex-1 md:flex-initial h-12"
                        >
                            <MessageSquarePlus className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                            <span className="hidden sm:inline">Create Group</span>
                            <span className="sm:hidden">Create</span>
                        </Button>
                    </div>
                </header>

                {/* Content Area */}
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="h-48 sm:h-52 rounded-[2rem] bg-[#D4FF90]/5 animate-pulse border border-[#D4FF90]/10" />
                        ))}
                    </div>
                ) : groups.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 sm:py-24 lg:py-32 text-center space-y-6 px-4">
                        <div className="bg-[#D4FF90]/10 p-6 sm:p-8 rounded-full backdrop-blur-md border border-[#D4FF90]/20">
                            <MessageSquarePlus className="h-10 w-10 sm:h-12 sm:w-12 text-[#D4FF90]" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl sm:text-2xl font-bold text-foreground dark:text-white">It&apos;s quiet here...</h3>
                            <p className="text-sm sm:text-base text-black/60 dark:text-white/60 max-w-sm mx-auto">
                                Be the first to start a conversation. Create a group and share the invite.
                            </p>
                        </div>
                        <Button 
                            size="lg" 
                            onClick={() => setShowCreateModal(true)} 
                            className="rounded-full text-sm sm:text-base bg-[#D4FF90]/10 hover:bg-[#D4FF90]/20 text-foreground dark:text-white border border-[#D4FF90]/30 hover:border-[#D4FF90]/50 backdrop-blur-md h-12 px-8"
                        >
                            Start a Group
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        {groups.map(group => (
                            <Card key={group.id} className="group relative overflow-hidden bg-white/80 dark:bg-white/5 backdrop-blur-xl rounded-[2rem] transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-[#D4FF90]/10 border border-[#D4FF90]/20 hover:border-[#D4FF90]/50">
                                {/* Lime glow on hover */}
                                <div className="absolute inset-0 bg-gradient-to-br from-[#D4FF90]/0 to-[#D4FF90]/0 group-hover:from-[#D4FF90]/10 group-hover:to-transparent transition-all duration-500 pointer-events-none rounded-[2rem]" />
                                
                                <CardContent className="p-6 sm:p-8 flex flex-col h-full justify-between relative z-10">
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-start gap-3">
                                            <div className="space-y-3 overflow-hidden flex-1 min-w-0">
                                                <h3 className="font-bold text-xl truncate text-foreground dark:text-white tracking-tight group-hover:text-[#D4FF90] transition-colors duration-300">
                                                    {group.name}
                                                </h3>
                                                <div className="flex items-center gap-2">
                                                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-md border transition-all duration-300 ${
                                                        group.active_user_count > 0
                                                            ? 'bg-[#D4FF90]/20 text-[#D4FF90] border-[#D4FF90]/40'
                                                            : 'bg-black/5 dark:bg-white/5 text-black/60 dark:text-white/60 border-black/10 dark:border-white/10'
                                                    }`}>
                                                        <span className="relative flex h-2 w-2 shrink-0">
                                                            {group.active_user_count > 0 && (
                                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D4FF90] opacity-75"></span>
                                                            )}
                                                            <span className={`relative inline-flex rounded-full h-2 w-2 ${group.active_user_count > 0 ? 'bg-[#D4FF90]' : 'bg-black/30 dark:bg-white/30'}`}></span>
                                                        </span>
                                                        <Users className="h-3 w-3" />
                                                        <span>{group.active_user_count}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            {group.tags?.slice(0, 3).map((tag, i) => (
                                                <span key={i} className="text-[10px] font-bold text-[#D4FF90] bg-[#D4FF90]/10 px-3 py-1.5 rounded-full uppercase tracking-wide border border-[#D4FF90]/20">
                                                    #{tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="pt-6 mt-auto">
                                        <Button asChild className="w-full rounded-full font-bold transition-all duration-300 hover:scale-[1.02] bg-black/5 dark:bg-white/10 hover:bg-[#D4FF90] hover:text-black dark:hover:bg-[#D4FF90] dark:hover:text-black text-foreground dark:text-white border border-black/5 dark:border-white/10 hover:border-[#D4FF90] h-12 backdrop-blur-sm group/btn" variant="secondary">
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

            {showCreateModal && <CreateGroupModal onClose={() => setShowCreateModal(false)} />}
        </div>
    );
}