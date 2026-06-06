'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, User, KeyRound, Trophy, ExternalLink, ImageIcon, CreditCard } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import Input from '@/components/ui/Input';
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
  proofImage: string | null;
  paymentNetwork: string | null;
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
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [creatingChallenge, setCreatingChallenge] = useState(false);
  const [challengeForm, setChallengeForm] = useState({ targetProfit: '', maxDrawdown: '' });

  useEffect(() => {
    fetch(`/api/admin/orders/${params.id}`)
      .then((r) => r.json())
      .then((d) => {
        setOrder(d.data);
        setNewStatus(d.data?.status ?? '');
        // Check if a challenge already exists for this order
        if (d.data?.id) {
          fetch(`/api/admin/orders/${params.id}/challenge`)
            .then((r) => r.json())
            .then((cd) => { if (cd.data?.id) setChallengeId(cd.data.id); })
            .catch(() => {});
        }
      })
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

  const handleCreateChallenge = async () => {
    setCreatingChallenge(true);
    try {
      const res = await fetch('/api/admin/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order?.id,
          targetProfit: challengeForm.targetProfit || undefined,
          maxDrawdown: challengeForm.maxDrawdown || undefined,
        }),
      });
      const d = await res.json();
      if (res.ok) {
        setChallengeId(d.data.id);
        addToast('Challenge created! User has been notified.', 'success');
      } else {
        addToast(d.error ?? 'Failed to create challenge.', 'error');
      }
    } finally {
      setCreatingChallenge(false);
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

      {/* Payment Proof & Notes */}
      {(order.proofImage || order.notes || order.paymentNetwork) && (
        <GlassCard padding="lg">
          <h3 className="font-heading font-semibold mb-4 flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-accent-primary" />Payment Proof
          </h3>
          <div className="space-y-4">
            {order.paymentNetwork && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-text-tertiary">Network:</span>
                <Badge variant="blue" size="sm">{order.paymentNetwork}</Badge>
              </div>
            )}
            {order.notes && (
              <div>
                <p className="text-xs text-text-tertiary mb-1">Notes</p>
                <p className="text-sm text-text-secondary">{order.notes}</p>
              </div>
            )}
            {order.proofImage && (
              <div>
                <p className="text-xs text-text-tertiary mb-2">Proof Screenshot</p>
                <a href={order.proofImage} target="_blank" rel="noopener noreferrer" className="block">
                  <div className="relative w-full max-w-md rounded-xl overflow-hidden border border-white/[0.08] hover:border-accent-primary/50 transition-colors">
                    <Image
                      src={order.proofImage}
                      alt="Payment proof"
                      width={600}
                      height={400}
                      className="w-full h-auto object-contain bg-black/30"
                      unoptimized
                    />
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-xs text-accent-primary hover:underline mt-2">
                    <ExternalLink className="h-3.5 w-3.5" /> Open full size
                  </span>
                </a>
              </div>
            )}
            {!order.proofImage && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
                <ImageIcon className="h-4 w-4 text-yellow-400" />
                <p className="text-xs text-yellow-300">No proof screenshot uploaded yet.</p>
              </div>
            )}
          </div>
        </GlassCard>
      )}

      {/* Challenge / Account Tracking */}
      <GlassCard padding="lg">
        <h3 className="font-heading font-semibold mb-4 flex items-center gap-2">
          <Trophy className="h-4 w-4 text-accent-primary" />
          {order.serviceType === 'CHALLENGE_PASSING' ? 'Challenge' : 'Account Tracking'}
        </h3>
        {challengeId ? (
          <div className="flex items-center gap-3">
            <Badge variant="green" size="sm">
              {order.serviceType === 'CHALLENGE_PASSING' ? 'Challenge Created' : 'Account Linked'}
            </Badge>
            <Link href={`/admin/challenges/${challengeId}`} className="flex items-center gap-1 text-sm text-accent-primary hover:underline">
              {order.serviceType === 'CHALLENGE_PASSING' ? 'View Challenge' : 'View Account'} <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-text-secondary">
              {order.serviceType === 'CHALLENGE_PASSING'
                ? <>No challenge has been created for this order yet. Fill in the targets below and click <strong>Create Challenge</strong> — the user will be notified automatically.</>
                : <>No account tracking has been set up for this order yet. Create one so the client can monitor their account progress on their dashboard.</>}
            </p>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label={order.serviceType === 'CHALLENGE_PASSING' ? 'Target Profit ($) — optional' : 'Initial Balance ($) — optional'}
                type="number"
                placeholder={order.serviceType === 'CHALLENGE_PASSING' ? 'e.g. 1000' : 'e.g. 50000'}
                value={challengeForm.targetProfit}
                onChange={(e) => setChallengeForm((f) => ({ ...f, targetProfit: e.target.value }))}
              />
              <Input
                label="Max Drawdown (%) — optional"
                type="number"
                placeholder="e.g. 10"
                value={challengeForm.maxDrawdown}
                onChange={(e) => setChallengeForm((f) => ({ ...f, maxDrawdown: e.target.value }))}
              />
            </div>
            <p className="text-xs text-text-tertiary">
              Firm: <span className="text-text-primary">{order.firmName ?? '—'}</span> &nbsp;|&nbsp;
              Size: <span className="text-text-primary">{order.accountSize ?? '—'}</span>
            </p>
            <Button
              variant="primary"
              size="sm"
              loading={creatingChallenge}
              onClick={handleCreateChallenge}
              icon={<Trophy className="h-4 w-4" />}
            >
              {order.serviceType === 'CHALLENGE_PASSING' ? 'Create Challenge' : 'Create Account Tracker'}
            </Button>
          </div>
        )}
      </GlassCard>

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
