'use client';

import { useEffect, useState } from 'react';
import {
  CreditCard,
  Download,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import Badge from '@/components/ui/Badge';
import Skeleton from '@/components/ui/Skeleton';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Order } from '@/types';

export default function PaymentsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrders() {
      try {
        const res = await fetch('/api/dashboard/orders');
        if (res.ok) {
          const data = await res.json();
          setOrders(data.data ?? []);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, []);

  const statusBadge: Record<string, { variant: 'green' | 'yellow' | 'blue' | 'red' | 'purple'; label: string }> = {
    PENDING_PAYMENT: { variant: 'yellow', label: 'Pending' },
    PAID: { variant: 'green', label: 'Paid' },
    IN_PROGRESS: { variant: 'blue', label: 'In Progress' },
    COMPLETED: { variant: 'green', label: 'Completed' },
    REFUNDED: { variant: 'purple', label: 'Refunded' },
    CANCELLED: { variant: 'red', label: 'Cancelled' },
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">Orders & Payments</h1>
        <p className="text-text-secondary mt-1">View your order history and payment status.</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
      ) : orders.length === 0 ? (
        <GlassCard padding="lg">
          <div className="text-center py-16">
            <CreditCard className="h-16 w-16 text-text-tertiary mx-auto mb-4" />
            <h3 className="text-lg font-heading font-semibold">No Orders Yet</h3>
            <p className="text-text-secondary mt-2">Your order history will appear here once you make a purchase.</p>
          </div>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const badge = statusBadge[order.status] ?? statusBadge.PENDING_PAYMENT;

            return (
              <GlassCard key={order.id} padding="md" hover>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="p-2.5 rounded-lg bg-accent-primary/10 shrink-0 self-start">
                    <DollarSign className="h-5 w-5 text-accent-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold">{order.planName}</h3>
                      <Badge variant={badge.variant} size="sm">{badge.label}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-text-tertiary">
                      <span>{order.serviceType.replace('_', ' ')}</span>
                      {order.firmName && <span>{order.firmName}</span>}
                      {order.accountSize && <span>{order.accountSize}</span>}
                      <span>{formatDate(order.createdAt)}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-mono font-bold">{formatCurrency(order.totalAmount)}</p>
                    {order.discountAmount > 0 && (
                      <p className="text-xs text-success">-{formatCurrency(order.discountAmount)} discount</p>
                    )}
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
