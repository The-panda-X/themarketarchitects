'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, User, Shield, Send, Pencil, Trash2, X, Save, Loader2 } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Textarea from '@/components/ui/Textarea';
import Select from '@/components/ui/Select';
import Skeleton from '@/components/ui/Skeleton';
import Modal from '@/components/ui/Modal';
import useToast from '@/hooks/useToast';
import useAuth from '@/hooks/useAuth';
import { formatRelativeTime } from '@/lib/utils';

interface TicketResponse {
  sender: string;
  senderName: string;
  senderId?: string;
  message: string;
  timestamp: string;
  edited?: boolean;
  editedAt?: string;
}

interface TicketDetail {
  id: string;
  subject: string;
  message: string;
  priority: string;
  status: string;
  createdAt: string;
  user: { id: string; email: string; name: string | null };
  responses: TicketResponse[];
}

const statusVariant: Record<string, 'yellow' | 'blue' | 'green' | 'default'> = {
  OPEN: 'yellow',
  IN_PROGRESS: 'blue',
  RESOLVED: 'green',
  CLOSED: 'default',
};

export default function AdminTicketDetailPage() {
  const params = useParams();
  const { addToast } = useToast();
  const { isHeadAdmin } = useAuth();
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState('');
  const [replyStatus, setReplyStatus] = useState('IN_PROGRESS');
  const [submitting, setSubmitting] = useState(false);

  // Edit/Delete state
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/tickets/${params.id}`)
      .then((r) => r.json())
      .then((d) => { setTicket(d.data); setReplyStatus(d.data?.status ?? 'IN_PROGRESS'); })
      .finally(() => setLoading(false));
  }, [params.id]);

  const handleReply = async () => {
    if (!reply.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/tickets/${params.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: reply, status: replyStatus }),
      });
      if (res.ok) {
        const d = await res.json();
        setTicket((prev) => prev ? { ...prev, ...d.data, user: d.data?.user ?? prev.user } : d.data);
        setReply('');
        addToast('Reply sent.', 'success');
      } else {
        addToast('Failed to send reply.', 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveEdit = async () => {
    if (editingIndex === null || !editDraft.trim()) return;
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/admin/tickets/${params.id}/messages/${editingIndex}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: editDraft.trim() }),
      });
      if (res.ok) {
        const d = await res.json();
        setTicket((prev) => prev ? { ...prev, ...d.data, user: d.data?.user ?? prev.user } : d.data);
        setEditingIndex(null);
        setEditDraft('');
        addToast('Message edited.', 'success');
      } else {
        const d = await res.json();
        addToast(d.error ?? 'Failed to edit message.', 'error');
      }
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async () => {
    if (deleteIndex === null) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/tickets/${params.id}/messages/${deleteIndex}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        const d = await res.json();
        setTicket((prev) => prev ? { ...prev, ...d.data, user: d.data?.user ?? prev.user } : d.data);
        setDeleteIndex(null);
        addToast('Message deleted.', 'success');
      } else {
        const d = await res.json();
        addToast(d.error ?? 'Failed to delete message.', 'error');
      }
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return (
    <div className="space-y-4 max-w-3xl">
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-32 rounded-2xl" />
      <Skeleton className="h-48 rounded-2xl" />
    </div>
  );

  if (!ticket) return <p className="text-text-secondary">Ticket not found.</p>;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Link href="/admin/tickets">
          <Button variant="ghost" size="sm" icon={<ArrowLeft className="h-4 w-4" />}>Tickets</Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-heading font-bold">{ticket.subject}</h1>
            <Badge variant={statusVariant[ticket.status] ?? 'default'}>{ticket.status.replace('_', ' ')}</Badge>
            <Badge variant="default" size="sm">{ticket.priority}</Badge>
          </div>
          <Link href={`/admin/users/${ticket.user.id}`} className="text-xs text-accent-primary hover:underline mt-1 block">
            {ticket.user.email} {ticket.user.name ? `(${ticket.user.name})` : ''}
          </Link>
        </div>
      </div>

      {/* Original Message */}
      <GlassCard padding="md">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-full bg-accent-primary/10 shrink-0">
            <User className="h-4 w-4 text-accent-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium">{ticket.user.name ?? ticket.user.email}</p>
              <span className="text-xs text-text-tertiary">{formatRelativeTime(ticket.createdAt)}</span>
            </div>
            <p className="text-sm text-text-secondary mt-1 whitespace-pre-wrap">{ticket.message}</p>
          </div>
        </div>
      </GlassCard>

      {/* Responses */}
      {ticket.responses.map((resp, i) => {
        const isEditing = editingIndex === i;
        return (
          <GlassCard key={i} padding="md" variant={resp.sender === 'admin' ? 'strong' : 'default'}>
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-full shrink-0 ${resp.sender === 'admin' ? 'bg-accent-gold/10' : 'bg-accent-primary/10'}`}>
                {resp.sender === 'admin' ? (
                  <Shield className="h-4 w-4 text-accent-gold" />
                ) : (
                  <User className="h-4 w-4 text-accent-primary" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium">{resp.senderName}</p>
                  {resp.sender === 'admin' && <Badge variant="gold" size="sm">Staff</Badge>}
                  <span className="text-xs text-text-tertiary">{formatRelativeTime(resp.timestamp)}</span>
                  {resp.edited && (
                    <span className="text-[10px] text-text-tertiary italic">(edited)</span>
                  )}
                  {isHeadAdmin && !isEditing && (
                    <div className="ml-auto flex items-center gap-1">
                      <button
                        onClick={() => { setEditingIndex(i); setEditDraft(resp.message); }}
                        className="p-1 rounded text-text-tertiary hover:text-text-primary hover:bg-white/[0.04] transition-colors"
                        title="Edit message"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteIndex(i)}
                        className="p-1 rounded text-text-tertiary hover:text-danger hover:bg-danger/5 transition-colors"
                        title="Delete message"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {isEditing ? (
                  <div className="mt-2 space-y-2">
                    <Textarea
                      value={editDraft}
                      onChange={(e) => setEditDraft(e.target.value)}
                      rows={3}
                      autoFocus
                    />
                    <div className="flex items-center gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        loading={savingEdit}
                        onClick={handleSaveEdit}
                        icon={<Save className="h-3.5 w-3.5" />}
                      >
                        Save
                      </Button>
                      <button
                        onClick={() => { setEditingIndex(null); setEditDraft(''); }}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-text-secondary hover:text-text-primary hover:bg-white/[0.04] transition-colors"
                      >
                        <X className="h-3.5 w-3.5" /> Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-text-secondary mt-1 whitespace-pre-wrap">{resp.message}</p>
                )}
              </div>
            </div>
          </GlassCard>
        );
      })}

      {/* Reply */}
      {ticket.status !== 'CLOSED' && (
        <GlassCard padding="md">
          <h3 className="text-sm font-semibold mb-3">Admin Reply</h3>
          <div className="space-y-3">
            <Textarea
              placeholder="Type your reply to the user..."
              rows={4}
              value={reply}
              onChange={(e) => setReply(e.target.value)}
            />
            <div className="flex items-center gap-3">
              <Select
                value={replyStatus}
                onChange={(e) => setReplyStatus(e.target.value)}
                className="w-44"
              >
                <option value="IN_PROGRESS">Set In Progress</option>
                <option value="RESOLVED">Mark Resolved</option>
                <option value="CLOSED">Close Ticket</option>
              </Select>
              <Button
                variant="primary"
                size="sm"
                loading={submitting}
                onClick={handleReply}
                icon={<Send className="h-4 w-4" />}
                iconPosition="right"
              >
                Send Reply
              </Button>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Delete confirmation modal */}
      <Modal isOpen={deleteIndex !== null} onClose={() => setDeleteIndex(null)} title="Delete Reply" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            Delete this reply? This action is logged but cannot be undone.
          </p>
          {deleteIndex !== null && ticket.responses[deleteIndex] && (
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <p className="text-xs text-text-tertiary">From {ticket.responses[deleteIndex].senderName}:</p>
              <p className="text-sm text-text-secondary mt-1 line-clamp-3">{ticket.responses[deleteIndex].message}</p>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <button onClick={() => setDeleteIndex(null)} className="px-4 py-2 rounded-xl text-sm text-text-secondary hover:bg-white/[0.04]">Cancel</button>
            <button onClick={handleDelete} disabled={deleting} className="flex items-center gap-2 px-5 py-2 rounded-xl bg-danger text-white text-sm font-medium disabled:opacity-40">
              {deleting && <Loader2 className="h-4 w-4 animate-spin" />} Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
