'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Users,
  Wallet,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  ExternalLink,
  Banknote,
  ArrowRight,
  Search,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import StatCard from '@/components/ui/StatCard';
import Skeleton from '@/components/ui/Skeleton';
import Modal from '@/components/ui/Modal';
import Tabs from '@/components/ui/Tabs';
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
  user: { id: string; email: string; name: string | null; referralBalance: number };
}

interface ReferralRow {
  id: string;
  referrer: { id: string; email: string; name: string | null };
  referredEmail: string;
  referredUser: { id: string; email: string; name: string | null; createdAt: string } | null;
  order: { id: string; planName: string; status: string; totalAmount: number } | null;
  commission: number;
  paid: boolean;
  createdAt: string;
}

interface PayoutSummary {
  pendingAmount: number;
  pendingCount: number;
  paidAmount: number;
  paidCount: number;
  rejectedCount: number;
}

export default function AdminReferralsPage() {
  const { addToast } = useToast();
  const [tab, setTab] = useState('payouts');

  // Payouts
  const [payouts, setPayouts] = useState<PayoutRow[]>([]);
  const [payoutSummary, setPayoutSummary] = useState<PayoutSummary | null>(null);
  const [payoutsLoading, setPayoutsLoading] = useState(true);
  const [payoutFilter, setPayoutFilter] = useState<'PENDING' | 'PAID' | 'REJECTED' | 'ALL'>('PENDING');

  // Referrals
  const [referrals, setReferrals] = useState<ReferralRow[]>([]);
  const [referralsLoading, setReferralsLoading] = useState(true);
  const [referralStats, setReferralStats] = useState({ totalReferralsAll: 0, totalCommissionPaid: 0 });
  const [search, setSearch] = useState('');

  // Action modals
  const [payTarget, setPayTarget] = useState<PayoutRow | null>(null);
  const [payTxHash, setPayTxHash] = useState('');
  const [payNote, setPayNote] = useState('');
  const [processingPay, setProcessingPay] = useState(false);

  const [rejectTarget, setRejectTarget] = useState<PayoutRow | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [processingReject, setProcessingReject] = useState(false);

  const fetchPayouts = useCallback(async () => {
    setPayoutsLoading(true);
    try {
      const q = payoutFilter === 'ALL' ? '' : `?status=${payoutFilter}`;
      const res = await fetch(`/api/admin/referral-payouts${q}`);
      if (res.ok) {
        const d = await res.json();
        setPayouts(d.data?.data ?? []);
        setPayoutSummary(d.data?.summary ?? null);
      }
    } catch { /* silent */ }
    finally { setPayoutsLoading(false); }
  }, [payoutFilter]);

  const fetchReferrals = useCallback(async () => {
    setReferralsLoading(true);
    try {
      const res = await fetch('/api/admin/referrals?limit=100');
      if (res.ok) {
        const d = await res.json();
        setReferrals(d.data?.data ?? []);
        setReferralStats(d.data?.summary ?? { totalReferralsAll: 0, totalCommissionPaid: 0 });
      }
    } catch { /* silent */ }
    finally { setReferralsLoading(false); }
  }, []);

  useEffect(() => { fetchPayouts(); }, [fetchPayouts]);
  useEffect(() => { fetchReferrals(); }, [fetchReferrals]);

  const handlePay = async () => {
    if (!payTarget) return;
    if (!payTxHash.trim()) { addToast('Transaction hash is required', 'error'); return; }
    setProcessingPay(true);
    try {
      const res = await fetch(`/api/admin/referral-payouts/${payTarget.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'pay',
          txHash: payTxHash.trim(),
          adminNote: payNote.trim() || null,
        }),
      });
      const d = await res.json();
      if (res.ok) {
        addToast('Payout marked as paid. User has been notified.', 'success');
        setPayTarget(null);
        setPayTxHash('');
        setPayNote('');
        fetchPayouts();
      } else {
        addToast(d.error ?? 'Failed to mark paid', 'error');
      }
    } finally {
      setProcessingPay(false);
    }
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    if (rejectReason.trim().length < 3) { addToast('Please give a reason', 'error'); return; }
    setProcessingReject(true);
    try {
      const res = await fetch(`/api/admin/referral-payouts/${rejectTarget.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reject',
          adminNote: rejectReason.trim(),
        }),
      });
      const d = await res.json();
      if (res.ok) {
        addToast('Payout rejected. Balance refunded to user.', 'success');
        setRejectTarget(null);
        setRejectReason('');
        fetchPayouts();
      } else {
        addToast(d.error ?? 'Failed to reject', 'error');
      }
    } finally {
      setProcessingReject(false);
    }
  };

  const filteredReferrals = referrals.filter((r) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      r.referrer.email.toLowerCase().includes(q) ||
      r.referrer.name?.toLowerCase().includes(q) ||
      r.referredEmail.toLowerCase().includes(q) ||
      r.referredUser?.name?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold flex items-center gap-2">
          <Users className="h-6 w-6 text-accent-primary" /> Referrals
        </h1>
        <p className="text-text-secondary mt-1">Manage referral payouts and view the platform-wide referral graph.</p>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Pending Payouts"
          value={payoutSummary ? String(payoutSummary.pendingCount) : '—'}
          icon={<Clock className="h-5 w-5" />}
        />
        <StatCard
          label="Pending Amount"
          value={payoutSummary ? formatCurrency(payoutSummary.pendingAmount) : '—'}
          icon={<Wallet className="h-5 w-5" />}
        />
        <StatCard
          label="Total Paid Out"
          value={payoutSummary ? formatCurrency(payoutSummary.paidAmount) : '—'}
          icon={<DollarSign className="h-5 w-5" />}
        />
        <StatCard
          label="Total Referrals"
          value={String(referralStats.totalReferralsAll)}
          icon={<Users className="h-5 w-5" />}
        />
      </div>

      <Tabs
        activeTab={tab}
        onChange={setTab}
        tabs={[
          { id: 'payouts', label: 'Payout Requests', count: payoutSummary?.pendingCount },
          { id: 'graph', label: 'All Referrals' },
        ]}
      />

      {/* Tab: Payouts */}
      {tab === 'payouts' && (
        <GlassCard padding="md">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
              Withdrawal Requests
            </h3>
            <div className="flex items-center gap-1">
              {(['PENDING', 'PAID', 'REJECTED', 'ALL'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setPayoutFilter(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    payoutFilter === s
                      ? 'bg-accent-primary/10 text-accent-primary'
                      : 'text-text-tertiary hover:text-text-primary hover:bg-white/[0.04]'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {payoutsLoading ? (
            <div className="space-y-2">{Array.from({length: 4}).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow hoverable={false}>
                  <TableHead>Requested</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Network</TableHead>
                  <TableHead>Wallet</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead align="right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payouts.length === 0 ? (
                  <TableEmpty colSpan={7} message="No payout requests in this view." />
                ) : (
                  payouts.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <span className="text-xs text-text-tertiary">{formatRelativeTime(p.createdAt)}</span>
                      </TableCell>
                      <TableCell>
                        <Link href={`/admin/users/${p.user.id}`} className="text-sm text-accent-primary hover:underline">
                          {p.user.name ?? p.user.email}
                        </Link>
                        <p className="text-[10px] text-text-tertiary">Balance left: {formatCurrency(p.user.referralBalance)}</p>
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
                        <button
                          onClick={() => { navigator.clipboard.writeText(p.wallet); addToast('Wallet copied', 'success'); }}
                          className="ml-2 text-[10px] text-accent-primary hover:underline"
                        >copy</button>
                      </TableCell>
                      <TableCell>
                        {p.status === 'PAID' && <Badge variant="green" size="sm"><CheckCircle className="h-3 w-3" /> Paid</Badge>}
                        {p.status === 'PENDING' && <Badge variant="yellow" size="sm"><Clock className="h-3 w-3" /> Pending</Badge>}
                        {p.status === 'REJECTED' && <Badge variant="red" size="sm"><XCircle className="h-3 w-3" /> Rejected</Badge>}
                      </TableCell>
                      <TableCell align="right">
                        {p.status === 'PENDING' ? (
                          <div className="flex items-center gap-1 justify-end">
                            <button
                              onClick={() => { setPayTarget(p); setPayTxHash(''); setPayNote(''); }}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-success/10 text-success text-xs font-medium hover:bg-success/20"
                            >
                              <Banknote className="h-3 w-3" /> Mark Paid
                            </button>
                            <button
                              onClick={() => { setRejectTarget(p); setRejectReason(''); }}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-danger/10 text-danger text-xs font-medium hover:bg-danger/20"
                            >
                              <XCircle className="h-3 w-3" /> Reject
                            </button>
                          </div>
                        ) : p.txHash ? (
                          <span className="font-mono text-[11px] text-text-tertiary">{p.txHash.slice(0, 10)}…</span>
                        ) : p.adminNote ? (
                          <span className="text-[11px] text-text-tertiary italic truncate">{p.adminNote}</span>
                        ) : (
                          <span className="text-xs text-text-tertiary">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </GlassCard>
      )}

      {/* Tab: All Referrals */}
      {tab === 'graph' && (
        <GlassCard padding="md">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
              Referral Graph ({referrals.length})
            </h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by email or name..."
                className="pl-9 pr-3 py-2 w-64 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white placeholder-text-tertiary focus:outline-none focus:border-accent-primary/50"
              />
            </div>
          </div>

          {referralsLoading ? (
            <div className="space-y-2">{Array.from({length: 4}).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow hoverable={false}>
                  <TableHead>Referrer</TableHead>
                  <TableHead align="center">→</TableHead>
                  <TableHead>Referred Client</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead align="right">Commission</TableHead>
                  <TableHead>Signed Up</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReferrals.length === 0 ? (
                  <TableEmpty colSpan={7} message="No referrals found." />
                ) : (
                  filteredReferrals.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>
                        <Link href={`/admin/users/${r.referrer.id}`} className="text-sm text-accent-primary hover:underline">
                          {r.referrer.name ?? r.referrer.email}
                        </Link>
                        <p className="text-[10px] text-text-tertiary truncate">{r.referrer.email}</p>
                      </TableCell>
                      <TableCell align="center">
                        <ArrowRight className="h-4 w-4 text-text-tertiary inline" />
                      </TableCell>
                      <TableCell>
                        {r.referredUser ? (
                          <Link href={`/admin/users/${r.referredUser.id}`} className="text-sm text-accent-primary hover:underline">
                            {r.referredUser.name ?? r.referredEmail}
                          </Link>
                        ) : (
                          <span className="text-sm text-text-secondary">{r.referredEmail}</span>
                        )}
                        {!r.referredUser && <p className="text-[10px] text-text-tertiary italic">Not registered yet</p>}
                      </TableCell>
                      <TableCell>
                        {r.order ? (
                          <Link href={`/admin/orders/${r.order.id}`} className="text-sm hover:underline">
                            {r.order.planName} <ExternalLink className="h-3 w-3 inline" />
                          </Link>
                        ) : (
                          <span className="text-xs text-text-tertiary italic">No order yet</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {r.paid ? (
                          <Badge variant="green" size="sm"><CheckCircle className="h-3 w-3" /> Credited</Badge>
                        ) : r.order?.status === 'PENDING_PAYMENT' ? (
                          <Badge variant="yellow" size="sm">Awaiting payment</Badge>
                        ) : (
                          <Badge variant="default" size="sm">Pending</Badge>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        {r.paid ? (
                          <span className="font-mono text-success font-semibold">+{formatCurrency(r.commission)}</span>
                        ) : (
                          <span className="text-xs text-text-tertiary">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-text-tertiary">{formatRelativeTime(r.createdAt)}</span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </GlassCard>
      )}

      {/* Mark Paid modal */}
      <Modal isOpen={!!payTarget} onClose={() => !processingPay && setPayTarget(null)} title="Mark Payout as Paid" size="md">
        <div className="space-y-4">
          {payTarget && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-white/[0.04]">
                  <p className="text-[10px] text-text-tertiary uppercase">User</p>
                  <p className="text-sm font-medium">{payTarget.user.name ?? payTarget.user.email}</p>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.04]">
                  <p className="text-[10px] text-text-tertiary uppercase">Amount</p>
                  <p className="text-sm font-mono font-semibold">{formatCurrency(payTarget.amount)}</p>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.04]">
                <p className="text-[10px] text-text-tertiary uppercase">Send to ({payTarget.method.replace(/_/g, ' ')})</p>
                <p className="text-xs font-mono text-text-secondary break-all">{payTarget.wallet}</p>
              </div>

              <div className="flex items-start gap-2 p-3 rounded-xl bg-accent-gold/5 border border-accent-gold/20 text-xs text-accent-gold">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <p>Send the crypto from your wallet first, then paste the transaction hash below.</p>
              </div>

              <Input
                label="Transaction Hash"
                placeholder="0x... or tx id"
                value={payTxHash}
                onChange={(e) => setPayTxHash(e.target.value)}
                autoFocus
              />
              <Input
                label="Note (optional)"
                placeholder="Internal note"
                value={payNote}
                onChange={(e) => setPayNote(e.target.value)}
              />
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => !processingPay && setPayTarget(null)} className="px-4 py-2 rounded-xl text-sm text-text-secondary hover:bg-white/[0.04]">Cancel</button>
            <button onClick={handlePay} disabled={processingPay || !payTxHash.trim()} className="flex items-center gap-2 px-5 py-2 rounded-xl bg-success text-white text-sm font-medium disabled:opacity-40">
              {processingPay ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
              Confirm Paid
            </button>
          </div>
        </div>
      </Modal>

      {/* Reject modal */}
      <Modal isOpen={!!rejectTarget} onClose={() => !processingReject && setRejectTarget(null)} title="Reject Payout Request" size="md">
        <div className="space-y-4">
          {rejectTarget && (
            <>
              <p className="text-sm text-text-secondary">
                Reject the {formatCurrency(rejectTarget.amount)} payout request from{' '}
                <strong className="text-text-primary">{rejectTarget.user.name ?? rejectTarget.user.email}</strong>?
                The amount will be returned to their referral balance.
              </p>
              <Input
                label="Reason"
                placeholder="e.g. invalid wallet address"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                autoFocus
              />
            </>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => !processingReject && setRejectTarget(null)} className="px-4 py-2 rounded-xl text-sm text-text-secondary hover:bg-white/[0.04]">Cancel</button>
            <button onClick={handleReject} disabled={processingReject || rejectReason.trim().length < 3} className="flex items-center gap-2 px-5 py-2 rounded-xl bg-danger text-white text-sm font-medium disabled:opacity-40">
              {processingReject ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
              Reject & Refund
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
