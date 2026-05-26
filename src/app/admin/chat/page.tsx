'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Send,
  Loader2,
  MessageCircle,
  Search,
  XCircle,
  CheckCircle,
  ArrowLeft,
  Plus,
  X,
} from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import Avatar from '@/components/ui/Avatar';
import Modal from '@/components/ui/Modal';
import useAuth from '@/hooks/useAuth';
import useToast from '@/hooks/useToast';

interface ConversationWithUser {
  id: string;
  userId: string;
  subject: string | null;
  lastMessage: string | null;
  lastAt: string;
  userUnread: number;
  staffUnread: number;
  isClosed: boolean;
  user: { id: string; name: string | null; email: string; image: string | null };
}

interface Message {
  id: string;
  senderId: string;
  senderRole: string;
  body: string;
  read: boolean;
  createdAt: string;
}

interface SearchUser {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  if (diff < 60_000) return 'now';
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)}m`;
  if (diff < 86400_000) return `${Math.floor(diff / 3600_000)}h`;
  const days = Math.floor(diff / 86400_000);
  return days < 7 ? `${days}d` : new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function fullTime(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60_000) return 'Just now';
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86400_000) return `${Math.floor(diff / 3600_000)}h ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export default function AdminChatPage() {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [conversations, setConversations] = useState<ConversationWithUser[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeConv, setActiveConv] = useState<ConversationWithUser | null>(null);

  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [msgLoading, setMsgLoading] = useState(false);
  const [sending, setSending] = useState(false);

  // New chat modal state
  const [showNewChat, setShowNewChat] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SearchUser | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [startingSending, setStartingSending] = useState(false);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const scrollToBottom = () => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  // Fetch all conversations
  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/chat');
      if (res.ok) {
        const data = await res.json();
        setConversations(data.data ?? []);
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  // Fetch messages for active conversation
  const fetchMessages = useCallback(async (convId: string, silent = false) => {
    if (!silent) setMsgLoading(true);
    try {
      const res = await fetch(`/api/admin/chat/${convId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.data?.messages ?? []);
        setActiveConv(data.data?.conversation ?? null);
        if (!silent) scrollToBottom();
      }
    } catch { /* silent */ }
    finally { if (!silent) setMsgLoading(false); }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Poll for updates — pause when tab is hidden
  useEffect(() => {
    const poll = () => {
      fetchConversations();
      if (activeId) fetchMessages(activeId, true);
    };
    const startPoll = () => {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(poll, 5000);
    };
    const stopPoll = () => {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    };
    const handleVisibility = () => {
      if (document.hidden) stopPoll();
      else { poll(); startPoll(); }
    };

    startPoll();
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      stopPoll();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [activeId, fetchConversations, fetchMessages]);

  useEffect(() => { scrollToBottom(); }, [messages.length]);

  const openConversation = (conv: ConversationWithUser) => {
    setActiveId(conv.id);
    setActiveConv(conv);
    fetchMessages(conv.id);
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending || !activeId) return;

    setSending(true);
    try {
      const res = await fetch(`/api/admin/chat/${activeId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });
      if (res.ok) {
        setInput('');
        fetchMessages(activeId, true);
        fetchConversations();
      }
    } catch {
      addToast('Failed to send message', 'error');
    } finally {
      setSending(false);
    }
  };

  const toggleClose = async () => {
    if (!activeId || !activeConv) return;
    try {
      await fetch(`/api/admin/chat/${activeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isClosed: !activeConv.isClosed }),
      });
      fetchMessages(activeId, true);
      fetchConversations();
      addToast(activeConv.isClosed ? 'Conversation reopened' : 'Conversation closed', 'success');
    } catch {
      addToast('Failed to update conversation', 'error');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── New Chat: search users with debounce ──
  useEffect(() => {
    if (!userSearch.trim()) {
      setSearchResults([]);
      return;
    }

    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);

    searchTimerRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await fetch(`/api/admin/users?search=${encodeURIComponent(userSearch.trim())}&limit=10`);
        if (res.ok) {
          const data = await res.json();
          // The API returns { data: { data: users[], ... } }
          const rawUsers = data.data?.data ?? [];
          // Filter to only regular users (not staff)
          const users: SearchUser[] = rawUsers
            .filter((u: { role?: string }) => u.role === 'USER')
            .map((u: { id: string; name: string | null; email: string; avatar: string | null }) => ({
              id: u.id,
              name: u.name,
              email: u.email,
              image: u.avatar,
            }));
          setSearchResults(users);
        }
      } catch { /* silent */ }
      finally { setSearchLoading(false); }
    }, 300);

    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [userSearch]);

  const handleStartConversation = async () => {
    if (!selectedUser || !newMessage.trim()) return;

    setStartingSending(true);
    try {
      const res = await fetch('/api/admin/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUser.id, message: newMessage.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        const convId = data.data?.conversationId;

        // Reset modal state
        setShowNewChat(false);
        setUserSearch('');
        setSearchResults([]);
        setSelectedUser(null);
        setNewMessage('');

        // Refresh conversations and open the new one
        await fetchConversations();
        if (convId) {
          setActiveId(convId);
          fetchMessages(convId);
        }
        addToast('Message sent', 'success');
      } else {
        const errData = await res.json().catch(() => null);
        addToast(errData?.error || 'Failed to start conversation', 'error');
      }
    } catch {
      addToast('Failed to start conversation', 'error');
    } finally {
      setStartingSending(false);
    }
  };

  const closeNewChatModal = () => {
    setShowNewChat(false);
    setUserSearch('');
    setSearchResults([]);
    setSelectedUser(null);
    setNewMessage('');
  };

  const filteredConvs = conversations.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.user?.name?.toLowerCase().includes(q) ||
      c.user?.email?.toLowerCase().includes(q) ||
      c.lastMessage?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="h-[calc(100vh-8rem)]">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold flex items-center gap-2">
            <MessageCircle className="h-6 w-6 text-accent-primary" />
            Chat
          </h1>
          <p className="text-text-secondary mt-1">Direct messaging with users</p>
        </div>
        <button
          onClick={() => setShowNewChat(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent-primary text-white text-sm font-medium hover:bg-accent-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Chat
        </button>
      </div>

      <div className="flex gap-4 h-[calc(100%-3.5rem)]">
        {/* Conversation list */}
        <GlassCard
          padding="none"
          flexCol
          className={`w-full md:w-80 shrink-0 flex flex-col overflow-hidden ${
            activeId ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Search */}
          <div className="p-3 border-b border-white/[0.06]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white placeholder-text-tertiary focus:outline-none focus:border-accent-primary/50"
              />
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-5 w-5 animate-spin text-accent-primary" />
              </div>
            ) : filteredConvs.length === 0 ? (
              <div className="text-center py-10 px-4">
                <MessageCircle className="h-8 w-8 text-text-tertiary mx-auto mb-2" />
                <p className="text-sm text-text-secondary">No conversations yet</p>
                <p className="text-xs text-text-tertiary mt-1">
                  Click &quot;New Chat&quot; to message a user
                </p>
              </div>
            ) : (
              filteredConvs.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => openConversation(conv)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.03] transition-colors border-b border-white/[0.03] ${
                    activeId === conv.id ? 'bg-white/[0.05]' : ''
                  }`}
                >
                  <Avatar src={conv.user?.image} name={conv.user?.name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-text-primary truncate">
                        {conv.user?.name || conv.user?.email || 'Unknown'}
                      </p>
                      <span className="text-[10px] text-text-tertiary shrink-0 ml-2">
                        {timeAgo(conv.lastAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs text-text-tertiary truncate flex-1">
                        {conv.lastMessage || 'No messages'}
                      </p>
                      {conv.staffUnread > 0 && (
                        <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-accent-primary text-[10px] font-bold text-white shrink-0">
                          {conv.staffUnread}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </GlassCard>

        {/* Chat panel */}
        <GlassCard
          padding="none"
          flexCol
          className={`flex-1 flex flex-col overflow-hidden ${
            !activeId ? 'hidden md:flex' : 'flex'
          }`}
        >
          {!activeId ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <MessageCircle className="h-12 w-12 text-text-tertiary mb-3" />
              <p className="text-text-secondary font-medium">Select a conversation</p>
              <p className="text-xs text-text-tertiary mt-1">
                Choose a conversation from the left or start a new chat
              </p>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="px-4 py-3 border-b border-white/[0.06] flex items-center gap-3">
                <button
                  onClick={() => setActiveId(null)}
                  className="md:hidden p-1.5 rounded-lg hover:bg-white/[0.04] text-text-secondary"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <Avatar
                  src={activeConv?.user?.image}
                  name={activeConv?.user?.name}
                  size="sm"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">
                    {activeConv?.user?.name || 'Unknown'}
                  </p>
                  <p className="text-xs text-text-tertiary truncate">
                    {activeConv?.user?.email}
                  </p>
                </div>
                <button
                  onClick={toggleClose}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    activeConv?.isClosed
                      ? 'text-green-400 hover:bg-green-500/10'
                      : 'text-text-tertiary hover:bg-white/[0.04]'
                  }`}
                >
                  {activeConv?.isClosed ? (
                    <>
                      <CheckCircle className="h-3.5 w-3.5" /> Reopen
                    </>
                  ) : (
                    <>
                      <XCircle className="h-3.5 w-3.5" /> Close
                    </>
                  )}
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {msgLoading ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="h-5 w-5 animate-spin text-accent-primary" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-10 text-xs text-text-tertiary">
                    No messages yet
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isStaff = msg.senderRole !== 'USER';
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isStaff ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`flex items-end gap-2 max-w-[75%] ${
                            isStaff ? 'flex-row-reverse' : ''
                          }`}
                        >
                          {!isStaff && (
                            <Avatar
                              src={activeConv?.user?.image}
                              name={activeConv?.user?.name}
                              size="xs"
                            />
                          )}
                          <div>
                            {isStaff && (
                              <p
                                className={`text-[10px] text-text-tertiary mb-0.5 text-right`}
                              >
                                {msg.senderRole === 'HEAD_ADMIN'
                                  ? 'Admin'
                                  : msg.senderRole === 'ADMIN'
                                  ? 'Admin'
                                  : 'Support'}
                              </p>
                            )}
                            <div
                              className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                                isStaff
                                  ? 'bg-accent-primary text-white rounded-br-md'
                                  : 'bg-white/[0.06] text-text-primary rounded-bl-md'
                              }`}
                            >
                              {msg.body}
                            </div>
                            <p
                              className={`text-[10px] text-text-tertiary mt-1 ${
                                isStaff ? 'text-right' : ''
                              }`}
                            >
                              {fullTime(msg.createdAt)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
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
            </>
          )}
        </GlassCard>
      </div>

      {/* ── New Chat Modal ── */}
      <Modal isOpen={showNewChat} onClose={closeNewChatModal} title="New Conversation" size="md">
        <div className="space-y-4">
          {/* Step 1: Search & select user */}
          {!selectedUser ? (
            <>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  Search for a user
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    autoFocus
                    className="w-full pl-9 pr-3 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder-text-tertiary focus:outline-none focus:border-accent-primary/50 transition-colors"
                  />
                </div>
              </div>

              {/* Search results */}
              <div className="max-h-64 overflow-y-auto rounded-xl border border-white/[0.06]">
                {searchLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-accent-primary" />
                  </div>
                ) : !userSearch.trim() ? (
                  <div className="text-center py-8 px-4">
                    <Search className="h-6 w-6 text-text-tertiary mx-auto mb-2" />
                    <p className="text-xs text-text-tertiary">
                      Type a name or email to search
                    </p>
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="text-center py-8 px-4">
                    <p className="text-sm text-text-secondary">No users found</p>
                    <p className="text-xs text-text-tertiary mt-1">
                      Try a different search term
                    </p>
                  </div>
                ) : (
                  searchResults.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => setSelectedUser(u)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.04] transition-colors border-b border-white/[0.04] last:border-b-0"
                    >
                      <Avatar src={u.image} name={u.name} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate">
                          {u.name || 'No Name'}
                        </p>
                        <p className="text-xs text-text-tertiary truncate">{u.email}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </>
          ) : (
            /* Step 2: Compose message */
            <>
              {/* Selected user card */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                <Avatar src={selectedUser.image} name={selectedUser.name} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">
                    {selectedUser.name || 'No Name'}
                  </p>
                  <p className="text-xs text-text-tertiary truncate">{selectedUser.email}</p>
                </div>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="p-1.5 rounded-lg hover:bg-white/[0.06] text-text-tertiary hover:text-text-secondary transition-colors"
                  title="Change user"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Message input */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  Message
                </label>
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  rows={3}
                  autoFocus
                  className="w-full resize-none bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white placeholder-text-tertiary focus:outline-none focus:border-accent-primary/50 transition-colors"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleStartConversation();
                    }
                  }}
                />
              </div>

              {/* Send button */}
              <div className="flex justify-end gap-2">
                <button
                  onClick={closeNewChatModal}
                  className="px-4 py-2 rounded-xl text-sm text-text-secondary hover:text-text-primary hover:bg-white/[0.04] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStartConversation}
                  disabled={!newMessage.trim() || startingSending}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-accent-primary text-white text-sm font-medium hover:bg-accent-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  {startingSending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Send Message
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
