'use client';

import { useEffect, useState } from 'react';
import {
  DollarSign, Send, Clock, CheckCircle, AlertTriangle,
  Copy, Check, ExternalLink, ChevronDown, ChevronUp, Plus, X,
} from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import StatCard from '@/components/ui/StatCard';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';
import Skeleton from '@/components/ui/Skeleton';
import useToast from '@/hooks/useToast';
import { formatCurrency, formatDate } from '@/lib/utils';

// ── Types ─────────────────────────────────────────────────────────────────────
interface ProfitSplit {
  id:           string;
  totalPayout:  number;
  splitPercent: number;
  amountDue:    number;
  amountSent:   number;
  currency:     string;
  network:      string | null;
  txHash:       string | null;
  proofImage:   string | null;
  notes:        string | null;
  status:       'PENDING' | 'CONFIRMED' | 'DISPUTED' | 'REJECTED';
  adminNote:    string | null;
  reviewedAt:   string | null;
  createdAt:    string;
  challenge:    { firmName: string; accountSize: string } | null;
  order:        { planName: string; serviceType: string }  | null;
}
interface FundedChallenge { id: string; firmName: string; accountSize: string }
interface AmOrder         { id: string; planName: string; accountSize: string | null; firmName: string | null }

// ── Wallet addresses ──────────────────────────────────────────────────────────
const WALLETS = [
  { label: 'USDT — TRC20',  value: process.env.NEXT_PUBLIC_WALLET_USDT_TRC20  ?? '' },
  { label: 'USDT — ERC20',  value: process.env.NEXT_PUBLIC_WALLET_USDT_ERC20  ?? '' },
  { label: 'USDT — BNB',    value: process.env.NEXT_PUBLIC_WALLET_USDT_BSC    ?? '' },
  { label: 'USDT — MATIC',  value: process.env.NEXT_PUBLIC_WALLET_USDT_POLYGON ?? '' },
  { label: 'Bitcoin (BTC)', value: process.env.NEXT_PUBLIC_WALLET_BTC          ?? '' },
].filter((w) => w.value);

const NETWORKS = ['TRC20', 'ERC20', 'BNB (BSC)', 'MATIC (Polygon)', 'BTC'];

// ── Status helpers ────────────────────────────────────────────────────────────
const statusBadge: Record<string, 'yellow' | 'green' | 'red' | 'gold'> = {
  PENDING:   'yellow',
  CONFIRMED: 'green',
  DISPUTED:  'gold',
  REJECTED:  'red',
};
const statusIcon = {
  PENDING:   <Clock className="h-3.5 w-3.5" />,
  CONFIRMED: <CheckCircle className="h-3.5 w-3.5" />,
  DISPUTED:  <AlertTriangle className="h-3.5 w-3.5" />,
  REJECTED:  <X className="h-3.5 w-3.5" />,
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function ProfitSplitPage() {
  const { addToast } = useToast();

  const [splits,    setSplits]    = useState<ProfitSplit[]>([]);
  const [funded,    setFunded]    = useState<FundedChallenge[]>([]);
  const [amOrders,  setAmOrders]  = useState<AmOrder[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [showForm,  setShowForm]  = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [expanded,  setExpanded]  = useState<string | null>(null);
  const [copiedWallet, setCopiedWallet] = useState<string | null>(null);
  const [totalConfirmed, setTotalConfirmed] = useState(0);

  // form state
  const [form, setForm] = useState({
    accountType:  'challenge' as 'challenge' | 'order',
    accountId:    '',
    totalPayout:  '',
    splitPercent: '',
    amountSent:   '',
    network:      'TRC20',
    txHash:       '',
    proofImage:   '',
    notes:        '',
  });

  // auto-calculate amount due
  const amountDue =
    form.totalPayout && form.splitPercent
      ? Math.round(parseFloat(form.totalPayout) * parseFloat(form.splitPercent)) / 100
      : 0;

  useEffect(() => {
    fetch('/api/dashboard/profit-splits')
      .then((r) => r.json())
      .then((d) => {
        setSplits(d.data?.splits ?? []);
        setFunded(d.data?.fundedChallenges ?? []);
        setAmOrders(d.data?.amOrders ?? []);
        setTotalConfirmed(d.data?.totalConfirmed ?? 0);
      })
      .catch(() => addToast('Failed to load profit splits', 'error'))
      .finally(() => setLoading(false));
  }, [addToast]);

  const pending   = splits.filter((s) => s.status === 'PENDING').length;
  const confirmed = splits.filter((s) => s.status === 'CONFIRMED').length;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.accountId) { addToast('Please select an account', 'error'); return; }
    if (!form.totalPayout || !form.splitPercent || !form.amountSent) {
      addToast('Please fill in all required fields', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        [form.accountType === 'challenge' ? 'challengeId' : 'orderId']: form.accountId,
        totalPayout:  parseFloat(form.totalPayout),
        splitPercent: parseFloat(form.splitPercent),
        amountSent:   parseFloat(form.amountSent),
        currency:     'USDT',
        network:      form.network || undefined,
        txHash:       form.txHash  || undefined,
        proofImage:   form.proofImage || undefined,
        notes:        form.notes   || undefined,
      };

      const res = await fetch('/api/dashboard/profit-splits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Submission failed');

      setSplits((prev) => [data.data.split, ...prev]);
      setShowForm(false);
      setForm({ accountType: 'challenge', accountId: '', totalPayout: '', splitPercent: '',
                amountSent: '', network: 'TRC20', txHash: '', proofImage: '', notes: '' });
      addToast('Profit split submitted successfully!', 'success');
    } catch (err: unknown) {
      addToast(err instanceof Error ? err.message : 'Failed to submit', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  async function copyWallet(address: string) {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedWallet(address);
      setTimeout(() => setCopiedWallet(null), 2000);
      addToast('Address copied!', 'success');
    } catch { addToast('Copy failed', 'error'); }
  }

  const noAccounts = funded.length === 0 && amOrders.length === 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold">Profit Split</h1>
          <p className="text-text-secondary mt-1">
            Submit your profit split payments and track their status.
          </p>
        </div>
        {!noAccounts && (
          <Button
            variant="primary"
            icon={<Plus className="h-4 w-4" />}
            onClick={() => setShowForm(true)}
          >
            Submit Payment
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Total Submitted"
          value={String(splits.length)}
          icon={<Send className="h-5 w-5" />}
        />
        <StatCard
          label="Pending Review"
          value={String(pending)}
          icon={<Clock className="h-5 w-5" />}
        />
        <StatCard
          label="Total Confirmed"
          value={formatCurrency(totalConfirmed)}
          icon={<DollarSign className="h-5 w-5" />}
        />
      </div>

      {/* Wallet Addresses */}
      {WALLETS.length > 0 && (
        <GlassCard padding="lg">
          <h3 className="text-lg font-heading font-semibold mb-1">Our Wallet Addresses</h3>
          <p className="text-sm text-text-secondary mb-4">
            Send your profit split to one of these addresses, then submit the form below with proof.
          </p>
          <div className="space-y-2">
            {WALLETS.map((w) => (
              <div key={w.label}
                className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/[0.05]"
              >
                <span className="text-xs font-semibold text-accent-gold min-w-[130px]">{w.label}</span>
                <span className="flex-1 font-mono text-xs text-text-secondary truncate">{w.value}</span>
                <button
                  onClick={() => copyWallet(w.value)}
                  className="shrink-0 p-1.5 rounded-md hover:bg-white/[0.06] text-text-tertiary hover:text-text-primary transition-colors"
                >
                  {copiedWallet === w.value
                    ? <Check className="h-3.5 w-3.5 text-success" />
                    : <Copy className="h-3.5 w-3.5" />
                  }
                </button>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* No wallets configured notice */}
      {WALLETS.length === 0 && (
        <GlassCard padding="lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-accent-gold mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-accent-gold">Wallet addresses not configured yet</p>
              <p className="text-xs text-text-secondary mt-1">
                Please contact support to get our payment details before submitting.
              </p>
            </div>
          </div>
        </GlassCard>
      )}

      {/* No eligible accounts */}
      {!loading && noAccounts && (
        <GlassCard padding="lg">
          <div className="text-center py-10">
            <DollarSign className="h-12 w-12 text-text-tertiary mx-auto mb-3" />
            <p className="font-medium text-text-secondary">No eligible accounts yet</p>
            <p className="text-sm text-text-tertiary mt-1">
              Profit split is available for funded challenges and active account management plans.
            </p>
          </div>
        </GlassCard>
      )}

      {/* Submission Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <GlassCard padding="lg" className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-heading font-semibold">Submit Profit Split</h3>
              <button
                onClick={() => setShowForm(false)}
                className="p-1.5 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-white/[0.06] transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Account selector */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Account *</label>
                <div className="flex gap-2 mb-2">
                  {(['challenge', 'order'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, accountType: t, accountId: '' }))}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        form.accountType === t
                          ? 'border-accent-primary bg-accent-primary/10 text-accent-primary'
                          : 'border-white/[0.08] text-text-secondary hover:border-white/20'
                      }`}
                    >
                      {t === 'challenge' ? 'Funded Challenge' : 'Account Management'}
                    </button>
                  ))}
                </div>
                <Select
                  value={form.accountId}
                  onChange={(e) => setForm((f) => ({ ...f, accountId: e.target.value }))}
                  required
                >
                  <option value="">Select account…</option>
                  {form.accountType === 'challenge'
                    ? funded.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.firmName} — {c.accountSize}
                        </option>
                      ))
                    : amOrders.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.planName}{o.firmName ? ` — ${o.firmName}` : ''}{o.accountSize ? ` (${o.accountSize})` : ''}
                        </option>
                      ))
                  }
                </Select>
              </div>

              {/* Payout info */}
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Total Payout Received ($) *"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g. 5000"
                  value={form.totalPayout}
                  onChange={(e) => setForm((f) => ({ ...f, totalPayout: e.target.value }))}
                  required
                />
                <Input
                  label="Your Agreed Split % *"
                  type="number"
                  min="1"
                  max="100"
                  step="0.1"
                  placeholder="e.g. 20"
                  value={form.splitPercent}
                  onChange={(e) => setForm((f) => ({ ...f, splitPercent: e.target.value }))}
                  required
                />
              </div>

              {/* Amount due banner */}
              {amountDue > 0 && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-accent-primary/10 border border-accent-primary/20">
                  <span className="text-sm text-text-secondary">Amount due to TMA:</span>
                  <span className="text-base font-bold text-accent-primary">{formatCurrency(amountDue)}</span>
                </div>
              )}

              <Input
                label="Amount You Sent (USDT) *"
                type="number"
                min="0"
                step="0.01"
                placeholder="e.g. 1000"
                value={form.amountSent}
                onChange={(e) => setForm((f) => ({ ...f, amountSent: e.target.value }))}
                required
              />

              <Select
                label="Network"
                value={form.network}
                onChange={(e) => setForm((f) => ({ ...f, network: e.target.value }))}
              >
                {NETWORKS.map((n) => <option key={n} value={n}>{n}</option>)}
              </Select>

              <Input
                label="Transaction Hash (optional)"
                placeholder="0x... or tx ID"
                value={form.txHash}
                onChange={(e) => setForm((f) => ({ ...f, txHash: e.target.value }))}
              />

              <Input
                label="Proof Screenshot URL (optional)"
                placeholder="https://... link to screenshot"
                value={form.proofImage}
                onChange={(e) => setForm((f) => ({ ...f, proofImage: e.target.value }))}
              />

              <Textarea
                label="Notes (optional)"
                placeholder="Any additional information…"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                rows={2}
              />

              <div className="flex gap-3 pt-1">
                <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" className="flex-1" loading={submitting}>
                  Submit Payment
                </Button>
              </div>
            </form>
          </GlassCard>
        </div>
      )}

      {/* History */}
      <GlassCard padding="lg">
        <h3 className="text-lg font-heading font-semibold mb-4">Submission History</h3>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
          </div>
        ) : splits.length === 0 ? (
          <div className="text-center py-12">
            <Send className="h-12 w-12 text-text-tertiary mx-auto mb-3" />
            <p className="text-text-secondary">No submissions yet.</p>
            {!noAccounts && (
              <p className="text-sm text-text-tertiary mt-1">
                Click &quot;Submit Payment&quot; once you&apos;ve sent your profit split.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {splits.map((s) => (
              <div key={s.id} className="rounded-xl border border-white/[0.06] overflow-hidden">
                {/* Row header */}
                <button
                  className="w-full flex items-center gap-4 p-4 hover:bg-white/[0.02] transition-colors text-left"
                  onClick={() => setExpanded(expanded === s.id ? null : s.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">
                        {s.challenge
                          ? `${s.challenge.firmName} — ${s.challenge.accountSize}`
                          : s.order?.planName ?? 'Account Management'}
                      </span>
                      <Badge variant={statusBadge[s.status]} size="sm" className="flex items-center gap-1">
                        {statusIcon[s.status]}
                        {s.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-text-tertiary mt-0.5">{formatDate(s.createdAt)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-mono font-semibold text-accent-primary">
                      {formatCurrency(s.amountSent)} {s.currency}
                    </p>
                    <p className="text-xs text-text-tertiary">
                      Due: {formatCurrency(s.amountDue)}
                    </p>
                  </div>
                  {expanded === s.id
                    ? <ChevronUp className="h-4 w-4 text-text-tertiary shrink-0" />
                    : <ChevronDown className="h-4 w-4 text-text-tertiary shrink-0" />
                  }
                </button>

                {/* Expanded details */}
                {expanded === s.id && (
                  <div className="px-4 pb-4 border-t border-white/[0.04] pt-3 space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                      <div>
                        <p className="text-text-tertiary text-xs">Total Payout</p>
                        <p className="font-medium">{formatCurrency(s.totalPayout)}</p>
                      </div>
                      <div>
                        <p className="text-text-tertiary text-xs">Split %</p>
                        <p className="font-medium">{s.splitPercent}%</p>
                      </div>
                      <div>
                        <p className="text-text-tertiary text-xs">Amount Due</p>
                        <p className="font-medium">{formatCurrency(s.amountDue)}</p>
                      </div>
                      <div>
                        <p className="text-text-tertiary text-xs">Network</p>
                        <p className="font-medium">{s.network ?? '—'}</p>
                      </div>
                    </div>

                    {s.txHash && (
                      <div>
                        <p className="text-text-tertiary text-xs mb-0.5">Transaction Hash</p>
                        <p className="font-mono text-xs text-text-secondary break-all">{s.txHash}</p>
                      </div>
                    )}

                    {s.proofImage && (
                      <div>
                        <p className="text-text-tertiary text-xs mb-1">Proof Screenshot</p>
                        <a
                          href={s.proofImage}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-accent-primary hover:underline"
                        >
                          <ExternalLink className="h-3.5 w-3.5" /> View Screenshot
                        </a>
                      </div>
                    )}

                    {s.notes && (
                      <div>
                        <p className="text-text-tertiary text-xs mb-0.5">Your Notes</p>
                        <p className="text-sm text-text-secondary">{s.notes}</p>
                      </div>
                    )}

                    {s.adminNote && (
                      <div className={`p-3 rounded-lg text-sm border ${
                        s.status === 'CONFIRMED'
                          ? 'bg-success/10 border-success/20 text-success'
                          : 'bg-accent-gold/10 border-accent-gold/20 text-accent-gold'
                      }`}>
                        <p className="font-medium text-xs mb-0.5">Admin Note</p>
                        {s.adminNote}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}
