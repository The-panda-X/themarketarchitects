'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Radio, Pause, Play, Wifi, WifiOff, Info, Bot, KeyRound, Copy, RefreshCw, Check } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';
import ProgressBar from '@/components/ui/ProgressBar';
import Skeleton from '@/components/ui/Skeleton';
import useToast from '@/hooks/useToast';
import { Table, TableHeader, TableRow, TableHead } from '@/components/ui/Table';
import { formatDate, formatRelativeTime } from '@/lib/utils';

interface ChallengeDetail {
  id: string;
  firmName: string;
  accountSize: string;
  status: string;
  currentPhase: number;
  currentProfit: number;
  targetProfit: number | null;
  currentDrawdown: number;
  maxDrawdown: number | null;
  daysTraded: number;
  winRate: number;
  balance: number | null;
  equity: number | null;
  openProfit: number | null;
  totalTrades: number;
  winCount: number;
  openTrades: number;
  adminNotes: string | null;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  // Signal hub fields
  riskPct: number;
  dailyDDLimit: number;
  totalDDLimit: number;
  dailyCapPct: number;
  allowedPairs: string[];
  isPaused: boolean;
  lastReportedAt: string | null;
  eaToken: string | null;
  user: { id: string; email: string; name: string | null };
  order: { planName: string; serviceType: string };
  dailyStats: Array<{ id: string; date: string; profit: number; loss: number; tradesCount: number; winCount: number }>;
}

const CHALLENGE_STATUSES = ['PENDING', 'IN_PROGRESS', 'PHASE_1', 'PHASE_2', 'PASSED', 'FUNDED', 'FAILED'];

export default function AdminChallengeDetailPage() {
  const params = useParams();
  const { addToast } = useToast();
  const [challenge, setChallenge] = useState<ChallengeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingSignal, setSavingSignal] = useState(false);
  const [togglingPause, setTogglingPause] = useState(false);
  const [generatingToken, setGeneratingToken] = useState(false);
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState({
    status: '',
    currentPhase: 1,
    currentProfit: 0,
    currentDrawdown: 0,
    targetProfit: 0,
    maxDrawdown: 0,
    startBalance: 0,
    daysTraded: 0,
    winRate: 0,
    adminNotes: '',
    startDate: '',
    endDate: '',
  });
  const [signalForm, setSignalForm] = useState({
    riskPct: 1.0,
    dailyDDLimit: 3.0,
    totalDDLimit: 7.0,
    dailyCapPct: 3.0,
    allowedPairs: '',
  });

  useEffect(() => {
    fetch(`/api/admin/challenges/${params.id}`)
      .then((r) => r.json())
      .then((d) => {
        setChallenge(d.data);
        if (d.data) {
          setForm({
            status: d.data.status,
            currentPhase: d.data.currentPhase,
            currentProfit: d.data.currentProfit,
            currentDrawdown: d.data.currentDrawdown,
            targetProfit: d.data.targetProfit ?? 0,
            maxDrawdown: d.data.maxDrawdown ?? 0,
            startBalance: d.data.startBalance ?? 0,
            daysTraded: d.data.daysTraded,
            winRate: d.data.winRate,
            adminNotes: d.data.adminNotes ?? '',
            startDate: d.data.startDate ? d.data.startDate.slice(0, 10) : '',
            endDate: d.data.endDate ? d.data.endDate.slice(0, 10) : '',
          });
          setSignalForm({
            riskPct: d.data.riskPct ?? 1.0,
            dailyDDLimit: d.data.dailyDDLimit ?? 3.0,
            totalDDLimit: d.data.totalDDLimit ?? 7.0,
            dailyCapPct: d.data.dailyCapPct ?? 3.0,
            allowedPairs: (d.data.allowedPairs ?? []).join(', '),
          });
        }
      })
      .finally(() => setLoading(false));
  }, [params.id]);

  const handleSaveSignal = async () => {
    setSavingSignal(true);
    try {
      const res = await fetch(`/api/admin/challenges/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          riskPct: signalForm.riskPct,
          dailyDDLimit: signalForm.dailyDDLimit,
          totalDDLimit: signalForm.totalDDLimit,
          dailyCapPct: signalForm.dailyCapPct,
          allowedPairs: signalForm.allowedPairs.split(',').map(s => s.trim().toUpperCase()).filter(Boolean),
        }),
      });
      if (res.ok) {
        addToast('Signal settings saved.', 'success');
      } else {
        addToast('Failed to save signal settings.', 'error');
      }
    } finally {
      setSavingSignal(false);
    }
  };

  const handleTogglePause = async () => {
    if (!challenge) return;
    setTogglingPause(true);
    try {
      const res = await fetch(`/api/admin/challenges/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPaused: !challenge.isPaused }),
      });
      if (res.ok) {
        setChallenge(prev => prev ? { ...prev, isPaused: !prev.isPaused } : prev);
        addToast(challenge.isPaused ? 'Account resumed — signals will be delivered.' : 'Account paused — signals will be skipped.', 'success');
      }
    } finally {
      setTogglingPause(false);
    }
  };

  const handleGenerateToken = async () => {
    setGeneratingToken(true);
    try {
      const res = await fetch(`/api/admin/challenges/${params.id}/token`, { method: 'POST' });
      if (res.ok) {
        const d = await res.json();
        setChallenge(prev => prev ? { ...prev, eaToken: d.data.token } : prev);
        addToast('Token generated. Share it with the client.', 'success');
      } else {
        addToast('Failed to generate token.', 'error');
      }
    } finally {
      setGeneratingToken(false);
    }
  };

  const handleCopyToken = async () => {
    if (!challenge?.eaToken) return;
    await navigator.clipboard.writeText(challenge.eaToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/challenges/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          targetProfit: form.targetProfit || null,
          maxDrawdown: form.maxDrawdown || null,
          startBalance: form.startBalance || null,
          startDate: form.startDate || null,
          endDate: form.endDate || null,
        }),
      });
      if (res.ok) {
        const d = await res.json();
        setChallenge((prev) => prev ? { ...prev, ...d.data } : prev);
        addToast('Challenge updated.', 'success');
      } else {
        addToast('Failed to update.', 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="space-y-4 max-w-4xl">
      <Skeleton className="h-8 w-32" />
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
      </div>
    </div>
  );

  if (!challenge) return <p className="text-text-secondary">Challenge not found.</p>;

  const profitPct = challenge.targetProfit ? (challenge.currentProfit / challenge.targetProfit) * 100 : 0;
  const ddPct = challenge.maxDrawdown ? (challenge.currentDrawdown / challenge.maxDrawdown) * 100 : 0;

  // EA live status: consider online if reported within last 5 minutes
  const eaConnected = !!challenge.eaToken;
  const eaOnline = challenge.lastReportedAt
    ? (Date.now() - new Date(challenge.lastReportedAt).getTime()) < 5 * 60 * 1000
    : false;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Link href="/admin/challenges">
          <Button variant="ghost" size="sm" icon={<ArrowLeft className="h-4 w-4" />}>Challenges</Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-heading font-bold">{challenge.firmName} — {challenge.accountSize}</h1>
          <p className="text-xs text-text-tertiary mt-0.5">{challenge.order.planName}</p>
        </div>
        <Badge variant={challenge.status === 'PASSED' ? 'green' : challenge.status === 'FAILED' ? 'red' : 'blue'} >
          {challenge.status.replace('_', ' ')}
        </Badge>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {challenge.balance != null && (
          <GlassCard>
            <p className="text-xs text-text-tertiary uppercase tracking-wider">Balance</p>
            <p className="text-xl font-bold font-mono mt-1 text-white">${challenge.balance.toFixed(2)}</p>
          </GlassCard>
        )}
        {challenge.equity != null && (
          <GlassCard>
            <p className="text-xs text-text-tertiary uppercase tracking-wider">Equity</p>
            <p className={`text-xl font-bold font-mono mt-1 ${(challenge.equity) >= (challenge.balance ?? 0) ? 'text-success' : 'text-danger'}`}>
              ${challenge.equity.toFixed(2)}
            </p>
          </GlassCard>
        )}
        <GlassCard>
          <p className="text-xs text-text-tertiary uppercase tracking-wider">Profit</p>
          <p className="text-xl font-bold font-mono mt-1 text-success">${challenge.currentProfit.toFixed(2)}</p>
          <ProgressBar value={Math.min(100, profitPct)} color="green" size="sm" className="mt-2" />
          <p className="text-xs text-text-tertiary mt-1">Target: ${challenge.targetProfit?.toFixed(0) ?? '—'}</p>
        </GlassCard>
        <GlassCard>
          <p className="text-xs text-text-tertiary uppercase tracking-wider">Drawdown</p>
          <p className="text-xl font-bold font-mono mt-1 text-danger">{challenge.currentDrawdown.toFixed(2)}%</p>
          <ProgressBar value={Math.min(100, ddPct)} color="red" size="sm" className="mt-2" />
          <p className="text-xs text-text-tertiary mt-1">Max: {challenge.maxDrawdown?.toFixed(1) ?? '—'}%</p>
        </GlassCard>
        <GlassCard>
          <p className="text-xs text-text-tertiary uppercase tracking-wider">Win Rate</p>
          <p className="text-xl font-bold font-mono mt-1">{challenge.winRate.toFixed(1)}%</p>
          <p className="text-xs text-text-tertiary mt-1">{challenge.daysTraded} days traded</p>
        </GlassCard>
        <GlassCard>
          <p className="text-xs text-text-tertiary uppercase tracking-wider">Open Trades</p>
          <p className="text-xl font-bold font-mono mt-1">{challenge.openTrades}</p>
          {challenge.openProfit != null && (
            <p className={`text-xs font-mono mt-1 ${challenge.openProfit >= 0 ? 'text-success' : 'text-danger'}`}>
              {challenge.openProfit >= 0 ? '+' : ''}{challenge.openProfit.toFixed(2)} P/L
            </p>
          )}
        </GlassCard>
        <GlassCard>
          <p className="text-xs text-text-tertiary uppercase tracking-wider">Total Trades</p>
          <p className="text-xl font-bold font-mono mt-1">{challenge.totalTrades}</p>
          <p className="text-xs text-text-tertiary mt-1">
            <span className="text-success">{challenge.winCount}W</span>
            {' / '}
            <span className="text-danger">{challenge.totalTrades - challenge.winCount}L</span>
          </p>
        </GlassCard>
        <GlassCard>
          <p className="text-xs text-text-tertiary uppercase tracking-wider">Client</p>
          <Link href={`/admin/users/${challenge.user.id}`} className="text-sm text-accent-primary hover:underline mt-1 block truncate">
            {challenge.user.email}
          </Link>
          <p className="text-xs text-text-tertiary mt-1">{challenge.user.name ?? '—'}</p>
        </GlassCard>
        {/* EA Live Status */}
        <GlassCard>
          <p className="text-xs text-text-tertiary uppercase tracking-wider">EA Status</p>
          <div className="flex items-center gap-2 mt-1">
            {eaConnected ? (
              eaOnline ? (
                <Wifi className="h-5 w-5 text-success" />
              ) : (
                <WifiOff className="h-5 w-5 text-danger" />
              )
            ) : (
              <WifiOff className="h-5 w-5 text-text-tertiary" />
            )}
            <span className={`text-sm font-semibold ${
              !eaConnected ? 'text-text-tertiary' :
              eaOnline ? 'text-success' : 'text-danger'
            }`}>
              {!eaConnected ? 'Not set' : eaOnline ? 'Live' : 'Offline'}
            </span>
          </div>
          <p className="text-xs text-text-tertiary mt-1">
            {challenge.lastReportedAt
              ? `Last: ${formatRelativeTime(challenge.lastReportedAt)}`
              : 'Never reported'}
          </p>
        </GlassCard>
      </div>

      {/* Update Challenge — compact form */}
      <GlassCard padding="md">
        {/* Header row with inline save */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-heading font-semibold text-sm">Update Challenge</h3>
          <Button variant="primary" size="sm" loading={saving} onClick={handleSave}>
            Save Changes
          </Button>
        </div>

        {/* Override notice */}
        <div className="mb-3 flex items-start gap-2 px-3 py-2.5 rounded-xl bg-accent-primary/5 border border-accent-primary/15">
          <Bot className="h-3.5 w-3.5 text-accent-primary mt-0.5 shrink-0" />
          <p className="text-xs text-text-tertiary leading-relaxed">
            <span className="text-text-secondary font-medium">EA v6 auto-updates live stats</span>
            {' '}— Profit, Drawdown, Win Rate and Days Traded refresh automatically every 60 s.
            Only edit those fields to correct a wrong value or when the EA is offline.
            {' '}<span className="text-text-secondary font-medium">Changing Status</span> sends an automatic notification to the client.
          </p>
        </div>

        {/* Row 1 — status / phase / dates */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Select
            label="Status"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
          >
            {CHALLENGE_STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
          </Select>
          <Select
            label="Phase"
            value={String(form.currentPhase)}
            onChange={(e) => setForm({ ...form, currentPhase: parseInt(e.target.value) })}
          >
            <option value="1">Phase 1</option>
            <option value="2">Phase 2</option>
          </Select>
          <Input
            label="Start Date"
            type="date"
            value={form.startDate}
            onChange={(e) => setForm({ ...form, startDate: e.target.value })}
          />
          <Input
            label="End Date"
            type="date"
            value={form.endDate}
            onChange={(e) => setForm({ ...form, endDate: e.target.value })}
          />
        </div>

        {/* Row 2 — profit / drawdown targets + live overrides */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
          <div>
            <label className="flex items-center gap-1 text-xs text-text-tertiary mb-1.5 font-medium uppercase tracking-wider">
              Current Profit ($)
              <span className="inline-flex items-center gap-0.5 text-[10px] text-success/80 font-normal normal-case tracking-normal">
                <Bot className="h-2.5 w-2.5" /> auto
              </span>
            </label>
            <input
              type="number"
              className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-primary/50 transition-colors"
              value={form.currentProfit}
              onChange={(e) => setForm({ ...form, currentProfit: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <Input
            label="Start Balance ($)"
            type="number"
            value={form.startBalance}
            onChange={(e) => setForm({ ...form, startBalance: parseFloat(e.target.value) || 0 })}
          />
          <Input
            label="Target Profit ($)"
            type="number"
            value={form.targetProfit}
            onChange={(e) => setForm({ ...form, targetProfit: parseFloat(e.target.value) || 0 })}
          />
          <div>
            <label className="flex items-center gap-1 text-xs text-text-tertiary mb-1.5 font-medium uppercase tracking-wider">
              Drawdown (%)
              <span className="inline-flex items-center gap-0.5 text-[10px] text-success/80 font-normal normal-case tracking-normal">
                <Bot className="h-2.5 w-2.5" /> auto
              </span>
            </label>
            <input
              type="number"
              className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-primary/50 transition-colors"
              value={form.currentDrawdown}
              onChange={(e) => setForm({ ...form, currentDrawdown: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <Input
            label="Max Drawdown (%)"
            type="number"
            value={form.maxDrawdown}
            onChange={(e) => setForm({ ...form, maxDrawdown: parseFloat(e.target.value) || 0 })}
          />
        </div>

        {/* Row 3 — days / win rate */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
          <div>
            <label className="flex items-center gap-1 text-xs text-text-tertiary mb-1.5 font-medium uppercase tracking-wider">
              Days Traded
              <span className="inline-flex items-center gap-0.5 text-[10px] text-success/80 font-normal normal-case tracking-normal">
                <Bot className="h-2.5 w-2.5" /> auto
              </span>
            </label>
            <input
              type="number"
              className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-primary/50 transition-colors"
              value={form.daysTraded}
              onChange={(e) => setForm({ ...form, daysTraded: parseInt(e.target.value) || 0 })}
            />
          </div>
          <div>
            <label className="flex items-center gap-1 text-xs text-text-tertiary mb-1.5 font-medium uppercase tracking-wider">
              Win Rate (%)
              <span className="inline-flex items-center gap-0.5 text-[10px] text-success/80 font-normal normal-case tracking-normal">
                <Bot className="h-2.5 w-2.5" /> auto
              </span>
            </label>
            <input
              type="number"
              className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-primary/50 transition-colors"
              value={form.winRate}
              onChange={(e) => setForm({ ...form, winRate: parseFloat(e.target.value) || 0 })}
            />
          </div>
          {/* Admin Notes spans the remaining 2 cols */}
          <div className="lg:col-span-2">
            <Textarea
              label="Admin Notes"
              rows={2}
              value={form.adminNotes}
              onChange={(e) => setForm({ ...form, adminNotes: e.target.value })}
              placeholder="Internal notes visible only to admins..."
            />
          </div>
        </div>
      </GlassCard>

      {/* Signal Hub Settings */}
      <GlassCard padding="lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading font-semibold flex items-center gap-2">
            <Radio className="h-4 w-4 text-accent-primary" /> Signal Hub Settings
          </h3>
          <Button
            variant={challenge.isPaused ? 'primary' : 'secondary'}
            size="sm"
            loading={togglingPause}
            onClick={handleTogglePause}
            icon={challenge.isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
          >
            {challenge.isPaused ? 'Resume Signals' : 'Pause Signals'}
          </Button>
        </div>

        {challenge.isPaused && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-warning/10 border border-warning/30 text-sm text-warning">
            ⚠️ Signals are currently paused for this account. No signals will be delivered until resumed.
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Risk per Trade (%)"
            type="number"
            step="0.01"
            min="0.01"
            value={signalForm.riskPct}
            onChange={e => setSignalForm(f => ({...f, riskPct: e.target.value === '' ? 0 : parseFloat(e.target.value)}))}
          />
          <Input
            label="Daily DD Limit (%)"
            type="number"
            step="0.01"
            min="0.01"
            value={signalForm.dailyDDLimit}
            onChange={e => setSignalForm(f => ({...f, dailyDDLimit: e.target.value === '' ? 0 : parseFloat(e.target.value)}))}
          />
          <Input
            label="Total DD Limit (%)"
            type="number"
            step="0.01"
            min="0.01"
            value={signalForm.totalDDLimit}
            onChange={e => setSignalForm(f => ({...f, totalDDLimit: e.target.value === '' ? 0 : parseFloat(e.target.value)}))}
          />
          <Input
            label="Daily Profit Cap (%)"
            type="number"
            step="0.01"
            min="0.01"
            value={signalForm.dailyCapPct}
            onChange={e => setSignalForm(f => ({...f, dailyCapPct: e.target.value === '' ? 0 : parseFloat(e.target.value)}))}
          />
        </div>
        <div className="mt-4 space-y-4">
          <Input
            label="Allowed Pairs (comma-separated, leave empty for all)"
            placeholder="e.g. XAUUSD, EURUSD, GBPUSD"
            value={signalForm.allowedPairs}
            onChange={e => setSignalForm(f => ({...f, allowedPairs: e.target.value}))}
          />
        </div>

        {/* ── Connection Token ───────────────────────────────────────── */}
        <div className="mt-5 rounded-xl border border-white/[0.08] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-white/[0.03] border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-accent-gold" />
              <span className="text-sm font-semibold">EA Connection Token</span>
            </div>
            <Button
              variant="secondary"
              size="sm"
              loading={generatingToken}
              onClick={handleGenerateToken}
              icon={challenge.eaToken
                ? <RefreshCw className="h-3.5 w-3.5" />
                : <KeyRound className="h-3.5 w-3.5" />}
            >
              {challenge.eaToken ? 'Regenerate' : 'Generate Token'}
            </Button>
          </div>

          <div className="px-4 py-3">
            {challenge.eaToken ? (
              <>
                <div className="flex items-center gap-2">
                  <code className="flex-1 font-mono text-sm text-accent-primary bg-accent-primary/5 px-3 py-2 rounded-lg border border-accent-primary/20 tracking-widest">
                    {challenge.eaToken}
                  </code>
                  <button
                    onClick={handleCopyToken}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all border border-white/[0.08] hover:bg-white/[0.06] text-text-secondary hover:text-text-primary"
                  >
                    {copied
                      ? <><Check className="h-3.5 w-3.5 text-success" /> Copied</>
                      : <><Copy className="h-3.5 w-3.5" /> Copy</>}
                  </button>
                </div>
                <div className="mt-3 flex items-start gap-2 text-xs text-text-tertiary">
                  <Info className="h-3.5 w-3.5 shrink-0 mt-0.5 text-accent-primary" />
                  <span>
                    Share this token with the client. They enter it in{' '}
                    <code className="text-accent-primary">InpAccountToken</code> in{' '}
                    <strong className="text-text-secondary">SignalExecutor_v6</strong>.
                    The EA will then automatically report to this account — no filename matching needed.
                    {' '}<span className="text-warning">Regenerating revokes the old token immediately.</span>
                  </span>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2 text-xs text-text-tertiary py-1">
                <Info className="h-3.5 w-3.5 shrink-0 text-text-tertiary" />
                <span>
                  No token yet. Click <strong className="text-text-secondary">Generate Token</strong> to create a unique code for this account.
                  The client enters it once in their EA and the connection is established automatically.
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4">
          <Button variant="primary" size="sm" loading={savingSignal} onClick={handleSaveSignal}>
            Save Signal Settings
          </Button>
        </div>
      </GlassCard>

      {/* Daily Stats */}
      {challenge.dailyStats.length > 0 && (
        <GlassCard padding="lg">
          <h3 className="font-heading font-semibold mb-4">Daily Stats (Last 30 Days)</h3>
          <Table>
            <TableHeader>
              <TableRow hoverable={false}>
                <TableHead>Date</TableHead>
                <TableHead align="right">Profit</TableHead>
                <TableHead align="right">Loss</TableHead>
                <TableHead align="right">Trades</TableHead>
                <TableHead align="right">Wins</TableHead>
              </TableRow>
            </TableHeader>
            <tbody className="divide-y divide-white/[0.04]">
              {challenge.dailyStats.map((stat) => (
                <tr key={stat.id} className="hover:bg-white/[0.02]">
                  <td className="px-4 py-2 text-sm text-text-secondary">{formatDate(stat.date)}</td>
                  <td className="px-4 py-2 text-sm text-success font-mono text-right">+${stat.profit.toFixed(2)}</td>
                  <td className="px-4 py-2 text-sm text-danger font-mono text-right">-${stat.loss.toFixed(2)}</td>
                  <td className="px-4 py-2 text-sm text-text-secondary text-right">{stat.tradesCount}</td>
                  <td className="px-4 py-2 text-sm text-text-secondary text-right">{stat.winCount}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </GlassCard>
      )}
    </div>
  );
}
