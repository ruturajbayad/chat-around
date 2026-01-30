"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { importKey, encryptMessage, decryptMessage } from "@/lib/crypto";
import { Button, Input, Card } from "./ui/basic";
import { Send, ArrowLeft, Reply, X, Users, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import ModeToggle from "./ModeToggle";

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
  encryptedPayload?: string;
}

const getAvatarColor = (name: string) => {
  const colors = [
    "bg-[#D4FF90] text-black",
    "bg-[#FFB6C1] text-black", 
    "bg-[#90D4FF] text-black",
    "bg-[#FFD490] text-black",
    "bg-neutral-800 text-white"
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const TypingIndicator = () => (
  <div className="flex items-center gap-1 px-4 py-3 rounded-2xl bg-[#D4FF90]/10 backdrop-blur-md border border-[#D4FF90]/30 shadow-lg">
    <div className="w-1.5 h-1.5 rounded-full bg-[#D4FF90] animate-bounce [animation-delay:-0.3s]" />
    <div className="w-1.5 h-1.5 rounded-full bg-[#D4FF90] animate-bounce [animation-delay:-0.15s]" />
    <div className="w-1.5 h-1.5 rounded-full bg-[#D4FF90] animate-bounce" />
  </div>
);

export default function ChatRoom({ groupId, groupName }: { groupId: string; groupName: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [username, setUsername] = useState("");
  const [isJoined, setIsJoined] = useState(false);
  const [userCount, setUserCount] = useState(0);
  const [participants, setParticipants] = useState<string[]>([]);
  const [key, setKey] = useState<CryptoKey | null>(null);
  const [error, setError] = useState("");
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // FIX: Added undefined as initial value
  const typingTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const router = useRouter();

  useEffect(() => {
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.replace("#", "?"));
    const keyString = params.get("key");
    if (!keyString) return setError("Missing encryption key.");
    importKey(decodeURIComponent(keyString))
      .then(setKey)
      .catch(() => setError("Invalid encryption key."));
  }, []);

  useEffect(() => {
    if (!key || !isJoined || !username) return;

    const channel = supabase.channel(`room:${groupId}`, {
      config: { presence: { key: username } },
    });

    channel
      .on("broadcast", { event: "message" }, async ({ payload }) => {
        const decrypted = await decryptMessage(payload.encryptedPayload, key);
        const content = JSON.parse(decrypted);
        setMessages((p) =>
          p.some((m) => m.id === payload.id) ? p : [...p, { ...payload, content }]
        );
      })
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        if (payload.user !== username) {
          setTypingUsers((prev) => 
            payload.isTyping 
              ? [...new Set([...prev, payload.user])]
              : prev.filter(u => u !== payload.user)
          );
        }
      })
      .on("presence", { event: "sync" }, () => {
        const users = Object.keys(channel.presenceState());
        setParticipants(users);
        setUserCount(users.length);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [key, isJoined, username, groupId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUsers]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    
    if (!isTyping) {
      setIsTyping(true);
      supabase.channel(`room:${groupId}`).send({
        type: "broadcast",
        event: "typing",
        payload: { user: username, isTyping: true },
      });
    }

    // FIX: Check if current exists before clearing
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      supabase.channel(`room:${groupId}`).send({
        type: "broadcast",
        event: "typing",
        payload: { user: username, isTyping: false },
      });
    }, 2000);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !key) return;

    const content: MessageContent = { 
      text: input,
      replyTo: replyingTo ? {
        id: replyingTo.id,
        sender: replyingTo.sender,
        text: replyingTo.content.text
      } : undefined
    };

    const encryptedPayload = await encryptMessage(JSON.stringify(content), key);

    const msg = {
      id: Date.now().toString(),
      sender: username,
      timestamp: new Date().toISOString(),
      encryptedPayload,
    };

    await supabase.channel(`room:${groupId}`).send({
      type: "broadcast",
      event: "message",
      payload: msg,
    });

    setMessages((p) => [...p, { ...msg, content }]);
    setInput("");
    setReplyingTo(null);
    setIsTyping(false);
  };

  const handleLeaveGroup = () => {
    setShowLeaveConfirm(false);
    router.push("/");
  };

  if (error) return (
    <div className="h-screen flex items-center justify-center bg-[#FAFAFA] dark:bg-black text-foreground dark:text-white relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#D4FF90]/20 rounded-full blur-[150px]" />
      <Card className="p-8 rounded-3xl bg-white/80 dark:bg-white/5 backdrop-blur-xl border border-[#D4FF90]/30 text-foreground dark:text-white relative z-10">
        {error}
      </Card>
    </div>
  );

  if (!isJoined) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#FAFAFA] dark:bg-black relative overflow-hidden">
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#D4FF90]/20 rounded-full blur-[150px] animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#FFB6C1]/10 rounded-full blur-[150px] animate-pulse [animation-delay:2s]" />
          <div className="absolute top-[40%] right-[20%] w-[30%] h-[30%] bg-[#D4FF90]/10 rounded-full blur-[100px]" />
        </div>
        
        <Card className="p-8 space-y-6 rounded-[2rem] bg-white/80 dark:bg-white/5 backdrop-blur-2xl border border-[#D4FF90]/30 shadow-2xl w-full max-w-md mx-4 relative z-10">
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-[#D4FF90]/20 flex items-center justify-center border border-[#D4FF90]/30">
                <Zap className="h-8 w-8 text-[#D4FF90]" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-foreground dark:text-white tracking-tight">Join Chat</h1>
            <p className="text-black/60 dark:text-white/40 text-sm">
              Enter your name to join <span className="text-[#D4FF90] font-medium">{groupName}</span>
            </p>
          </div>
          
          <div className="space-y-4">
            <Input 
              value={username} 
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Your name"
              className="rounded-2xl bg-[#D4FF90]/5 dark:bg-[#D4FF90]/10 border-[#D4FF90]/30 text-foreground dark:text-white placeholder:text-black/30 dark:placeholder:text-white/30 focus:bg-[#D4FF90]/10 dark:focus:bg-[#D4FF90]/20 focus:border-[#D4FF90] transition-all duration-300 backdrop-blur-sm h-12"
              onKeyDown={(e) => e.key === "Enter" && username.trim() && setIsJoined(true)}
            />
            <Button 
              onClick={() => setIsJoined(true)}
              disabled={!username.trim()}
              className="w-full rounded-2xl bg-[#D4FF90] hover:bg-[#D4FF90]/90 text-black font-bold border-none transition-all duration-300 disabled:opacity-50 h-12 shadow-lg shadow-[#D4FF90]/20 hover:shadow-[#D4FF90]/40 hover:scale-[1.02]"
            >
              Enter Room
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full overflow-hidden bg-[#FAFAFA] dark:bg-black">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#D4FF90]/20 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#FFB6C1]/10 rounded-full blur-[150px] animate-pulse [animation-delay:2s]" />
        <div className="absolute top-[40%] right-[10%] w-[40%] h-[40%] bg-[#D4FF90]/10 rounded-full blur-[120px] animate-pulse [animation-delay:1s]" />
        <div className="absolute bottom-[20%] left-[10%] w-[40%] h-[40%] bg-[#90D4FF]/10 rounded-full blur-[120px] animate-pulse [animation-delay:3s]" />
      </div>

      <header className="fixed top-0 left-0 right-0 z-50 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setShowLeaveConfirm(true)}
              className="rounded-full bg-white/80 dark:bg-white/5 backdrop-blur-md border border-[#D4FF90]/30 hover:bg-[#D4FF90]/20 hover:border-[#D4FF90] text-foreground dark:text-white transition-all duration-300 h-12 w-12"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>

            <div className="flex items-center gap-3 rounded-full bg-white/80 dark:bg-white/5 backdrop-blur-xl border border-[#D4FF90]/30 px-5 py-3 shadow-lg hover:border-[#D4FF90]/60 transition-colors duration-300">
              <div className="flex flex-col">
                <span className="text-sm font-bold text-foreground dark:text-white leading-tight">{groupName}</span>
                <span className="flex items-center gap-2 text-[10px] text-[#D4FF90] font-medium leading-tight">
                  <span className="h-2 w-2 rounded-full bg-[#D4FF90] animate-pulse" />
                  {userCount} active
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 dark:bg-white/5 backdrop-blur-md border border-[#D4FF90]/30 text-foreground/60 dark:text-white/60 text-xs">
              <Users className="w-3 h-3 text-[#D4FF90]" />
              {participants.slice(0, 3).join(", ")}
              {participants.length > 3 && ` +${participants.length - 3}`}
            </div>
            <ModeToggle />
          </div>
        </div>
      </header>

      <main className="h-full overflow-y-auto pt-24 pb-40 px-4 scrollbar-hide">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.map((msg, index) => {
            const isMe = msg.sender === username;
            const showAvatar = !isMe && (index === 0 || messages[index - 1].sender !== msg.sender);
            
            return (
              <div
                key={msg.id}
                className={cn(
                  "flex gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500",
                  isMe ? "justify-end" : "justify-start"
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {!isMe && (
                  <div className={cn(
                    "flex-shrink-0 transition-all duration-300",
                    showAvatar ? "opacity-100 scale-100" : "opacity-0 scale-90 w-8"
                  )}>
                    {showAvatar && (
                      <div className={cn(
                        "h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold shadow-lg ring-2 ring-white/20 dark:ring-white/10",
                        getAvatarColor(msg.sender)
                      )}>
                        {msg.sender[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                )}

                <div className={cn(
                  "group relative max-w-[75%] sm:max-w-[60%]",
                  isMe ? "items-end" : "items-start"
                )}>
                  
                  {msg.content.replyTo && (
                    <div className={cn(
                      "mb-1 px-4 py-2 rounded-2xl text-xs backdrop-blur-md border border-[#D4FF90]/20 bg-[#D4FF90]/5",
                      isMe ? "rounded-br-sm" : "rounded-bl-sm"
                    )}>
                      <span className="font-medium text-[#D4FF90]">Replying to {msg.content.replyTo.sender}:</span>
                      <p className="truncate max-w-[200px] text-foreground/60 dark:text-white/60">{msg.content.replyTo.text}</p>
                    </div>
                  )}

                  <div className={cn(
                    "relative px-5 py-3 rounded-[2rem] backdrop-blur-xl border transition-all duration-300 hover:scale-[1.02] shadow-lg",
                    isMe 
                      ? "bg-[#D4FF90]/20 border-[#D4FF90]/40 text-foreground dark:text-white rounded-br-md hover:bg-[#D4FF90]/30"
                      : "bg-white/80 dark:bg-white/5 border-[#D4FF90]/30 text-foreground dark:text-white rounded-bl-md hover:border-[#D4FF90]/60"
                  )}>
                    {!isMe && showAvatar && (
                      <p className="text-[10px] font-bold text-[#D4FF90] mb-1">{msg.sender}</p>
                    )}
                    
                    <p className="text-sm leading-relaxed font-medium">{msg.content.text}</p>
                    
                    <span className="text-[9px] text-foreground/40 dark:text-white/40 mt-1 block text-right">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>

                    <button
                      onClick={() => setReplyingTo(msg)}
                      className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-2 rounded-full bg-[#D4FF90]/20 backdrop-blur-md border border-[#D4FF90]/30 text-[#D4FF90] hover:bg-[#D4FF90]/30 hover:scale-110"
                    >
                      <Reply className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {isMe && (
                  <div className="flex-shrink-0">
                    <div className={cn(
                      "h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold shadow-lg ring-2 ring-white/20 dark:ring-white/10",
                      getAvatarColor(msg.sender)
                    )}>
                      {msg.sender[0].toUpperCase()}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {typingUsers.length > 0 && (
            <div className="flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="h-10 w-10 rounded-full bg-[#D4FF90]/20 backdrop-blur-md border border-[#D4FF90]/30 flex items-center justify-center text-xs text-[#D4FF90] font-bold">
                ...
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-[#D4FF90] ml-1 font-medium">
                  {typingUsers.join(", ")} {typingUsers.length === 1 ? "is" : "are"} typing
                </span>
                <TypingIndicator />
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#FAFAFA] via-[#FAFAFA]/90 to-transparent dark:from-black dark:via-black/90 dark:to-transparent">
        <div className="max-w-3xl mx-auto">
          
          {replyingTo && (
            <div className="mb-3 flex items-center justify-between px-4 py-3 rounded-2xl bg-[#D4FF90]/10 backdrop-blur-md border border-[#D4FF90]/30 text-foreground dark:text-white text-sm animate-in slide-in-from-bottom-2 duration-200">
              <div className="flex items-center gap-2 truncate">
                <Reply className="w-4 h-4 text-[#D4FF90]" />
                <span className="text-[#D4FF90] font-medium">Replying to {replyingTo.sender}:</span>
                <span className="truncate max-w-[200px] opacity-60">{replyingTo.content.text}</span>
              </div>
              <button 
                onClick={() => setReplyingTo(null)}
                className="p-1.5 hover:bg-[#D4FF90]/20 rounded-full transition-colors text-[#D4FF90]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <form onSubmit={sendMessage} className="relative">
            <div className="flex items-center gap-3 rounded-full bg-white/80 dark:bg-white/5 backdrop-blur-2xl border border-[#D4FF90]/30 p-2 shadow-2xl transition-all duration-300 focus-within:border-[#D4FF90] focus-within:shadow-[#D4FF90]/20 focus-within:scale-[1.01]">
              <Input
                ref={inputRef}
                value={input}
                onChange={handleInputChange}
                placeholder="Type a message..."
                className="flex-1 bg-transparent border-none text-foreground dark:text-white placeholder:text-black/30 dark:placeholder:text-white/30 focus-visible:ring-0 focus-visible:ring-offset-0 px-4 h-12"
              />
              <Button 
                type="submit" 
                disabled={!input.trim()}
                className="rounded-full bg-[#D4FF90] hover:bg-[#D4FF90]/90 disabled:opacity-30 disabled:hover:bg-[#D4FF90] text-black border-none backdrop-blur-md transition-all duration-300 hover:scale-110 active:scale-95 px-6 h-12 font-bold shadow-lg shadow-[#D4FF90]/30"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </form>
        </div>
      </div>

      {showLeaveConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="w-full max-w-sm p-8 rounded-[2rem] bg-white/90 dark:bg-white/5 backdrop-blur-2xl border border-[#D4FF90]/30 shadow-2xl space-y-6 text-center transform scale-100 animate-in zoom-in-95 duration-200">
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-foreground dark:text-white">Leave {groupName}?</h3>
              <p className="text-sm text-black/60 dark:text-white/60">
                You&apos;ll stop receiving messages from this room.
              </p>
            </div>
            
            <div className="flex gap-3">
              <Button 
                className="flex-1 rounded-full bg-[#D4FF90]/10 hover:bg-[#D4FF90]/20 text-foreground dark:text-white border border-[#D4FF90]/30 hover:border-[#D4FF90] transition-all duration-300 h-12"
                onClick={() => setShowLeaveConfirm(false)}
              >
                Stay
              </Button>
              <Button
                className="flex-1 rounded-full bg-[#D4FF90] hover:bg-[#D4FF90]/90 text-black font-bold transition-all duration-300 hover:scale-105 h-12 shadow-lg shadow-[#D4FF90]/20"
                onClick={handleLeaveGroup}
              >
                Leave
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}