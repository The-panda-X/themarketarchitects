'use client';

import { useEffect, useState } from 'react';
import {
  DollarSign, Clock, CheckCircle, AlertTriangle, X,
  ExternalLink, ChevronDown, ChevronUp, Search,
} from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import StatCard from '@/components/ui/StatCard';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
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
  user:      { id: string; name: string | null; email: string };
  challenge: { firmName: string; accountSize: string } | null;
  order:     { planName: string; serviceType: string } | null;
}
interface Stats {
  pending: number; confirmed: number; disputed: number; totalConfirmedAmount: number;
}

type FilterTab = 'ALL' | 'PENDING' | 'CONFIRMED' | 'DISPUTED' | 'REJECTED';

const statusBadge: Record<string, 'yellow' | 'green' | 'red' | 'gold'> = {
  PENDING: 'yellow', CONFIRMED: 'green', DISPUTED: 'gold', REJECTED: 'red',
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function AdminPayoutsPage() {
  const { addToast } = useToast();

  const [splits,   setSplits]   = useState<ProfitSplit[]>([]);
  const [stats,    setStats]    = useState<Stats>({ pending: 0, confirmed: 0, disputed: 0, totalConfirmedAmount: 0 });
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState<FilterTab>('PENDING');
  const [search,   setSearch]   = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  // Review state
  const [reviewing,  setReviewing]  = useState<string | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [saving,     setSaving]     = useState(false);

  useEffect(() => {
    fetch('/api/admin/profit-splits')
      .then((r) => r.json())
      .then((d) => {
        setSplits(d.data?.splits ?? []);
        setStats(d.data?.stats ?? { pending: 0, confirmed: 0, disputed: 0, totalConfirmedAmount: 0 });
      })
      .catch(() => addToast('Failed to load profit splits', 'error'))
      .finally(() => setLoading(false));
  }, [addToast]);

  const filtered = splits.filter((s) => {
    if (tab !== 'ALL' && s.status !== tab) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        s.user.email.toLowerCase().includes(q) ||
        (s.user.name ?? '').toLowerCase().includes(q) ||
        (s.challenge?.firmName ?? '').toLowerCase().includes(q) ||
        (s.txHash ?? '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  async function review(id: string, status: 'CONFIRMED' | 'DISPUTED' | 'REJECTED') {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/profit-splits/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, adminNote: reviewNote || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed');

      setSplits((prev) =>
        prev.map((s) => s.id === id ? { ...s, status, adminNote: reviewNote || null, reviewedAt: new Date().toISOString() } : s)
      );
      setStats((prev) => ({
        ...prev,
        pending:   status === 'CONFIRMED' || status === 'REJECTED' || status === 'DISPUTED'
                   ? Math.max(0, prev.pending - 1) : prev.pending,
        confirmed: status === 'CONFIRMED' ? prev.confirmed + 1 : prev.confirmed,
        disputed:  status === 'DISPUTED'  ? prev.disputed + 1  : prev.disputed,
      }));

      setReviewing(null);
      setReviewNote('');
      addToast(`Marked as ${status.toLowerCase()}`, 'success');
    } catch (err: unknown) {
      addToast(err instanceof Error ? err.message : 'Failed', 'error');
    } finally {
      setSaving(false);
    }
  }

  const TABS: { key: FilterTab; label: string; count?: number }[] = [
    { key: 'ALL',       label: 'All',       count: splits.length },
    { key: 'PENDING',   label: 'Pending',   count: stats.pending },
    { key: 'CONFIRMED', label: 'Confirmed', count: stats.confirmed },
    { key: 'DISPUTED',  label: 'Disputed',  count: stats.disputed },
    { key: 'REJECTED',  label: 'Rejected' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">Profit Split Payouts</h1>
        <p className="text-text-secondary mt-1">Review and confirm client profit split submissions.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Pending Review"    value={String(stats.pending)}   icon={<Clock className="h-5 w-5" />} />
        <StatCard label="Confirmed"         value={String(stats.confirmed)} icon={<CheckCircle className="h-5 w-5" />} />
        <StatCard label="Disputed"          value={String(stats.disputed)}  icon={<AlertTriangle className="h-5 w-5" />} />
        <StatCard label="Total Confirmed"   value={formatCurrency(stats.totalConfirmedAmount)} icon={<DollarSign className="h-5 w-5" />} />
      </div>

      <GlassCard padding="lg">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          {/* Tabs */}
          <div className="flex gap-1 flex-wrap">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  tab === t.key
                    ? 'bg-accent-primary/15 text-accent-primary border border-accent-primary/30'
                    : 'text-text-secondary hover:text-text-primary border border-transparent hover:border-white/[0.08]'
                }`}
              >
                {t.label}
                {t.count !== undefined && (
                  <span className="ml-1.5 text-[10px] opacity-70">({t.count})</span>
                )}
              </button>
            ))}
          </div>
          {/* Search */}
          <div className="sm:ml-auto relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-tertiary pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, tx…"
              className="pl-8 pr-3 py-2 rounded-lg text-sm bg-white/[0.04] border border-white/[0.08] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent-primary/50 w-56"
            />
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <DollarSign className="h-12 w-12 text-text-tertiary mx-auto mb-3" />
            <p className="text-text-secondary">
              {tab === 'PENDING' ? 'No pending submissions.' : 'No submissions found.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((s) => (
              <div key={s.id} className="rounded-xl border border-white/[0.06] overflow-hidden">
                {/* Row */}
                <button
                  className="w-full flex items-center gap-4 p-4 hover:bg-white/[0.02] transition-colors text-left"
                  onClick={() => setExpanded(expanded === s.id ? null : s.id)}
                >
                  {/* User */}
                  <div className="min-w-0 w-40 shrink-0">
                    <p className="text-sm font-medium truncate">{s.user.name ?? 'Unknown'}</p>
                    <p className="text-xs text-text-tertiary truncate">{s.user.email}</p>
                  </div>

                  {/* Account */}
                  <div className="flex-1 min-w-0 hidden sm:block">
                    <p className="text-sm text-text-secondary truncate">
                      {s.challenge
                        ? `${s.challenge.firmName} — ${s.challenge.accountSize}`
                        : s.order?.planName ?? 'Account Mgmt'}
                    </p>
                    <p className="text-xs text-text-tertiary">{formatDate(s.createdAt)}</p>
                  </div>

                  {/* Amounts */}
                  <div className="text-right shrink-0">
                    <p className="text-sm font-mono font-semibold">
                      {formatCurrency(s.amountSent)}
                      <span className="text-text-tertiary font-normal text-xs ml-1">{s.currency}</span>
                    </p>
                    <p className="text-xs text-text-tertiary">Due: {formatCurrency(s.amountDue)}</p>
                  </div>

                  {/* Status */}
                  <Badge variant={statusBadge[s.status]} size="sm" className="shrink-0 hidden md:flex">
                    {s.status}
                  </Badge>

                  {expanded === s.id
                    ? <ChevronUp className="h-4 w-4 text-text-tertiary shrink-0" />
                    : <ChevronDown className="h-4 w-4 text-text-tertiary shrink-0" />
                  }
                </button>

                {/* Expanded */}
                {expanded === s.id && (
                  <div className="px-4 pb-4 border-t border-white/[0.04] pt-4 space-y-4">
                    {/* Details grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                      {[
                        ['Total Payout', formatCurrency(s.totalPayout)],
                        ['Split %',      `${s.splitPercent}%`],
                        ['Amount Due',   formatCurrency(s.amountDue)],
                        ['Network',      s.network ?? '—'],
                      ].map(([label, value]) => (
                        <div key={label} className="p-2.5 rounded-lg bg-white/[0.02]">
                          <p className="text-text-tertiary text-xs mb-0.5">{label}</p>
                          <p className="font-medium text-sm">{value}</p>
                        </div>
                      ))}
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
                          <ExternalLink className="h-3.5 w-3.5" /> Open Screenshot
                        </a>
                      </div>
                    )}

                    {s.notes && (
                      <div>
                        <p className="text-text-tertiary text-xs mb-0.5">Client Notes</p>
                        <p className="text-sm text-text-secondary">{s.notes}</p>
                      </div>
                    )}

                    {/* Admin note if already reviewed */}
                    {s.adminNote && s.status !== 'PENDING' && (
                      <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                        <p className="text-xs text-text-tertiary mb-0.5">Your Note</p>
                        <p className="text-sm text-text-secondary">{s.adminNote}</p>
                      </div>
                    )}

                    {/* Review actions — only for PENDING or DISPUTED */}
                    {(s.status === 'PENDING' || s.status === 'DISPUTED') && (
                      reviewing === s.id ? (
                        <div className="space-y-3 p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                          <Textarea
                            label="Note to client (optional)"
                            placeholder="e.g. Payment received, thank you! or Amount is short by $X."
                            value={reviewNote}
                            onChange={(e) => setReviewNote(e.target.value)}
                            rows={2}
                          />
                          <div className="flex gap-2 flex-wrap">
                            <Button
                              size="sm"
                              variant="primary"
                              loading={saving}
                              icon={<CheckCircle className="h-3.5 w-3.5" />}
                              onClick={() => review(s.id, 'CONFIRMED')}
                            >
                              Confirm
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              loading={saving}
                              icon={<AlertTriangle className="h-3.5 w-3.5" />}
                              onClick={() => review(s.id, 'DISPUTED')}
                            >
                              Dispute
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              loading={saving}
                              icon={<X className="h-3.5 w-3.5" />}
                              onClick={() => review(s.id, 'REJECTED')}
                            >
                              Reject
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => { setReviewing(null); setReviewNote(''); }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => { setReviewing(s.id); setReviewNote(''); }}
                        >
                          Review this submission
                        </Button>
                      )
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
