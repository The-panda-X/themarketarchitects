'use client';

import { useEffect, useState, useCallback } from 'react';
import GlassCard from '@/components/ui/GlassCard';
import Badge from '@/components/ui/Badge';
import Select from '@/components/ui/Select';
import Skeleton from '@/components/ui/Skeleton';
import {
  Table, TableHeader, TableBody, TableRow, TableHead,
  TableCell, TableEmpty, TablePagination,
} from '@/components/ui/Table';
import { formatRelativeTime } from '@/lib/utils';

interface TicketRow {
  id: string;
  subject: string;
  priority: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  user: { email: string; name: string | null };
  responses: unknown[];
}

const statusVariant: Record<string, 'yellow' | 'blue' | 'green' | 'default'> = {
  OPEN: 'yellow',
  IN_PROGRESS: 'blue',
  RESOLVED: 'green',
  CLOSED: 'default',
};

const priorityVariant: Record<string, 'red' | 'yellow' | 'default'> = {
  urgent: 'red',
  high: 'yellow',
  medium: 'default',
  low: 'default',
};

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (status) params.set('status', status);
      const res = await fetch(`/api/admin/tickets?${params}`);
      if (res.ok) {
        const d = await res.json();
        setTickets(d.data.data ?? []);
        setTotalPages(d.data.totalPages ?? 1);
        setTotal(d.data.total ?? 0);
      }
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);
  useEffect(() => { setPage(1); }, [status]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">Support Tickets</h1>
        <p className="text-text-secondary mt-1">{total} total tickets</p>
      </div>

      <GlassCard padding="md">
        <div className="mb-4 w-48">
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </Select>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow hoverable={false}>
                  <TableHead>Subject</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead align="center">Replies</TableHead>
                  <TableHead>Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.length === 0 ? (
                  <TableEmpty colSpan={6} message="No tickets found" />
                ) : (
                  tickets.map((ticket) => (
                    <TableRow key={ticket.id} onClick={() => window.location.href = `/admin/tickets/${ticket.id}`}>
                      <TableCell className="font-medium text-text-primary max-w-xs truncate">{ticket.subject}</TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">{ticket.user.name ?? '—'}</p>
                          <p className="text-xs text-text-tertiary">{ticket.user.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={priorityVariant[ticket.priority] ?? 'default'} size="sm">
                          {ticket.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant[ticket.status] ?? 'default'} size="sm">
                          {ticket.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell align="center">{(ticket.responses as unknown[]).length}</TableCell>
                      <TableCell>{formatRelativeTime(ticket.updatedAt)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <TablePagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
      </GlassCard>
    </div>
  );
}
