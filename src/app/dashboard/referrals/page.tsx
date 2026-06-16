'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Users,
  DollarSign,
  Wallet,
  Copy,
  Check,
  Share2,
  CheckCircle,
  Clock,
  Mail,
  Banknote,
  XCircle,
  ExternalLink,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import StatCard from '@/components/ui/StatCard';
import Skeleton from '@/components/ui/Skeleton';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty } from '@/components/ui/Table';
import { formatRelativeTime, formatCurrency } from '@/lib/utils';
import useToast from '@/hooks/useToast';

interface PayoutRow {
  id: string;
  amount: number;
  method: string;
  wallet: string;
  status: 'PENDING' | 'PAID' | 'REJECTED';
  txHash: string | null;
  adminNote: string | null;
  processedAt: string | null;
  createdAt: string;
}

const PAYOUT_METHODS = [
  { value: 'USDT_TRC20', label: 'USDT (TRC20 · Tron)' },
  { value: 'USDT_BEP20', label: 'USDT (BEP20 · BNB Chain)' },
];

const MIN_PAYOUT = 50;

interface ReferralRow {
  id: string;
  referredEmail: string;
  referredName: string | null;
  signedUpAt: string;
  commission: number;
  paid: boolean;
  orderId: string | null;
  orderPlanName: string | null;
  orderStatus: string | null;
  createdAt: string;
}

interface ReferralData {
  referralCode: string;
  referralBalance: number;
  commissionRate: number;
  totalReferrals: number;
  paidReferrals: number;
  pendingReferrals: number;
  totalEarned: number;
  referrals: ReferralRow[];
}

export default function ReferralsPage() {
  const { addToast } = useToast();
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [payouts, setPayouts] = useState<PayoutRow[]>([]);
  const [claimOpen, setClaimOpen] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [claimForm, setClaimForm] = useState({ amount: '', method: 'USDT_TRC20', wallet: '' });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [refRes, payRes] = await Promise.all([
        fetch('/api/dashboard/referrals'),
        fetch('/api/dashboard/referral-payouts'),
      ]);
      if (refRes.ok) {
        const d = await refRes.json();
        setData(d.data);
      }
      if (payRes.ok) {
        const d = await payRes.json();
        setPayouts(d.data?.payouts ?? []);
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openClaim = () => {
    setClaimForm({
      amount: data ? data.referralBalance.toFixed(2) : '',
      method: 'USDT_TRC20',
      wallet: '',
    });
    setClaimOpen(true);
  };

  const handleClaim = async () => {
    if (!data) return;
    const amt = parseFloat(claimForm.amount);
    if (!isFinite(amt) || amt <= 0) {
      addToast('Enter a valid amount', 'error');
      return;
    }
    if (amt < MIN_PAYOUT) {
      addToast(`Minimum payout is $${MIN_PAYOUT}`, 'error');
      return;
    }
    if (amt > data.referralBalance) {
      addToast('Amount exceeds your available balance', 'error');
      return;
    }
    if (!claimForm.wallet.trim()) {
      addToast('Wallet address is required', 'error');
      return;
    }
    setClaiming(true);
    try {
      const res = await fetch('/api/dashboard/referral-payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amt,
          method: claimForm.method,
          wallet: claimForm.wallet.trim(),
        }),
      });
      const d = await res.json();
      if (res.ok) {
        addToast('Payout request submitted — admins will process it shortly.', 'success');
        setClaimOpen(false);
        fetchData();
      } else {
        addToast(d.error ?? 'Failed to submit payout', 'error');
      }
    } finally {
      setClaiming(false);
    }
  };

  const referralLink =
    data?.referralCode && typeof window !== 'undefined'
      ? `${window.location.origin}/register?ref=${encodeURIComponent(data.referralCode)}`
      : '';

  const handleCopy = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      addToast(`${label} copied to clipboard`, 'success');
      setTimeout(() => setCopied(false), 1500);
    } catch {
      addToast('Copy failed — please copy manually', 'error');
    }
  };

  const handleShare = async () => {
    if (!referralLink) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join The Market Architects',
          text: 'Get funded with the prop-firm challenge specialists. Use my link to sign up:',
          url: referralLink,
        });
      } catch { /* user cancelled */ }
    } else {
      handleCopy(referralLink, 'Referral link');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  if (!data) {
    return <p className="text-text-secondary">Failed to load referral data.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-heading font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-accent-primary" /> Referral Program
          </h1>
          <p className="text-text-secondary mt-1">
            Earn <span className="text-accent-primary font-semibold">{data.commissionRate}% commission</span> on every paid order from clients you refer.
          </p>
        </div>
        <Button
          variant="primary"
          icon={<Banknote className="h-4 w-4" />}
          onClick={openClaim}
          disabled={data.referralBalance < MIN_PAYOUT}
        >
          Claim Payout
        </Button>
      </div>

      {data.referralBalance > 0 && data.referralBalance < MIN_PAYOUT && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-accent-gold/5 border border-accent-gold/20 text-xs text-accent-gold">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          Minimum payout amount is ${MIN_PAYOUT}. Keep referring to unlock withdrawal.
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Available Balance"
          value={formatCurrency(data.referralBalance)}
          icon={<Wallet className="h-5 w-5" />}
        />
        <StatCard
          label="Total Earned"
          value={formatCurrency(data.totalEarned)}
          icon={<DollarSign className="h-5 w-5" />}
        />
        <StatCard
          label="Referred Clients"
          value={String(data.totalReferrals)}
          icon={<Users className="h-5 w-5" />}
        />
        <StatCard
          label="Pending"
          value={String(data.pendingReferrals)}
          icon={<Clock className="h-5 w-5" />}
        />
      </div>

      {/* Referral link / code share card */}
      <GlassCard padding="lg">
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2 rounded-xl bg-accent-primary/10 shrink-0">
            <Share2 className="h-5 w-5 text-accent-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-heading font-semibold">Your Referral Link</h3>
            <p className="text-xs text-text-tertiary mt-0.5">
              Share this link. When someone signs up and pays for any service, you earn {data.commissionRate}% of their order total.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {/* Full link */}
          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0 px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08]">
              <p className="text-sm font-mono text-text-secondary truncate">
                {referralLink || '—'}
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              icon={copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              onClick={() => referralLink && handleCopy(referralLink, 'Referral link')}
            >
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>

          {/* Code + share */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="text-xs text-text-tertiary">Or share just your code:</div>
            <code className="px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.08] font-mono text-xs text-accent-primary">
              {data.referralCode}
            </code>
            <button
              onClick={() => handleCopy(data.referralCode, 'Referral code')}
              className="text-xs text-text-secondary hover:text-text-primary inline-flex items-center gap-1 transition-colors"
            >
              <Copy className="h-3 w-3" /> Copy code
            </button>
            <button
              onClick={handleShare}
              className="ml-auto text-xs text-accent-primary hover:underline inline-flex items-center gap-1"
            >
              <Share2 className="h-3 w-3" /> Share
            </button>
          </div>
        </div>
      </GlassCard>

      {/* How it works */}
      <GlassCard padding="lg">
        <h3 className="font-heading font-semibold mb-4">How it works</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { step: '1', title: 'Share your link', desc: 'Send your unique link to friends and traders.' },
            { step: '2', title: 'They sign up & buy', desc: 'When they purchase any service, the order is tracked.' },
            { step: '3', title: 'You earn ' + data.commissionRate + '%', desc: 'Once their order is marked PAID, your balance updates automatically.' },
          ].map((item) => (
            <div key={item.step} className="flex items-start gap-3">
              <div className="shrink-0 w-7 h-7 rounded-full bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center text-xs font-bold text-accent-primary">
                {item.step}
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary">{item.title}</p>
                <p className="text-xs text-text-tertiary mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-text-tertiary mt-4 pt-4 border-t border-white/[0.06]">
          Click <strong className="text-text-secondary">Claim Payout</strong> when your balance is at least ${MIN_PAYOUT}. Funds are sent in USDT to the wallet address you provide — usually within 1–3 business days after approval.
        </p>
      </GlassCard>

      {/* Referred clients table */}
      <GlassCard padding="md">
        <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">
          Your Referrals
        </h3>
        <Table>
          <TableHeader>
            <TableRow hoverable={false}>
              <TableHead>Referred</TableHead>
              <TableHead>Signed Up</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Status</TableHead>
              <TableHead align="right">Commission</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.referrals.length === 0 ? (
              <TableEmpty colSpan={5} message="No referrals yet. Share your link to start earning." />
            ) : (
              data.referrals.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 text-text-tertiary shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate">
                          {r.referredName ?? maskEmail(r.referredEmail)}
                        </p>
                        {r.referredName && (
                          <p className="text-[10px] text-text-tertiary truncate">{maskEmail(r.referredEmail)}</p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-text-tertiary">{formatRelativeTime(r.signedUpAt)}</span>
                  </TableCell>
                  <TableCell>
                    {r.orderPlanName ? (
                      <span className="text-xs text-text-secondary">{r.orderPlanName}</span>
                    ) : (
                      <span className="text-xs text-text-tertiary italic">No order yet</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {r.paid ? (
                      <Badge variant="green" size="sm">
                        <CheckCircle className="h-3 w-3" /> Credited
                      </Badge>
                    ) : r.orderStatus === 'PENDING_PAYMENT' ? (
                      <Badge variant="yellow" size="sm">
                        <Clock className="h-3 w-3" /> Awaiting payment
                      </Badge>
                    ) : (
                      <Badge variant="default" size="sm">
                        Pending
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    {r.paid ? (
                      <span className="font-mono font-semibold text-success">
                        +{formatCurrency(r.commission)}
                      </span>
                    ) : (
                      <span className="text-xs text-text-tertiary">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </GlassCard>

      {/* Payout history */}
      <GlassCard padding="md">
        <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">
          Payout History
        </h3>
        <Table>
          <TableHeader>
            <TableRow hoverable={false}>
              <TableHead>Requested</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Network</TableHead>
              <TableHead>Wallet</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Tx / Note</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payouts.length === 0 ? (
              <TableEmpty colSpan={6} message="No payout requests yet." />
            ) : (
              payouts.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <span className="text-xs text-text-tertiary">{formatRelativeTime(p.createdAt)}</span>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono font-semibold">{formatCurrency(p.amount)}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-text-secondary">{p.method.replace(/_/g, ' ')}</span>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-[11px] text-text-tertiary">
                      {p.wallet.slice(0, 8)}…{p.wallet.slice(-6)}
                    </span>
                  </TableCell>
                  <TableCell>
                    {p.status === 'PAID' && (
                      <Badge variant="green" size="sm"><CheckCircle className="h-3 w-3" /> Paid</Badge>
                    )}
                    {p.status === 'PENDING' && (
                      <Badge variant="yellow" size="sm"><Clock className="h-3 w-3" /> Pending</Badge>
                    )}
                    {p.status === 'REJECTED' && (
                      <Badge variant="red" size="sm"><XCircle className="h-3 w-3" /> Rejected</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {p.txHash ? (
                      <span className="font-mono text-[11px] text-text-secondary inline-flex items-center gap-1">
                        {p.txHash.slice(0, 10)}…{p.txHash.slice(-6)}
                        <ExternalLink className="h-3 w-3 text-text-tertiary" />
                      </span>
                    ) : p.adminNote ? (
                      <span className="text-xs text-text-tertiary italic">{p.adminNote}</span>
                    ) : (
                      <span className="text-xs text-text-tertiary">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </GlassCard>

      {/* Claim modal */}
      <Modal isOpen={claimOpen} onClose={() => !claiming && setClaimOpen(false)} title="Claim Referral Payout" size="md">
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.04] border border-white/[0.06]">
            <span className="text-xs text-text-tertiary">Available balance</span>
            <span className="font-mono font-bold text-accent-primary">{formatCurrency(data.referralBalance)}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Amount (USD)"
              type="number"
              step="0.01"
              min={MIN_PAYOUT}
              max={data.referralBalance}
              placeholder={`Min $${MIN_PAYOUT}`}
              value={claimForm.amount}
              onChange={(e) => setClaimForm((f) => ({ ...f, amount: e.target.value }))}
            />
            <Select
              label="Network"
              value={claimForm.method}
              onChange={(e) => setClaimForm((f) => ({ ...f, method: e.target.value }))}
            >
              {PAYOUT_METHODS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </Select>
          </div>

          <Input
            label="Wallet Address"
            placeholder="Paste your USDT receiving address"
            value={claimForm.wallet}
            onChange={(e) => setClaimForm((f) => ({ ...f, wallet: e.target.value }))}
            hint="Double-check the address matches the network above. We cannot reverse sends."
          />

          <div className="flex items-start gap-2 p-3 rounded-xl bg-accent-gold/5 border border-accent-gold/20 text-xs text-accent-gold">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <p>
              The amount will be deducted from your balance immediately and held until the admin processes the request. If declined, it will be refunded automatically.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => !claiming && setClaimOpen(false)}
              className="px-4 py-2 rounded-xl text-sm text-text-secondary hover:bg-white/[0.04]"
            >
              Cancel
            </button>
            <Button variant="primary" loading={claiming} onClick={handleClaim} icon={<Banknote className="h-4 w-4" />}>
              Submit Request
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

/** Show first 2 chars + masked middle + domain — privacy-respecting display. */
function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return email;
  if (local.length <= 2) return `${local[0]}***@${domain}`;
  return `${local.slice(0, 2)}***@${domain}`;
}
