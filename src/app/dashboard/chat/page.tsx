'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Loader2, MessageCircle, Shield } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import Avatar from '@/components/ui/Avatar';
import useAuth from '@/hooks/useAuth';
import useToast from '@/hooks/useToast';

interface Message {
  id: string;
  senderId: string;
  senderRole: string;
  body: string;
  read: boolean;
  createdAt: string;
}

interface Conversation {
  id: string;
  subject: string | null;
  lastMessage: string | null;
  isClosed: boolean;
}

function timeLabel(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60_000) return 'Just now';
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86400_000) return `${Math.floor(diff / 3600_000)}h ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export default function UserChatPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const scrollToBottom = () => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const fetchChat = useCallback(async (silent = false) => {
    try {
      // First get conversations
      const convRes = await fetch('/api/dashboard/chat');
      if (!convRes.ok) return;
      const convData = await convRes.json();
      const convs = convData.data ?? [];

      if (convs.length > 0) {
        const conv = convs[0]; // User's active conversation
        setConversation(conv);

        const msgRes = await fetch(`/api/dashboard/chat/${conv.id}`);
        if (msgRes.ok) {
          const msgData = await msgRes.json();
          setMessages(msgData.data?.messages ?? []);
          if (!silent) scrollToBottom();
        }
      }
    } catch { /* silent */ }
    finally { if (!silent) setLoading(false); }
  }, []);

  useEffect(() => {
    fetchChat();
    // Poll every 5 seconds for new messages
    pollRef.current = setInterval(() => fetchChat(true), 5000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchChat]);

  useEffect(() => { scrollToBottom(); }, [messages.length]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;

    setSending(true);
    try {
      if (conversation) {
        // Send to existing conversation
        const res = await fetch(`/api/dashboard/chat/${conversation.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text }),
        });
        if (res.ok) {
          setInput('');
          fetchChat(true);
        }
      } else {
        // Create new conversation
        const res = await fetch('/api/dashboard/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text, subject: 'General Inquiry' }),
        });
        if (res.ok) {
          setInput('');
          fetchChat();
        }
      }
    } catch {
      addToast('Failed to send message', 'error');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-accent-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-heading font-bold flex items-center gap-2">
          <MessageCircle className="h-6 w-6 text-accent-primary" />
          Messages
        </h1>
        <p className="text-text-secondary mt-1">Chat with our team directly</p>
      </div>

      {/* Chat container */}
      <GlassCard padding="none" className="flex-1 flex flex-col overflow-hidden">
        {/* Chat header */}
        <div className="px-4 py-3 border-b border-white/[0.06] flex items-center gap-3">
          <div className="p-2 rounded-xl bg-accent-primary/10">
            <Shield className="h-5 w-5 text-accent-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold">The Market Architects</p>
            <p className="text-xs text-text-tertiary">Support Team</p>
          </div>
          {conversation?.isClosed && (
            <span className="ml-auto text-xs text-text-tertiary bg-white/[0.04] px-2 py-1 rounded-lg">Closed</span>
          )}
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <MessageCircle className="h-12 w-12 text-text-tertiary mb-3" />
              <p className="text-text-secondary font-medium">Start a conversation</p>
              <p className="text-xs text-text-tertiary mt-1">
                Send us a message and our team will respond as soon as possible.
              </p>
            </div>
          )}

          {messages.map((msg) => {
            const isUser = msg.senderRole === 'USER';
            return (
              <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex items-end gap-2 max-w-[80%] ${isUser ? 'flex-row-reverse' : ''}`}>
                  {!isUser && (
                    <Avatar name="TMA" size="xs" />
                  )}
                  <div>
                    <div
                      className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        isUser
                          ? 'bg-accent-primary text-white rounded-br-md'
                          : 'bg-white/[0.06] text-text-primary rounded-bl-md'
                      }`}
                    >
                      {msg.body}
                    </div>
                    <p className={`text-[10px] text-text-tertiary mt-1 ${isUser ? 'text-right' : ''}`}>
                      {timeLabel(msg.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        {!conversation?.isClosed && (
          <div className="border-t border-white/[0.06] px-4 py-3">
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                rows={1}
                className="flex-1 resize-none bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white placeholder-text-tertiary focus:outline-none focus:border-accent-primary/50 transition-colors max-h-32"
                style={{ minHeight: '42px' }}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || sending}
                className="p-2.5 rounded-xl bg-accent-primary text-white hover:bg-accent-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0"
              >
                {sending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
