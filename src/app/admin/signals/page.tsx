'use client';

import { useEffect, useState, useCallback } from 'react';
import { Send, Radio, CheckCircle, XCircle, AlertTriangle, ChevronDown, ChevronUp, Trash2, Loader2, MessageSquare, AtSign, Save, Pencil, X, Users, Filter } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Skeleton from '@/components/ui/Skeleton';
import Modal from '@/components/ui/Modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty, TablePagination } from '@/components/ui/Table';
import { formatRelativeTime } from '@/lib/utils';
import useAuth from '@/hooks/useAuth';
import useToast from '@/hooks/useToast';

const PAIRS = ['XAUUSD','XAGUSD','EURUSD','GBPUSD','USDJPY','USDCHF','AUDUSD','NZDUSD','USDCAD','EURGBP','EURJPY','GBPJPY','US30','NAS100','SPX500','BTCUSD','ETHUSD'];

/* ── Signal Log types ─────────────────────────────────────────────── */
interface Delivery {
  id: string;
  status: string;
  skipReason: string | null;
  challenge: { id: string; firmName: string; accountSize: string; user: { email: string; name: string | null } };
}

interface SignalLog {
  id: string;
  pair: string;
  direction: string;
  entry: number | null;
  sl: number;
  tp1: number | null;
  tp2: number | null;
  tp3: number | null;
  riskPct: number | null;
  source: string;
  totalSent: number;
  totalSkipped: number;
  totalFailed: number;
  senderId: string | null;
  senderNickname: string | null;
  sentAt: string;
  deliveries: Delivery[];
}

interface TraderStat {
  senderId: string | null;
  senderNickname: string | null;
  totalSignals: number;
}

export default function AdminSignalsPage() {
  const { canDelete, isTrader } = useAuth();
  const { addToast } = useToast();

  /* ── Signal Log state ───────────────────────────────────────────── */
  const [signals, setSignals]     = useState<SignalLog[]>([]);
  const [loading, setLoading]     = useState(true);
  const [page, setPage]           = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal]         = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SignalLog | null>(null);
  const [clearAllOpen, setClearAllOpen] = useState(false);
  const [deleting, setDeleting]   = useState(false);

  /* ── Trader stats & filter ─────────────────────────────────────── */
  const [traderStats, setTraderStats] = useState<TraderStat[]>([]);
  const [senderFilter, setSenderFilter] = useState<string | null>(null);

  /* ── Send Signal state ──────────────────────────────────────────── */
  const [modalOpen, setModalOpen] = useState(false);
  const [sending, setSending]     = useState(false);
  const [form, setForm] = useState({
    pair: 'XAUUSD', direction: 'BUY',
    entry: '', sl: '', tp1: '', tp2: '', tp3: '', risk: '',
  });

  /* ── Signal Nickname state ──────────────────────────────────────── */
  const [nickname, setNickname]       = useState<string | null>(null);
  const [defaultDisplay, setDefaultDisplay] = useState('Admin');
  const [editingNick, setEditingNick] = useState(false);
  const [nickDraft, setNickDraft]     = useState('');
  const [savingNick, setSavingNick]   = useState(false);
  const [canOverrideRisk, setCanOverrideRisk] = useState(true);

  const fetchNickname = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/signal-profile');
      if (res.ok) {
        const d = await res.json();
        setNickname(d.data?.signalNickname ?? null);
        setDefaultDisplay(d.data?.defaultDisplay ?? 'Admin');
        setCanOverrideRisk(d.data?.canOverrideRisk ?? true);
      }
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchNickname(); }, [fetchNickname]);

  const handleSaveNickname = async () => {
    setSavingNick(true);
    try {
      const trimmed = nickDraft.trim();
      const res = await fetch('/api/admin/signal-profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signalNickname: trimmed.length === 0 ? null : trimmed }),
      });
      const d = await res.json();
      if (res.ok) {
        setNickname(d.data?.signalNickname ?? null);
        setEditingNick(false);
        addToast('Nickname saved', 'success');
      } else {
        addToast(d.error ?? 'Failed to save nickname', 'error');
      }
    } finally {
      setSavingNick(false);
    }
  };

  /* ── Fetch Signal Logs ──────────────────────────────────────────── */
  const fetchSignals = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (senderFilter) params.set('sender', senderFilter);
      const res = await fetch(`/api/admin/signals?${params}`);
      if (res.ok) {
        const d = await res.json();
        setSignals(d.data.data ?? []);
        setTotalPages(d.data.totalPages ?? 1);
        setTotal(d.data.total ?? 0);
        setTraderStats(d.data.traderStats ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [page, senderFilter]);

  useEffect(() => { fetchSignals(); }, [fetchSignals]);

  /* ── Send Signal to Discord ─────────────────────────────────────── */
  const handleSend = async () => {
    if (!form.sl) { addToast('Stop Loss is required', 'error'); return; }
    setSending(true);
    try {
      const res = await fetch('/api/admin/signals/discord', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const d = await res.json();
      if (res.ok) {
        addToast('Signal sent to Discord — executing on all EAs', 'success');
        setModalOpen(false);
        setForm({ pair: 'XAUUSD', direction: 'BUY', entry: '', sl: '', tp1: '', tp2: '', tp3: '', risk: '' });
        fetchSignals();
      } else {
        addToast(d.error ?? 'Failed to send signal', 'error');
      }
    } finally {
      setSending(false);
    }
  };

  /* ── Delete Signal Log ──────────────────────────────────────────── */
  const handleDeleteOne = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/signals?id=${deleteTarget.id}`, { method: 'DELETE' });
      if (res.ok) { addToast('Signal deleted', 'success'); setDeleteTarget(null); fetchSignals(); }
      else addToast('Failed to delete', 'error');
    } catch { addToast('Failed to delete', 'error'); }
    finally { setDeleting(false); }
  };

  const handleClearAll = async () => {
    setDeleting(true);
    try {
      const res = await fetch('/api/admin/signals?all=true', { method: 'DELETE' });
      if (res.ok) {
        const d = await res.json();
        addToast(`Cleared ${d.data?.deleted ?? 0} signals`, 'success');
        setClearAllOpen(false);
        setPage(1);
        fetchSignals();
      } else addToast('Failed to clear', 'error');
    } catch { addToast('Failed to clear', 'error'); }
    finally { setDeleting(false); }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold flex items-center gap-2">
            <Radio className="h-6 w-6 text-accent-primary" /> Signal Hub
          </h1>
          <p className="text-text-secondary mt-1">Send signals to Discord for instant EA execution</p>
        </div>
        <div className="flex items-center gap-2">
          {canDelete && total > 0 && (
            <button
              onClick={() => setClearAllOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-danger/30 text-danger text-sm font-medium hover:bg-danger/5 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              Clear All
            </button>
          )}
          <Button variant="primary" icon={<MessageSquare className="h-4 w-4" />} onClick={() => setModalOpen(true)}>
            Send Signal
          </Button>
        </div>
      </div>

      {/* Signal Nickname banner */}
      <GlassCard padding="md">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <AtSign className="h-5 w-5 text-accent-primary shrink-0" />
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wider text-text-tertiary">Your Signal Tag</p>
              {editingNick ? (
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    autoFocus
                    value={nickDraft}
                    onChange={(e) => setNickDraft(e.target.value)}
                    placeholder="e.g. trader_x, alpha-1"
                    className="!py-1.5 !text-sm w-56"
                    maxLength={30}
                  />
                  <Button variant="primary" size="sm" loading={savingNick} icon={<Save className="h-3.5 w-3.5" />} onClick={handleSaveNickname}>
                    Save
                  </Button>
                  <button
                    onClick={() => { setEditingNick(false); setNickDraft(nickname ?? ''); }}
                    className="p-1.5 text-text-tertiary hover:text-text-primary"
                    title="Cancel"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-mono text-sm font-semibold text-text-primary">
                    @{nickname ?? defaultDisplay.toLowerCase().replace(/[^a-z0-9]/g, '')}
                  </span>
                  {!nickname && (
                    <Badge variant="default" size="sm">Fallback</Badge>
                  )}
                </div>
              )}
            </div>
          </div>
          {!editingNick && (
            <button
              onClick={() => { setNickDraft(nickname ?? ''); setEditingNick(true); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-text-secondary hover:text-text-primary hover:bg-white/[0.04] transition-colors"
            >
              <Pencil className="h-3.5 w-3.5" />
              {nickname ? 'Edit' : 'Set Nickname'}
            </button>
          )}
        </div>
        <p className="text-xs text-text-tertiary mt-2">
          Your tag is stamped on every signal you send and appears in Discord so the team knows who issued the trade.
        </p>
      </GlassCard>

      {/* Stats */}
      <div className={`grid gap-4 ${isTrader ? 'grid-cols-2' : 'grid-cols-3'}`}>
        <GlassCard padding="md">
          <div className="flex items-center gap-3">
            <Radio className="h-5 w-5 text-accent-primary" />
            <div>
              <p className="text-2xl font-bold font-mono">{total}</p>
              <p className="text-xs text-text-tertiary">{senderFilter ? 'Filtered Signals' : 'Total Signals'}</p>
            </div>
          </div>
        </GlassCard>
        <GlassCard padding="md">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-success" />
            <div>
              <p className="text-2xl font-bold font-mono">
                {signals.filter(s => new Date(s.sentAt) > new Date(Date.now() - 7*86400000)).length}
              </p>
              <p className="text-xs text-text-tertiary">Signals This Week</p>
            </div>
          </div>
        </GlassCard>
        {!isTrader && (
          <GlassCard padding="md">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-warning" />
              <div>
                <p className="text-2xl font-bold font-mono">
                  {signals.filter(s => new Date(s.sentAt) > new Date(Date.now() - 7*86400000)).reduce((a,s) => a + s.totalSkipped, 0)}
                </p>
                <p className="text-xs text-text-tertiary">Skipped This Week</p>
              </div>
            </div>
          </GlassCard>
        )}
      </div>

      {/* Per-Trader Breakdown */}
      {traderStats.length > 0 && (
        <GlassCard padding="md">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-2">
              <Users className="h-4 w-4" /> Signals by Trader
            </h2>
            {senderFilter && (
              <button
                onClick={() => { setSenderFilter(null); setPage(1); }}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs text-accent-primary hover:bg-accent-primary/10 transition-colors"
              >
                <X className="h-3.5 w-3.5" /> Clear Filter
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {traderStats.map(t => (
              <button
                key={t.senderId ?? 'unknown'}
                onClick={() => { setSenderFilter(senderFilter === t.senderId ? null : t.senderId); setPage(1); }}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  senderFilter === t.senderId
                    ? 'bg-accent-primary/20 border border-accent-primary/40 text-accent-primary'
                    : 'bg-white/[0.04] border border-white/[0.06] text-text-secondary hover:text-text-primary hover:bg-white/[0.06]'
                }`}
              >
                <span className="font-mono">@{t.senderNickname ?? 'unknown'}</span>
                <span className="bg-white/[0.08] px-1.5 py-0.5 rounded-md font-mono font-bold text-text-primary">{t.totalSignals}</span>
              </button>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Signal History */}
      <GlassCard padding="md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Signal History</h2>
          {senderFilter && (
            <Badge variant="purple" size="sm">
              <Filter className="h-3 w-3 mr-1 inline" />
              Filtered by trader
            </Badge>
          )}
        </div>
        {loading ? (
          <div className="space-y-3">{Array.from({length:6}).map((_,i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow hoverable={false}>
                  <TableHead>Time</TableHead>
                  <TableHead>Signal</TableHead>
                  <TableHead>Entry / SL</TableHead>
                  <TableHead>Risk %</TableHead>
                  <TableHead>TPs</TableHead>
                  <TableHead>Sent By</TableHead>
                  <TableHead>Source</TableHead>
                  {!isTrader && <TableHead align="center">Sent</TableHead>}
                  {!isTrader && <TableHead align="center">Skipped</TableHead>}
                  {!isTrader && <TableHead align="center">Details</TableHead>}
                  {canDelete && <TableHead align="center">Delete</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {signals.length === 0 ? (
                  <TableEmpty colSpan={isTrader ? 7 : (canDelete ? 11 : 10)} message="No signals yet. Click 'Send Signal' to post a trade to Discord." />
                ) : signals.map(sig => (
                  <>
                    <TableRow key={sig.id} onClick={!isTrader ? () => setExpandedId(expandedId === sig.id ? null : sig.id) : undefined}>
                      <TableCell>
                        <span className="text-xs text-text-tertiary">{formatRelativeTime(sig.sentAt)}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant={sig.direction === 'BUY' ? 'green' : 'red'} size="sm">{sig.direction}</Badge>
                          <span className="font-mono font-semibold text-sm">{sig.pair}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-xs font-mono">{sig.entry ?? 'Market'} / <span className="text-danger">{sig.sl}</span></p>
                      </TableCell>
                      <TableCell>
                        {sig.riskPct ? (
                          <span className="font-mono text-xs font-semibold text-accent-primary">{sig.riskPct}%</span>
                        ) : (
                          <span className="text-xs text-text-tertiary">Default</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <p className="text-xs font-mono text-text-tertiary">
                          {[sig.tp1, sig.tp2, sig.tp3].filter(Boolean).join(' · ') || '—'}
                        </p>
                      </TableCell>
                      <TableCell>
                        {sig.senderNickname ? (
                          <Badge variant="blue" size="sm">
                            <span className="font-mono">@{sig.senderNickname}</span>
                          </Badge>
                        ) : (
                          <span className="text-xs text-text-tertiary">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={sig.source === 'admin' ? 'gold' : sig.source === 'discord_webhook' ? 'purple' : 'default'} size="sm">
                          {sig.source === 'admin' ? 'Admin' : sig.source === 'discord_webhook' ? 'Website' : 'Discord'}
                        </Badge>
                      </TableCell>
                      {!isTrader && (
                        <TableCell align="center">
                          <span className="text-success font-mono font-bold">{sig.totalSent}</span>
                        </TableCell>
                      )}
                      {!isTrader && (
                        <TableCell align="center">
                          <span className="text-warning font-mono">{sig.totalSkipped}</span>
                        </TableCell>
                      )}
                      {!isTrader && (
                        <TableCell align="center">
                          <button className="text-text-tertiary hover:text-text-primary transition-colors">
                            {expandedId === sig.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </button>
                        </TableCell>
                      )}
                      {canDelete && (
                        <TableCell align="center">
                          <button
                            onClick={(e) => { e.stopPropagation(); setDeleteTarget(sig); }}
                            className="p-1.5 rounded-lg text-text-tertiary hover:text-danger hover:bg-danger/5 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </TableCell>
                      )}
                    </TableRow>

                    {/* Expanded delivery details — admin/moderator only */}
                    {!isTrader && expandedId === sig.id && sig.deliveries?.length > 0 && (
                      <tr key={`${sig.id}-expanded`}>
                        <td colSpan={canDelete ? 11 : 10} className="px-4 pb-3">
                          <div className="bg-white/[0.03] rounded-xl p-4 space-y-2">
                            <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-3">
                              Delivery Report — {sig.deliveries.length} accounts
                            </p>
                            <div className="grid grid-cols-1 gap-1.5 max-h-48 overflow-y-auto">
                              {sig.deliveries.map(d => (
                                <div key={d.id} className="flex items-center justify-between text-xs py-1.5 px-3 rounded-lg bg-white/[0.03]">
                                  <div className="flex items-center gap-2">
                                    {d.status === 'sent'
                                      ? <CheckCircle className="h-3.5 w-3.5 text-success flex-shrink-0" />
                                      : d.status === 'failed'
                                      ? <XCircle className="h-3.5 w-3.5 text-danger flex-shrink-0" />
                                      : <AlertTriangle className="h-3.5 w-3.5 text-warning flex-shrink-0" />
                                    }
                                    <span className="text-text-primary font-medium">{d.challenge.user.name ?? d.challenge.user.email}</span>
                                    <span className="text-text-tertiary">· {d.challenge.firmName} {d.challenge.accountSize}</span>
                                  </div>
                                  {d.skipReason && (
                                    <span className="text-text-tertiary italic">{d.skipReason}</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </TableBody>
            </Table>
            <TablePagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
      </GlassCard>

      {/* ═══════════════════════════════════════════════════════════
          SEND SIGNAL MODAL (Discord)
          ═══════════════════════════════════════════════════════════ */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Send Trade Signal"
        description="Post a signal to Discord. DiscordBridge picks it up instantly and writes signal files for all EAs."
        size="lg"
      >
        <div className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-text-tertiary mb-1.5 block font-medium uppercase tracking-wider">Pair</label>
              <Select value={form.pair} onChange={e => setForm(f => ({...f, pair: e.target.value}))}>
                {PAIRS.map(p => <option key={p} value={p}>{p}</option>)}
              </Select>
            </div>
            <div>
              <label className="text-xs text-text-tertiary mb-1.5 block font-medium uppercase tracking-wider">Direction</label>
              <Select value={form.direction} onChange={e => setForm(f => ({...f, direction: e.target.value}))}>
                <option value="BUY">BUY</option>
                <option value="SELL">SELL</option>
              </Select>
            </div>
          </div>

          <div className={`grid gap-3 [&_label]:min-h-[2.5rem] [&_label]:flex [&_label]:items-end ${canOverrideRisk ? 'grid-cols-3' : 'grid-cols-2'}`}>
            <Input label="Entry Price (0 = market)" type="number" placeholder="e.g. 2350" value={form.entry} onChange={e => setForm(f => ({...f, entry: e.target.value}))} />
            <Input label="Stop Loss *" type="number" placeholder="e.g. 2340" value={form.sl} onChange={e => setForm(f => ({...f, sl: e.target.value}))} />
            {canOverrideRisk && (
              <Input label="Risk % Override" type="number" placeholder="e.g. 1.5" value={form.risk} onChange={e => setForm(f => ({...f, risk: e.target.value}))} />
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Input label="TP1" type="number" placeholder="e.g. 2365" value={form.tp1} onChange={e => setForm(f => ({...f, tp1: e.target.value}))} />
            <Input label="TP2" type="number" placeholder="e.g. 2380" value={form.tp2} onChange={e => setForm(f => ({...f, tp2: e.target.value}))} />
            <Input label="TP3" type="number" placeholder="e.g. 2400" value={form.tp3} onChange={e => setForm(f => ({...f, tp3: e.target.value}))} />
          </div>

          <div className="bg-[#5865F2]/5 border border-[#5865F2]/20 rounded-xl p-3 text-xs text-text-secondary">
            <MessageSquare className="h-3.5 w-3.5 text-[#5865F2] inline mr-1.5" />
            Posts the signal to Discord. DiscordBridge picks it up instantly and writes signal files for all EAs. Execution within ~2 seconds on all accounts.
          </div>

          <Button variant="primary" fullWidth loading={sending} onClick={handleSend} icon={<Send className="h-4 w-4" />}>
            Send Signal
          </Button>
        </div>
      </Modal>

      {/* Delete single signal log */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Signal" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            Delete signal <strong className="text-text-primary">{deleteTarget?.direction} {deleteTarget?.pair}</strong> and all its delivery records? This cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 rounded-xl text-sm text-text-secondary hover:bg-white/[0.04]">Cancel</button>
            <button onClick={handleDeleteOne} disabled={deleting} className="flex items-center gap-2 px-5 py-2 rounded-xl bg-danger text-white text-sm font-medium disabled:opacity-40">
              {deleting && <Loader2 className="h-4 w-4 animate-spin" />} Delete
            </button>
          </div>
        </div>
      </Modal>

      {/* Clear all signal logs */}
      <Modal isOpen={clearAllOpen} onClose={() => setClearAllOpen(false)} title="Clear All Signals" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            This will permanently delete <strong className="text-text-primary">all {total} signal logs</strong> and their delivery records. This cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <button onClick={() => setClearAllOpen(false)} className="px-4 py-2 rounded-xl text-sm text-text-secondary hover:bg-white/[0.04]">Cancel</button>
            <button onClick={handleClearAll} disabled={deleting} className="flex items-center gap-2 px-5 py-2 rounded-xl bg-danger text-white text-sm font-medium disabled:opacity-40">
              {deleting && <Loader2 className="h-4 w-4 animate-spin" />} Clear All Signals
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
