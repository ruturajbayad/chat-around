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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <Card className="w-full max-w-md relative overflow-hidden rounded-[2rem] bg-card border border-border shadow-2xl animate-in zoom-in-95 duration-300">

                <CardHeader className="flex flex-row items-center justify-between relative z-10 pb-2">
                    <CardTitle className="text-xl font-bold tracking-tight flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-foreground" />
                        <span className="text-foreground">New Group</span>
                    </CardTitle>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        disabled={isLoading}
                        className="rounded-full hover:bg-muted text-foreground transition-colors h-10 w-10"
                    >
                        <X className="h-5 w-5" />
                    </Button>
                </CardHeader>

                <CardContent className="relative z-10">
                    <form onSubmit={handleCreate} className="space-y-5">
                        <div className="space-y-10">
                            <label className="text-sm font-medium text-foreground ml-1">
                                Group Name
                            </label>
                            <Input
                                placeholder="e.g. Late Night Yapping"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                maxLength={30}
                                required
                                className="rounded-2xl bg-muted/50 border-input text-foreground placeholder:text-muted-foreground focus:bg-background focus:border-foreground transition-all duration-300 backdrop-blur-sm h-12"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground ml-1 mb-20">
                                Tags <span className="text-xs font-normal text-muted-foreground">(comma separated)</span>
                            </label>
                            <Input
                                placeholder="fun, random, chill"
                                value={tags}
                                onChange={e => setTags(e.target.value)}
                                className="rounded-2xl bg-muted/50 border-input text-foreground placeholder:text-muted-foreground focus:bg-background focus:border-foreground transition-all duration-300 backdrop-blur-sm h-12"
                            />
                        </div>

                        <div className="pt-4 flex justify-end gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onClose}
                                disabled={isLoading}
                                className="rounded-full px-6 border-border hover:bg-muted transition-all duration-300 h-12"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="rounded-full px-8 bg-foreground hover:bg-foreground/90 text-background font-bold transition-all duration-300 hover:scale-105 disabled:opacity-50 shadow-lg h-12"
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