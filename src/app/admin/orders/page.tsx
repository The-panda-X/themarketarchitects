'use client';

import { useEffect, useState, useCallback } from 'react';
import { Search } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import Select from '@/components/ui/Select';
import Skeleton from '@/components/ui/Skeleton';
import {
  Table, TableHeader, TableBody, TableRow, TableHead,
  TableCell, TableEmpty, TablePagination,
} from '@/components/ui/Table';
import { formatDate } from '@/lib/utils';

interface OrderRow {
  id: string;
  planName: string;
  serviceType: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  user: { id: string; email: string; name: string | null };
}

const statusVariant: Record<string, 'yellow' | 'blue' | 'green' | 'red' | 'default'> = {
  PENDING_PAYMENT: 'yellow',
  PAID: 'blue',
  IN_PROGRESS: 'blue',
  COMPLETED: 'green',
  REFUNDED: 'red',
  CANCELLED: 'default',
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('search', search);
      if (status) params.set('status', status);
      const res = await fetch(`/api/admin/orders?${params}`);
      if (res.ok) {
        const d = await res.json();
        setOrders(d.data.data ?? []);
        setTotalPages(d.data.totalPages ?? 1);
        setTotal(d.data.total ?? 0);
      }
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);
  useEffect(() => { setPage(1); }, [search, status]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">Orders</h1>
        <p className="text-text-secondary mt-1">{total} total orders</p>
      </div>

      <GlassCard padding="md">
        <div className="flex gap-3 mb-4">
          <div className="flex-1">
            <Input
              placeholder="Search by plan or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<Search className="h-4 w-4" />}
            />
          </div>
          <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-48">
            <option value="">All Statuses</option>
            <option value="PENDING_PAYMENT">Pending Payment</option>
            <option value="PAID">Paid</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="REFUNDED">Refunded</option>
            <option value="CANCELLED">Cancelled</option>
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
                  <TableHead>Customer</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.length === 0 ? (
                  <TableEmpty colSpan={6} message="No orders found" />
                ) : (
                  orders.map((order) => (
                    <TableRow key={order.id} onClick={() => window.location.href = `/admin/orders/${order.id}`}>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium text-text-primary">{order.user.name ?? '—'}</p>
                          <p className="text-xs text-text-tertiary">{order.user.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-text-primary">{order.planName}</TableCell>
                      <TableCell>
                        <Badge variant="default" size="sm">{order.serviceType.replace('_', ' ')}</Badge>
                      </TableCell>
                      <TableCell mono>${order.totalAmount.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariant[order.status] ?? 'default'} size="sm">
                          {order.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(order.createdAt)}</TableCell>
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
