'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, MessageSquare, User, Shield, Send } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Textarea from '@/components/ui/Textarea';
import Skeleton from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { ticketReplySchema, type TicketReplyInput } from '@/lib/validations';
import { formatRelativeTime } from '@/lib/utils';
import type { SupportTicket } from '@/types';

export default function TicketDetailPage() {
  const params = useParams();
  const { addToast } = useToast();
  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TicketReplyInput>({
    resolver: zodResolver(ticketReplySchema),
  });

  useEffect(() => {
    async function fetchTicket() {
      try {
        const res = await fetch(`/api/dashboard/tickets/${params.id}`);
        if (res.ok) {
          const data = await res.json();
          setTicket(data.data);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    fetchTicket();
  }, [params.id]);

  const onSubmit = async (data: TicketReplyInput) => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/dashboard/tickets/${params.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const result = await res.json();
        setTicket(result.data);
        addToast('Reply sent.', 'success');
        reset();
      } else {
        addToast('Failed to send reply.', 'error');
      }
    } catch {
      addToast('Something went wrong.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="text-center py-20">
        <MessageSquare className="h-16 w-16 text-text-tertiary mx-auto mb-4" />
        <h2 className="text-xl font-heading font-semibold">Ticket Not Found</h2>
        <Link href="/dashboard/support" className="mt-4 inline-block">
          <Button variant="secondary">Back to Support</Button>
        </Link>
      </div>
    );
  }

  const statusBadge: Record<string, 'yellow' | 'blue' | 'green' | 'default'> = {
    OPEN: 'yellow',
    IN_PROGRESS: 'blue',
    RESOLVED: 'green',
    CLOSED: 'default',
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/support">
          <Button variant="ghost" size="sm" icon={<ArrowLeft className="h-4 w-4" />}>Back</Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-heading font-bold">{ticket.subject}</h1>
            <Badge variant={statusBadge[ticket.status] ?? 'default'}>{ticket.status.replace('_', ' ')}</Badge>
          </div>
          <p className="text-xs text-text-tertiary mt-1">Created {formatRelativeTime(ticket.createdAt)}</p>
        </div>
      </div>

      {/* Original Message */}
      <GlassCard padding="md">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-full bg-accent-primary/10 shrink-0">
            <User className="h-4 w-4 text-accent-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">You</p>
            <p className="text-sm text-text-secondary mt-1 whitespace-pre-wrap">{ticket.message}</p>
          </div>
        </div>
      </GlassCard>

      {/* Responses */}
      {ticket.responses?.map((response, i) => (
        <GlassCard key={i} padding="md" variant={response.sender === 'admin' ? 'strong' : 'default'}>
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-full shrink-0 ${response.sender === 'admin' ? 'bg-accent-gold/10' : 'bg-accent-primary/10'}`}>
              {response.sender === 'admin' ? (
                <Shield className="h-4 w-4 text-accent-gold" />
              ) : (
                <User className="h-4 w-4 text-accent-primary" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">{response.senderName}</p>
                {response.sender === 'admin' && <Badge variant="gold" size="sm">Staff</Badge>}
              </div>
              <p className="text-sm text-text-secondary mt-1 whitespace-pre-wrap">{response.message}</p>
              <p className="text-xs text-text-tertiary mt-2">{formatRelativeTime(response.timestamp)}</p>
            </div>
          </div>
        </GlassCard>
      ))}

      {/* Reply Form */}
      {ticket.status !== 'CLOSED' && (
        <GlassCard padding="md">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <Textarea
              placeholder="Type your reply..."
              rows={3}
              error={errors.message?.message}
              {...register('message')}
            />
            <div className="flex justify-end">
              <Button
                type="submit"
                variant="primary"
                size="sm"
                loading={submitting}
                icon={<Send className="h-4 w-4" />} iconPosition="right"
              >
                Send Reply
              </Button>
            </div>
          </form>
        </GlassCard>
      )}
    </div>
  );
}
