'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, User, KeyRound } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import Skeleton from '@/components/ui/Skeleton';
import useToast from '@/hooks/useToast';
import { formatDate } from '@/lib/utils';

interface OrderDetail {
  id: string;
  planName: string;
  serviceType: string;
  accountSize: string | null;
  firmName: string | null;
  status: string;
  totalAmount: number;
  discountAmount: number;
  couponCode: string | null;
  notes: string | null;
  createdAt: string;
  user: { id: string; email: string; name: string | null };
  payments: Array<{ id: string; amount: number; method: string; status: string; createdAt: string }>;
  credentials: Array<{ id: string; platform: string; server: string | null; loginId: string; submittedAt: string }>;
}

const ORDER_STATUSES = ['PENDING_PAYMENT', 'PAID', 'IN_PROGRESS', 'COMPLETED', 'REFUNDED', 'CANCELLED'];

export default function AdminOrderDetailPage() {
  const params = useParams();
  const { addToast } = useToast();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [newStatus, setNewStatus] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/orders/${params.id}`)
      .then((r) => r.json())
      .then((d) => { setOrder(d.data); setNewStatus(d.data?.status ?? ''); })
      .finally(() => setLoading(false));
  }, [params.id]);

  const handleStatusUpdate = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/orders/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setOrder((prev) => prev ? { ...prev, status: newStatus } : prev);
        addToast('Order status updated.', 'success');
      } else {
        addToast('Failed to update status.', 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="space-y-4 max-w-3xl">
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-48 rounded-2xl" />
    </div>
  );

  if (!order) return <p className="text-text-secondary">Order not found.</p>;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Link href="/admin/orders">
          <Button variant="ghost" size="sm" icon={<ArrowLeft className="h-4 w-4" />}>Orders</Button>
        </Link>
        <h1 className="text-xl font-heading font-bold flex-1">{order.planName}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Order Info */}
        <GlassCard padding="lg">
          <h3 className="font-heading font-semibold mb-4">Order Details</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-text-tertiary">ID</span><span className="font-mono text-xs">{order.id}</span></div>
            <div className="flex justify-between"><span className="text-text-tertiary">Plan</span><span>{order.planName}</span></div>
            <div className="flex justify-between"><span className="text-text-tertiary">Type</span><span>{order.serviceType.replace('_', ' ')}</span></div>
            {order.firmName && <div className="flex justify-between"><span className="text-text-tertiary">Firm</span><span>{order.firmName}</span></div>}
            {order.accountSize && <div className="flex justify-between"><span className="text-text-tertiary">Size</span><span>{order.accountSize}</span></div>}
            <div className="flex justify-between"><span className="text-text-tertiary">Amount</span><span className="font-mono">${order.totalAmount.toFixed(2)}</span></div>
            {order.discountAmount > 0 && <div className="flex justify-between"><span className="text-text-tertiary">Discount</span><span className="text-success">-${order.discountAmount.toFixed(2)}</span></div>}
            {order.couponCode && <div className="flex justify-between"><span className="text-text-tertiary">Coupon</span><span>{order.couponCode}</span></div>}
            <div className="flex justify-between"><span className="text-text-tertiary">Date</span><span>{formatDate(order.createdAt)}</span></div>
          </div>
        </GlassCard>

        {/* Customer + Status */}
        <div className="space-y-4">
          <GlassCard padding="lg">
            <h3 className="font-heading font-semibold mb-3 flex items-center gap-2">
              <User className="h-4 w-4 text-accent-primary" />Customer
            </h3>
            <Link href={`/admin/users/${order.user.id}`} className="text-sm text-accent-primary hover:underline">
              {order.user.email}
            </Link>
            {order.user.name && <p className="text-xs text-text-tertiary mt-1">{order.user.name}</p>}
          </GlassCard>

          <GlassCard padding="lg">
            <h3 className="font-heading font-semibold mb-3">Update Status</h3>
            <div className="space-y-3">
              <Select value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
                {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </Select>
              <Button
                variant="primary"
                size="sm"
                loading={saving}
                onClick={handleStatusUpdate}
                disabled={newStatus === order.status}
                fullWidth
              >
                Save Status
              </Button>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Credentials */}
      {order.credentials.length > 0 && (
        <GlassCard padding="lg">
          <h3 className="font-heading font-semibold mb-4 flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-accent-primary" />Submitted Credentials
          </h3>
          <div className="space-y-2">
            {order.credentials.map((cred) => (
              <div key={cred.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03]">
                <div>
                  <p className="text-sm font-medium">{cred.platform}</p>
                  <p className="text-xs text-text-tertiary">Login: {cred.loginId}{cred.server ? ` • Server: ${cred.server}` : ''}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    const res = await fetch(`/api/admin/credentials/${cred.id}`);
                    const d = await res.json();
                    if (d.data) alert(`Password: ${d.data.password}`);
                  }}
                >
                  View Password
                </Button>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
}
