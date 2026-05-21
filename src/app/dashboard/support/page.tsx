'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { HeadphonesIcon, Plus, MessageSquare, Clock, CheckCircle } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Skeleton from '@/components/ui/Skeleton';
import useToast from '@/hooks/useToast';
import { createTicketSchema } from '@/lib/validations';
import type { z } from 'zod';

type CreateTicketForm = z.input<typeof createTicketSchema>;
import { formatRelativeTime } from '@/lib/utils';
import type { SupportTicket } from '@/types';

const statusBadge: Record<string, { variant: 'yellow' | 'blue' | 'green' | 'default'; label: string }> = {
  OPEN: { variant: 'yellow', label: 'Open' },
  IN_PROGRESS: { variant: 'blue', label: 'In Progress' },
  RESOLVED: { variant: 'green', label: 'Resolved' },
  CLOSED: { variant: 'default', label: 'Closed' },
};

export default function SupportPage() {
  const { addToast } = useToast();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateTicketForm>({
    resolver: zodResolver(createTicketSchema),
  });

  useEffect(() => {
    async function fetchTickets() {
      try {
        const res = await fetch('/api/dashboard/tickets');
        if (res.ok) {
          const data = await res.json();
          setTickets(data.data ?? []);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    fetchTickets();
  }, []);

  const onSubmit = async (data: CreateTicketForm) => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/dashboard/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        const result = await res.json();
        setTickets([result.data, ...tickets]);
        addToast('Support ticket created.', 'success');
        reset();
        setShowForm(false);
      } else {
        const err = await res.json();
        addToast(err.error || 'Failed to create ticket.', 'error');
      }
    } catch {
      addToast('Something went wrong.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">Support</h1>
          <p className="text-text-secondary mt-1">Need help? Submit a ticket and we&apos;ll respond quickly.</p>
        </div>
        {!showForm && (
          <Button
            variant="primary"
            size="sm"
            icon={<Plus className="h-4 w-4" />}
            onClick={() => setShowForm(true)}
          >
            New Ticket
          </Button>
        )}
      </div>

      {/* New Ticket Form */}
      {showForm && (
        <GlassCard padding="lg">
          <h3 className="text-lg font-heading font-semibold mb-4">Create Support Ticket</h3>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Subject"
              placeholder="Briefly describe your issue..."
              error={errors.subject?.message}
              {...register('subject')}
            />
            <Select label="Priority" error={errors.priority?.message} {...register('priority')}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </Select>
            <Textarea
              label="Message"
              placeholder="Provide details about your issue..."
              rows={5}
              error={errors.message?.message}
              {...register('message')}
            />
            <div className="flex gap-3">
              <Button type="submit" variant="primary" loading={submitting} fullWidth>
                Submit Ticket
              </Button>
              <Button type="button" variant="ghost" onClick={() => { setShowForm(false); reset(); }}>
                Cancel
              </Button>
            </div>
          </form>
        </GlassCard>
      )}

      {/* Tickets List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
        </div>
      ) : tickets.length === 0 && !showForm ? (
        <GlassCard padding="lg">
          <div className="text-center py-16">
            <HeadphonesIcon className="h-16 w-16 text-text-tertiary mx-auto mb-4" />
            <h3 className="text-lg font-heading font-semibold">No Support Tickets</h3>
            <p className="text-text-secondary mt-2">Create a ticket if you need help with anything.</p>
          </div>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => {
            const badge = statusBadge[ticket.status] ?? statusBadge.OPEN;
            return (
              <Link key={ticket.id} href={`/dashboard/support/${ticket.id}`}>
                <GlassCard padding="md" hover>
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-accent-primary/10 shrink-0">
                      <MessageSquare className="h-5 w-5 text-accent-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium text-sm truncate">{ticket.subject}</h3>
                        <Badge variant={badge.variant} size="sm">{badge.label}</Badge>
                        <Badge variant={ticket.priority === 'urgent' ? 'red' : ticket.priority === 'high' ? 'yellow' : 'default'} size="sm">
                          {ticket.priority}
                        </Badge>
                      </div>
                      <p className="text-xs text-text-tertiary mt-0.5 line-clamp-1">{ticket.message}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-text-tertiary">{formatRelativeTime(ticket.createdAt)}</p>
                      <p className="text-xs text-text-tertiary mt-0.5">
                        {ticket.responses?.length ?? 0} replies
                      </p>
                    </div>
                  </div>
                </GlassCard>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
