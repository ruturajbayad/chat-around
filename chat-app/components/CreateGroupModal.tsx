"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, Card, CardHeader, CardTitle, CardContent } from './ui/basic';
import { generateKey, exportKey } from '@/lib/crypto';
import { Loader2, Plus, X, Sparkles } from 'lucide-react';

export default function CreateGroupModal({ onClose }: { onClose: () => void }) {
    const [name, setName] = useState('');
    const [tags, setTags] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setIsLoading(true);
        try {
            const key = await generateKey();
            const exportedKey = await exportKey(key);

            const res = await fetch('/api/groups', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: name.trim(),
                    tags: tags.split(',').map(t => t.trim()).filter(Boolean),
                    key: exportedKey
                })
            });

            if (!res.ok) {
                const err = await res.json();
                alert(err.error || 'Failed to create group');
                setIsLoading(false);
                return;
            }

            const group = await res.json();
            const hashKey = encodeURIComponent(exportedKey);
            router.push(`/chat/${group.id}#key=${hashKey}`);
        } catch (error) {
            console.error(error);
            alert('Something went wrong');
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <Card className="w-full max-w-md relative overflow-hidden rounded-[2rem] bg-white dark:bg-black backdrop-blur-2xl border border-[#D4FF90]/20 shadow-2xl animate-in zoom-in-95 duration-300">
                
                {/* Soft lime gradient spread */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#D4FF90]/10 via-transparent to-[#FFB6C1]/10 pointer-events-none" />
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#D4FF90]/20 rounded-full blur-[100px] pointer-events-none animate-pulse" />
                <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-[#FFB6C1]/10 rounded-full blur-[100px] pointer-events-none animate-pulse [animation-delay:2s]" />

                <CardHeader className="flex flex-row items-center justify-between relative z-10 pb-2">
                    <CardTitle className="text-xl font-bold tracking-tight flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-[#D4FF90]" />
                        <span className="text-foreground dark:text-white">New Group</span>
                    </CardTitle>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={onClose} 
                        disabled={isLoading}
                        className="rounded-full hover:bg-[#D4FF90]/20 text-foreground dark:text-white transition-colors h-10 w-10"
                    >
                        <X className="h-5 w-5" />
                    </Button>
                </CardHeader>

                <CardContent className="relative z-10">
                    <form onSubmit={handleCreate} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground dark:text-white/80 ml-1">
                                Group Name
                            </label>
                            <Input
                                placeholder="e.g. Late Night Yapping"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                maxLength={30}
                                required
                                className="rounded-2xl bg-[#D4FF90]/5 dark:bg-[#D4FF90]/10 border-[#D4FF90]/30 text-foreground dark:text-white placeholder:text-black/30 dark:placeholder:text-white/30 focus:bg-[#D4FF90]/10 dark:focus:bg-[#D4FF90]/20 focus:border-[#D4FF90] transition-all duration-300 backdrop-blur-sm h-12"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground dark:text-white/80 ml-1">
                                Tags <span className="text-xs font-normal text-black/40 dark:text-white/40">(comma separated)</span>
                            </label>
                            <Input
                                placeholder="fun, random, chill"
                                value={tags}
                                onChange={e => setTags(e.target.value)}
                                className="rounded-2xl bg-[#D4FF90]/5 dark:bg-[#D4FF90]/10 border-[#D4FF90]/30 text-foreground dark:text-white placeholder:text-black/30 dark:placeholder:text-white/30 focus:bg-[#D4FF90]/10 dark:focus:bg-[#D4FF90]/20 focus:border-[#D4FF90] transition-all duration-300 backdrop-blur-sm h-12"
                            />
                        </div>

                        <div className="pt-4 flex justify-end gap-3">
                            <Button 
                                type="button" 
                                variant="outline" 
                                onClick={onClose} 
                                disabled={isLoading}
                                className="rounded-full px-6 border-black/10 dark:border-white/10 hover:bg-[#D4FF90]/10 hover:border-[#D4FF90]/50 transition-all duration-300 h-12"
                            >
                                Cancel
                            </Button>
                            <Button 
                                type="submit" 
                                disabled={isLoading}
                                className="rounded-full px-8 bg-[#D4FF90] hover:bg-[#D4FF90]/90 text-black font-bold transition-all duration-300 hover:scale-105 disabled:opacity-50 shadow-lg shadow-[#D4FF90]/20 h-12"
                            >
                                {isLoading ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Plus className="mr-2 h-4 w-4" />
                                )}
                                Create
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}