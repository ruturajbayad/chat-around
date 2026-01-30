"use client";

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { importKey, encryptMessage, decryptMessage } from '@/lib/crypto';
import { Button, Input, Card } from './ui/basic';
import { Send, ArrowLeft, Reply, X, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ModeToggle } from './ModeToggle';

interface ReplyContext {
    id: string;
    sender: string;
    text: string;
}

interface MessageContent {
    text: string;
    replyTo?: ReplyContext;
}

interface Message {
    id: string;
    sender: string;
    content: MessageContent;
    timestamp: string;
    isSystem?: boolean;
    encryptedPayload?: string; // Add this for internal use before decryption
}

// Avatar color generator based on username
const getAvatarColor = (name: string) => {
    const colors = [
        'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-yellow-500',
        'bg-lime-500', 'bg-green-500', 'bg-emerald-500', 'bg-teal-500',
        'bg-cyan-500', 'bg-sky-500', 'bg-blue-500', 'bg-indigo-500',
        'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500', 'bg-pink-500', 'bg-rose-500'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
};

export default function ChatRoom({ groupId }: { groupId: string }) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [username, setUsername] = useState('');
    const [isJoined, setIsJoined] = useState(false);
    const [userCount, setUserCount] = useState(0);
    const [participants, setParticipants] = useState<string[]>([]);
    const [showParticipants, setShowParticipants] = useState(false);
    const [key, setKey] = useState<CryptoKey | null>(null);
    const [error, setError] = useState('');
    const [replyingTo, setReplyingTo] = useState<Message | null>(null);
    const [selectedIndex, setSelectedIndex] = useState(0);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    // Auto-focus input when applying a reply
    useEffect(() => {
        if (replyingTo) {
            inputRef.current?.focus();
        }
    }, [replyingTo]);

    // Initialize encryption key
    useEffect(() => {
        const hash = window.location.hash;
        const params = new URLSearchParams(hash.replace('#', '?'));
        const keyString = params.get('key');

        if (!keyString) {
            setError('Missing encryption key. Please join via a valid link.');
            return;
        }

        const init = async () => {
            try {
                const importedKey = await importKey(decodeURIComponent(keyString));
                setKey(importedKey);
            } catch (err) {
                console.error(err);
                setError('Invalid encryption key.');
            }
        };
        init();
    }, []);

    // Supabase Realtime Logic
    useEffect(() => {
        if (!key || !isJoined || !username) return;

        const channel = supabase.channel(`room:${groupId}`, {
            config: {
                presence: {
                    key: username,
                },
            },
        });

        const handleMessage = async (payload: any) => {
            try {
                // If message is from us, we already displayed it? No, wait for broadcast to be consistent?
                // Actually broadcast sends to everyone including sender usually? No, depends on config. 
                // By default broadcast does NOT send back to self unless requested.
                // We'll optimistically update valid msgs or verify. 
                // Current code: socket.io broadcasted to everyone in room including sender? io.to(groupId) does.
                // Supabase broadcast usually excludes sender by default unless 'broadcast' config says otherwise.
                // We'll check. If not, sender needs to append manually.

                const decryptedString = await decryptMessage(payload.encryptedPayload, key);
                let content: MessageContent;

                try {
                    content = JSON.parse(decryptedString);
                    if (typeof content !== 'object') throw new Error('Not object');
                } catch {
                    content = { text: decryptedString };
                }

                setMessages(prev => {
                    // Avoid duplicates if we handled self-message separately
                    if (prev.some(m => m.id === payload.id)) return prev;
                    return [...prev, { ...payload, content }];
                });
            } catch (err) {
                console.error('Failed to decrypt message', err);
            }
        };

        channel
            .on('broadcast', { event: 'message' }, ({ payload }) => handleMessage(payload))
            .on('presence', { event: 'sync' }, () => {
                const newState = channel.presenceState();
                const users = Object.keys(newState);
                // Also get the raw presence data to extract usernames if keys are unique IDs
                // In our config: key: username. So keys are usernames.
                setParticipants(users);
                setUserCount(users.length);
            })
            .on('presence', { event: 'join' }, ({ key, newPresences }) => {
                setMessages(prev => [...prev, {
                    id: Date.now().toString(),
                    sender: 'System',
                    content: { text: `${key} joined` },
                    timestamp: new Date().toISOString(),
                    isSystem: true
                }]);
            })
            .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
                setMessages(prev => [...prev, {
                    id: Date.now().toString(),
                    sender: 'System',
                    content: { text: `${key} left` },
                    timestamp: new Date().toISOString(),
                    isSystem: true
                }]);
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await channel.track({ online_at: new Date().toISOString() });
                }
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [key, isJoined, groupId, username]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, replyingTo]);

    const handleJoin = (e: React.FormEvent) => {
        e.preventDefault();
        if (username.trim()) setIsJoined(true);
    };

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();

        // Block submit if selecting mention
        if (showMentions && filteredParticipants.length > 0) return;

        if (!input.trim() || !key) return;

        try {
            const content: MessageContent = {
                text: input.trim(),
                replyTo: replyingTo ? {
                    id: replyingTo.id,
                    sender: replyingTo.sender,
                    text: replyingTo.content.text.substring(0, 50) + (replyingTo.content.text.length > 50 ? '...' : '')
                } : undefined
            };

            const payloadString = JSON.stringify(content);
            const encryptedPayload = await encryptMessage(payloadString, key);

            const messageData = {
                id: Date.now().toString(),
                sender: username,
                timestamp: new Date().toISOString(),
                encryptedPayload: encryptedPayload
            };

            // Send to others
            await supabase.channel(`room:${groupId}`).send({
                type: 'broadcast',
                event: 'message',
                payload: messageData
            });

            // Add to own list immediately
            setMessages(prev => [...prev, { ...messageData, content }]);

            setInput('');
            setReplyingTo(null);
        } catch (err) {
            console.error(err);
        }
    };

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
                <Card className="p-8 text-center max-w-sm border-destructive/50">
                    <h2 className="text-xl font-bold text-destructive mb-2">Access Denied</h2>
                    <p className="mb-4 text-muted-foreground">{error}</p>
                    <Button onClick={() => router.push('/')}>Return Home</Button>
                </Card>
            </div>
        );
    }

    if (!isJoined) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background p-4 transition-colors animate-in fade-in zoom-in-95 duration-200">
                <Card className="w-full max-w-sm p-8 space-y-8 shadow-2xl border-border">
                    <div className="text-center space-y-2">
                        <h1 className="text-3xl font-black tracking-tighter text-foreground">Join Chat</h1>
                        <p className="text-muted-foreground text-sm">Choose a temporary identity</p>
                    </div>
                    <form onSubmit={handleJoin} className="space-y-4">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                <span className="text-muted-foreground text-xs">@</span>
                            </div>
                            <Input
                                placeholder="Username"
                                value={username}
                                onChange={e => setUsername(e.target.value.replace(/\s/g, ''))}
                                autoFocus
                                required
                                maxLength={15}
                                className="pl-7 bg-secondary border-border focus-visible:ring-ring h-11"
                            />
                        </div>
                        <Button type="submit" className="w-full font-bold shadow-lg" size="lg">
                            Enter Group
                        </Button>
                    </form>
                    <div className="pt-2 text-center">
                        <Button variant="link" className="text-muted-foreground text-xs" onClick={() => router.push('/')}>Cancel</Button>
                    </div>
                </Card>
            </div>
        );
    }

    // Mention Filtering Logic
    const mentionMatch = input.match(/@(\w*)$/);
    const showMentions = mentionMatch ? true : false;
    const mentionQuery = mentionMatch ? mentionMatch[1].toLowerCase() : '';
    const filteredParticipants = participants.filter(p => p.toLowerCase().includes(mentionQuery) && p !== username);

    const insertMention = (name: string) => {
        const newInput = input.replace(/@(\w*)$/, `@${name} `);
        setInput(newInput);
        inputRef.current?.focus();
        setSelectedIndex(0);
    };

    // Keyboard Navigation Handler
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (showMentions && filteredParticipants.length > 0) {
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => (prev > 0 ? prev - 1 : filteredParticipants.length - 1));
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => (prev < filteredParticipants.length - 1 ? prev + 1 : 0));
            } else if (e.key === 'Enter') {
                e.preventDefault();
                insertMention(filteredParticipants[selectedIndex]);
            }
        }
    };

    return (
        <div className="flex h-screen w-full bg-background relative overflow-hidden">
            {/* Main Chat Area - Flexible Sidebar Sibling */}
            <div className="flex-1 flex flex-col h-full min-w-0 transition-all duration-300 ease-in-out relative">
                {/* Header */}
                <header className="px-4 py-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-20 flex items-center justify-between transition-colors shadow-sm shrink-0">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" onClick={() => router.push('/')} className="hover:bg-accent rounded-full -ml-2 text-muted-foreground hover:text-foreground">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <h2 className="font-bold text-sm md:text-base leading-tight flex items-center gap-2">
                                Group Chat
                            </h2>
                            <div className="flex items-center text-[10px] md:text-xs text-muted-foreground font-medium animate-in fade-in">
                                <span className="relative flex h-2 w-2 mr-1.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                </span>
                                {userCount} online
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2 items-center">
                        <ModeToggle />
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setShowParticipants(!showParticipants)}
                            className={cn(
                                "rounded-full transition-all",
                                showParticipants ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
                            )}
                            title="Toggle Participants"
                        >
                            <Users className="h-5 w-5" />
                        </Button>
                    </div>
                </header>

                {/* Messages Container */}
                <div className="flex-1 overflow-y-auto p-4 scroll-smooth">
                    <div className="max-w-2xl mx-auto space-y-6">
                        {messages.map((msg, index) => {
                            if (msg.isSystem) {
                                return (
                                    <div key={msg.id} className="flex justify-center my-4 opacity-50">
                                        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground bg-secondary px-3 py-1 rounded-full border border-border/50">
                                            {msg.content.text}
                                        </span>
                                    </div>
                                );
                            }

                            const isMe = msg.sender === username;

                            return (
                                <div
                                    key={msg.id}
                                    className={cn(
                                        "group flex w-full gap-3 animate-in slide-in-from-bottom-2 duration-300",
                                        isMe ? "flex-row-reverse" : "flex-row"
                                    )}
                                >
                                    {/* Avatar */}
                                    <div className={cn(
                                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white text-xs font-bold shadow-sm select-none",
                                        getAvatarColor(msg.sender)
                                    )}>
                                        {msg.sender[0].toUpperCase()}
                                    </div>

                                    {/* Message Bubble Container */}
                                    <div className={cn("flex flex-col max-w-[75%]", isMe ? "items-end" : "items-start")}>
                                        <div className="flex items-baseline gap-2 mb-1 px-1">
                                            <span className="text-xs font-semibold text-foreground/80">{msg.sender}</span>
                                            <span className="text-[9px] text-muted-foreground">
                                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>

                                        {/* Reply action button */}
                                        <div className="relative group/bubble">
                                            <div
                                                className={cn(
                                                    "relative px-4 py-2.5 shadow-sm text-sm break-words leading-relaxed",
                                                    isMe
                                                        ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-sm"
                                                        : "bg-secondary border border-border rounded-2xl rounded-tl-sm text-foreground"
                                                )}
                                            >
                                                {msg.content.replyTo && (
                                                    <div className={cn(
                                                        "mb-2 p-2 rounded text-xs border-l-2 bg-black/5 dark:bg-white/5",
                                                        isMe ? "border-primary-foreground/40" : "border-foreground/20"
                                                    )}>
                                                        <p className={cn("font-bold mb-0.5 opacity-80", isMe ? "text-primary-foreground" : "text-foreground")}>
                                                            {msg.content.replyTo.sender}
                                                        </p>
                                                        <p className="line-clamp-1 opacity-70 italic">
                                                            {msg.content.replyTo.text}
                                                        </p>
                                                    </div>
                                                )}

                                                {msg.content.text.split(new RegExp(`(@${username}\\b)`, 'gi')).map((part, i) =>
                                                    part.toLowerCase() === `@${username}`.toLowerCase() ? (
                                                        <span key={i} className="bg-primary/20 text-primary font-bold px-1 rounded mx-0.5 border border-primary/30 shadow-[0_0_10px_rgba(var(--primary),0.2)] animate-pulse">
                                                            {part}
                                                        </span>
                                                    ) : (
                                                        <span key={i}>{part}</span>
                                                    )
                                                )}
                                            </div>

                                            <button
                                                onClick={() => setReplyingTo(msg)}
                                                className={cn(
                                                    "absolute top-1/2 -translate-y-1/2 opacity-0 group-hover/bubble:opacity-100 transition-opacity p-1.5 rounded-full bg-background shadow-sm border hover:bg-accent",
                                                    isMe ? "-left-10" : "-right-10"
                                                )}
                                                title="Reply"
                                            >
                                                <Reply className="h-4 w-4 text-muted-foreground" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>
                </div>

                {/* Input Area */}
                <div className="p-4 border-t bg-background/95 backdrop-blur z-20 shrink-0">
                    <div className="max-w-2xl mx-auto space-y-2 relative">

                        {showMentions && filteredParticipants.length > 0 && (
                            <div className="absolute bottom-full left-0 mb-2 z-40 bg-popover/95 backdrop-blur border shadow-2xl rounded-xl p-2 w-48 animate-in slide-in-from-bottom-2 fade-in duration-200">
                                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-2 py-1">Suggestions</div>
                                {filteredParticipants.map((p, i) => (
                                    <div
                                        key={i}
                                        className={cn(
                                            "flex items-center gap-2 text-sm p-2 rounded-lg cursor-pointer transition-colors",
                                            i === selectedIndex ? "bg-primary/20 text-primary" : "hover:bg-primary/10 text-foreground"
                                        )}
                                        onClick={() => insertMention(p)}
                                    >
                                        <div className={cn("w-3 h-3 rounded-full", getAvatarColor(p))} />
                                        <span className={cn("font-medium", i === selectedIndex && "font-bold")}>{p}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {replyingTo && (
                            <div className="flex items-center justify-between bg-secondary p-2 px-3 rounded-lg border-l-4 border-foreground animate-in slide-in-from-bottom-2">
                                <div className="text-sm overflow-hidden">
                                    <span className="font-semibold block text-xs">Replying to {replyingTo.sender}</span>
                                    <span className="text-muted-foreground truncate block text-xs mt-0.5">{replyingTo.content.text}</span>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => setReplyingTo(null)} className="h-6 w-6 rounded-full hover:bg-background/80">
                                    <X className="h-3 w-3" />
                                </Button>
                            </div>
                        )}

                        <form onSubmit={sendMessage} className="flex gap-2">
                            <Input
                                ref={inputRef}
                                value={input}
                                onChange={e => {
                                    setInput(e.target.value);
                                    setSelectedIndex(0); // Reset selection on type
                                }}
                                onKeyDown={handleKeyDown}
                                placeholder={replyingTo ? "Type your reply..." : "Type a message..."}
                                className="flex-1 rounded-full border-input focus-visible:ring-ring bg-secondary/50 h-11 px-5"
                            />
                            <Button
                                type="submit"
                                size="icon"
                                className={cn(
                                    "rounded-full shrink-0 h-11 w-11 shadow-md transition-all",
                                    input.trim() ? "bg-primary hover:bg-primary/90 scale-100" : "bg-muted text-muted-foreground scale-95"
                                )}
                                disabled={!input.trim()}
                            >
                                <Send className="h-5 w-5 ml-0.5" />
                            </Button>
                        </form>
                    </div>
                </div>
            </div>

            {/* Right Sidebar for Participants - Responsive & Collapsible */}
            <div className={cn(
                "border-l border-border/50 bg-background/95 backdrop-blur transition-all duration-300 ease-in-out overflow-hidden flex flex-col",
                showParticipants ? "w-72 opacity-100" : "w-0 opacity-0"
            )}>
                <div className="p-4 border-b border-border/50 flex items-center justify-between shrink-0 h-[61px]">
                    <h3 className="font-bold flex items-center gap-2 truncate">
                        Participants
                        <span className="bg-secondary text-secondary-foreground text-[10px] px-2 py-0.5 rounded-full">{participants.length}</span>
                    </h3>
                    <Button variant="ghost" size="icon" onClick={() => setShowParticipants(false)} className="h-8 w-8 rounded-full shrink-0">
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                <div className="flex-1 overflow-y-auto p-2 min-w-[18rem]">
                    <div className="space-y-1">
                        {participants.length > 0 ? participants.map((p, i) => (
                            <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 cursor-pointer group transition-colors" onClick={() => {
                                insertMention(p);
                                if (window.innerWidth < 768) setShowParticipants(false);
                            }}>
                                <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm", getAvatarColor(p))}>
                                    {p[0].toUpperCase()}
                                </div>
                                <div className="flex flex-col">
                                    <span className={cn("text-sm font-medium", p === username ? "text-primary" : "text-foreground")}>
                                        {p} {p === username && "(You)"}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground group-hover:text-primary/70 transition-colors">
                                        Online
                                    </span>
                                </div>
                            </div>
                        )) : (
                            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground space-y-2 opacity-50">
                                <Users className="h-8 w-8 mb-2" />
                                <span className="text-xs">No active participants</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile Overlay Background (Optional) */}
            {showParticipants && (
                <div
                    className="md:hidden absolute inset-0 bg-background/80 backdrop-blur-sm z-20"
                    onClick={() => setShowParticipants(false)}
                />
            )}

            {/* Re-apply absolute positioning for sidebar on mobile to act as drawer */}
            <div className={cn(
                "md:hidden absolute top-0 right-0 h-full bg-background border-l shadow-2xl transition-transform duration-300 ease-in-out z-30 w-72 flex flex-col",
                showParticipants ? "translate-x-0" : "translate-x-full"
            )}>
                <div className="p-4 border-b border-border/50 flex items-center justify-between shrink-0 h-[61px]">
                    <h3 className="font-bold flex items-center gap-2">
                        Participants
                        <span className="bg-secondary text-secondary-foreground text-[10px] px-2 py-0.5 rounded-full">{participants.length}</span>
                    </h3>
                    <Button variant="ghost" size="icon" onClick={() => setShowParticipants(false)} className="h-8 w-8 rounded-full">
                        <X className="h-4 w-4" />
                    </Button>
                </div>
                <div className="flex-1 overflow-y-auto p-2">
                    {/* ... Same list ... */}
                    <div className="space-y-1">
                        {participants.map((p, i) => (
                            <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 cursor-pointer group transition-colors" onClick={() => {
                                insertMention(p);
                                setShowParticipants(false);
                            }}>
                                <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm", getAvatarColor(p))}>
                                    {p[0].toUpperCase()}
                                </div>
                                <div className="flex flex-col">
                                    <span className={cn("text-sm font-medium", p === username ? "text-primary" : "text-foreground")}>
                                        {p} {p === username && "(You)"}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground text-primary/70">
                                        Online
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>


        </div>
    );
}
