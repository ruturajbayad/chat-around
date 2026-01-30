"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, Card, CardHeader, CardTitle, CardContent } from './ui/basic';
import { generateKey, exportKey } from '@/lib/crypto';
import { Loader2, Plus } from 'lucide-react';

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
            // 1. Generate E2EE Key client-side
            const key = await generateKey();
            const exportedKey = await exportKey(key);

            // 2. Create Group on Server
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

            // 3. Redirect to chat with Key in URL Hash
            const hashKey = encodeURIComponent(exportedKey);
            router.push(`/chat/${group.id}#key=${hashKey}`);
        } catch (error) {
            console.error(error);
            alert('Something went wrong');
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <Card className="w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Create New Group</CardTitle>
                    <Button variant="ghost" size="icon" onClick={onClose} disabled={isLoading}>
                        <span className="text-xl">×</span>
                    </Button>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Group Name</label>
                            <Input
                                placeholder="e.g. Late Night Coding"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                maxLength={30}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Interest Tags (comma separated)</label>
                            <Input
                                placeholder="tech, music, chilling"
                                value={tags}
                                onChange={e => setTags(e.target.value)}
                            />
                        </div>
                        <div className="pt-2 flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                                Create Group
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
