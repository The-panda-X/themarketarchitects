'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Send, Radio, CheckCircle, XCircle, AlertTriangle, ChevronDown, ChevronUp, Trash2, Loader2, Zap, Clock, RefreshCw } from 'lucide-react';
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

/* ── Signal Log types (existing) ─────────────────────────────────── */
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
  sentAt: string;
  deliveries: Delivery[];
}

/* ── VPS Signal types (new) ──────────────────────────────────────── */
interface VpsSignal {
  id: string;
  pair: string;
  direction: string;
  entry: number;
  sl: number;
  tp1: number;
  tp2: number | null;
  tp3: number | null;
  risk: number;
  source: string;
  status: string;
  sentCount: number;
  failedCount: number;
  errorMessage: string | null;
  createdAt: string;
  executedAt: string | null;
}

export default function AdminSignalsPage() {
  const { canDelete } = useAuth();
  const { addToast } = useToast();

  /* ── Signal Log state (existing) ─────────────────────────────── */
  const [signals, setSignals]     = useState<SignalLog[]>([]);
  const [loading, setLoading]     = useState(true);
  const [page, setPage]           = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal]         = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [sending, setSending]     = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SignalLog | null>(null);
  const [clearAllOpen, setClearAllOpen] = useState(false);
  const [deleting, setDeleting]   = useState(false);
  const [form, setForm] = useState({
    pair: 'XAUUSD', direction: 'BUY',
    entry: '', sl: '', tp1: '', tp2: '', tp3: '', riskOverride: '',
  });

  /* ── VPS Signal state (new) ──────────────────────────────────── */
  const [vpsSignals, setVpsSignals]     = useState<VpsSignal[]>([]);
  const [vpsLoading, setVpsLoading]     = useState(true);
  const [vpsPage, setVpsPage]           = useState(1);
  const [vpsTotalPages, setVpsTotalPages] = useState(1);
  const [vpsTotal, setVpsTotal]         = useState(0);
  const [vpsModalOpen, setVpsModalOpen] = useState(false);
  const [vpsSending, setVpsSending]     = useState(false);
  const [vpsDeleteTarget, setVpsDeleteTarget] = useState<VpsSignal | null>(null);
  const [vpsDeleting, setVpsDeleting]   = useState(false);
  const [vpsForm, setVpsForm] = useState({
    pair: 'XAUUSD', direction: 'BUY',
    entry: '', sl: '', tp1: '', tp2: '', tp3: '', risk: '',
  });

  /* ── Active tab ──────────────────────────────────────────────── */
  const [activeTab, setActiveTab] = useState<'vps' | 'log'>('vps');

  /* ── Fetch Signal Logs ───────────────────────────────────────── */
  const fetchSignals = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/signals?page=${page}&limit=20`);
      if (res.ok) {
        const d = await res.json();
        setSignals(d.data.data ?? []);
        setTotalPages(d.data.totalPages ?? 1);
        setTotal(d.data.total ?? 0);
      }
    } finally {
      setLoading(false);
    }
  }, [page]);

  /* ── Fetch VPS Signals ───────────────────────────────────────── */
  const fetchVpsSignals = useCallback(async () => {
    setVpsLoading(true);
    try {
      const res = await fetch(`/api/admin/signals/vps?page=${vpsPage}&limit=20`);
      if (res.ok) {
        const d = await res.json();
        setVpsSignals(d.data.data ?? []);
        setVpsTotalPages(d.data.totalPages ?? 1);
        setVpsTotal(d.data.total ?? 0);
      }
    } finally {
      setVpsLoading(false);
    }
  }, [vpsPage]);

  useEffect(() => { fetchSignals(); }, [fetchSignals]);
  useEffect(() => { fetchVpsSignals(); }, [fetchVpsSignals]);

  // Auto-refresh VPS signals every 10s when on VPS tab
  useEffect(() => {
    if (activeTab !== 'vps') return;
    const interval = setInterval(fetchVpsSignals, 5000);
    return () => clearInterval(interval);
  }, [activeTab, fetchVpsSignals]);

  /* ── Send Manual Signal (existing) ──────────────────────────── */
  const handleSend = async () => {
    if (!form.sl) { addToast('SL is required', 'error'); return; }
    setSending(true);
    try {
      const res = await fetch('/api/admin/signals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const d = await res.json();
      if (res.ok) {
        addToast(`Signal logged — ${d.data.sent} sent, ${d.data.skipped} skipped`, 'success');
        setModalOpen(false);
        setForm({ pair: 'XAUUSD', direction: 'BUY', entry: '', sl: '', tp1: '', tp2: '', tp3: '', riskOverride: '' });
        fetchSignals();
      } else {
        addToast(d.error ?? 'Failed', 'error');
      }
    } finally {
      setSending(false);
    }
  };

  /* ── Send VPS Signal (new) ──────────────────────────────────── */
  const handleVpsSend = async () => {
    if (!vpsForm.sl) { addToast('Stop Loss is required', 'error'); return; }
    if (!vpsForm.tp1) { addToast('TP1 is required', 'error'); return; }
    setVpsSending(true);
    try {
      const res = await fetch('/api/admin/signals/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vpsForm),
      });
      const d = await res.json();
      if (res.ok) {
        addToast(`Signal queued for VPS — ID: ${d.data.signalId}`, 'success');
        setVpsModalOpen(false);
        setVpsForm({ pair: 'XAUUSD', direction: 'BUY', entry: '', sl: '', tp1: '', tp2: '', tp3: '', risk: '' });
        fetchVpsSignals();
      } else {
        addToast(d.error ?? 'Failed to queue signal', 'error');
      }
    } finally {
      setVpsSending(false);
    }
  };

  /* ── Delete Signal Log ──────────────────────────────────────── */
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

  /* ── Delete VPS Signal ──────────────────────────────────────── */
  const handleVpsDelete = async () => {
    if (!vpsDeleteTarget) return;
    setVpsDeleting(true);
    try {
      const res = await fetch(`/api/admin/signals/vps?id=${vpsDeleteTarget.id}`, { method: 'DELETE' });
      if (res.ok) { addToast('VPS signal deleted', 'success'); setVpsDeleteTarget(null); fetchVpsSignals(); }
      else addToast('Failed to delete', 'error');
    } catch { addToast('Failed to delete', 'error'); }
    finally { setVpsDeleting(false); }
  };

  /* ── VPS Stats ──────────────────────────────────────────────── */
  const vpsPending  = vpsSignals.filter(s => s.status === 'pending').length;
  const vpsExecuted = vpsSignals.filter(s => s.status === 'executed').length;
  const vpsFailed   = vpsSignals.filter(s => s.status === 'failed').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold flex items-center gap-2">
            <Radio className="h-6 w-6 text-accent-primary" /> Signal Hub
          </h1>
          <p className="text-text-secondary mt-1">Manage VPS trade signals and signal logs</p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === 'log' && canDelete && total > 0 && (
            <button
              onClick={() => setClearAllOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-danger/30 text-danger text-sm font-medium hover:bg-danger/5 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              Clear All
            </button>
          )}
          {activeTab === 'vps' ? (
            <Button variant="primary" icon={<Zap className="h-4 w-4" />} onClick={() => setVpsModalOpen(true)}>
              Send to VPS
            </Button>
          ) : (
            <Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={() => setModalOpen(true)}>
              Manual Signal
            </Button>
          )}
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-1 p-1 bg-white/[0.04] rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('vps')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'vps'
              ? 'bg-accent-primary/20 text-accent-primary shadow-sm'
              : 'text-text-tertiary hover:text-text-secondary'
          }`}
        >
          <Zap className="h-4 w-4" />
          VPS Trade Manager
          {vpsPending > 0 && (
            <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold bg-warning/20 text-warning rounded-full">{vpsPending}</span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('log')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'log'
              ? 'bg-accent-primary/20 text-accent-primary shadow-sm'
              : 'text-text-tertiary hover:text-text-secondary'
          }`}
        >
          <Radio className="h-4 w-4" />
          Signal Log
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          VPS TRADE MANAGER TAB
          ═══════════════════════════════════════════════════════════ */}
      {activeTab === 'vps' && (
        <>
          {/* VPS Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Total Queued', value: vpsTotal, icon: <Zap className="h-5 w-5 text-accent-primary" /> },
              { label: 'Pending', value: vpsPending, icon: <Clock className="h-5 w-5 text-warning" /> },
              { label: 'Executed', value: vpsExecuted, icon: <CheckCircle className="h-5 w-5 text-success" /> },
              { label: 'Failed', value: vpsFailed, icon: <XCircle className="h-5 w-5 text-danger" /> },
            ].map(stat => (
              <GlassCard key={stat.label} padding="md">
                <div className="flex items-center gap-3">
                  {stat.icon}
                  <div>
                    <p className="text-2xl font-bold font-mono">{stat.value}</p>
                    <p className="text-xs text-text-tertiary">{stat.label}</p>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>

          {/* VPS Signal Queue */}
          <GlassCard padding="md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">VPS Signal Queue</h2>
              <button
                onClick={fetchVpsSignals}
                className="flex items-center gap-1.5 text-xs text-text-tertiary hover:text-accent-primary transition-colors"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${vpsLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            {vpsLoading && vpsSignals.length === 0 ? (
              <div className="space-y-3">{Array.from({length:5}).map((_,i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow hoverable={false}>
                      <TableHead>Time</TableHead>
                      <TableHead>Signal</TableHead>
                      <TableHead>Entry / SL</TableHead>
                      <TableHead>TPs</TableHead>
                      <TableHead>Risk</TableHead>
                      <TableHead align="center">Status</TableHead>
                      <TableHead align="center">Sent</TableHead>
                      <TableHead align="center">Failed</TableHead>
                      {canDelete && <TableHead align="center">Delete</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vpsSignals.length === 0 ? (
                      <TableEmpty colSpan={canDelete ? 9 : 8} message="No VPS signals yet. Click 'Send to VPS' to queue a trade." />
                    ) : vpsSignals.map(sig => (
                      <TableRow key={sig.id}>
                        <TableCell>
                          <span className="text-xs text-text-tertiary">{formatRelativeTime(sig.createdAt)}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge variant={sig.direction === 'BUY' ? 'green' : 'red'} size="sm">{sig.direction}</Badge>
                            <span className="font-mono font-semibold text-sm">{sig.pair}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-xs font-mono">
                            {sig.entry === 0 ? 'Market' : sig.entry} / <span className="text-danger">{sig.sl}</span>
                          </p>
                        </TableCell>
                        <TableCell>
                          <p className="text-xs font-mono text-text-tertiary">
                            {[sig.tp1, sig.tp2, sig.tp3].filter(Boolean).join(' · ') || '—'}
                          </p>
                        </TableCell>
                        <TableCell>
                          {sig.risk > 0 ? (
                            <span className="font-mono text-xs font-semibold text-accent-primary">{sig.risk}%</span>
                          ) : (
                            <span className="text-xs text-text-tertiary">Default</span>
                          )}
                        </TableCell>
                        <TableCell align="center">
                          <div className="flex flex-col items-center gap-1">
                            <Badge
                              variant={sig.status === 'executed' ? 'green' : sig.status === 'failed' ? 'red' : 'yellow'}
                              size="sm"
                            >
                              {sig.status === 'pending' && <Clock className="h-3 w-3 mr-1 inline" />}
                              {sig.status === 'executed' && <CheckCircle className="h-3 w-3 mr-1 inline" />}
                              {sig.status === 'failed' && <XCircle className="h-3 w-3 mr-1 inline" />}
                              {sig.status.charAt(0).toUpperCase() + sig.status.slice(1)}
                            </Badge>
                            {sig.errorMessage && (
                              <span className="text-[10px] text-danger/80 max-w-[120px] truncate" title={sig.errorMessage}>
                                {sig.errorMessage}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell align="center">
                          <span className="text-success font-mono font-bold">{sig.sentCount}</span>
                        </TableCell>
                        <TableCell align="center">
                          <span className={`font-mono ${sig.failedCount > 0 ? 'text-danger font-bold' : 'text-text-tertiary'}`}>
                            {sig.failedCount}
                          </span>
                        </TableCell>
                        {canDelete && (
                          <TableCell align="center">
                            <button
                              onClick={() => setVpsDeleteTarget(sig)}
                              className="p-1.5 rounded-lg text-text-tertiary hover:text-danger hover:bg-danger/5 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <TablePagination page={vpsPage} totalPages={vpsTotalPages} onPageChange={setVpsPage} />
              </>
            )}
          </GlassCard>
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════
          SIGNAL LOG TAB (existing)
          ═══════════════════════════════════════════════════════════ */}
      {activeTab === 'log' && (
        <>
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Total Signals', value: total, icon: <Radio className="h-5 w-5 text-accent-primary" /> },
              { label: 'Sent This Week', value: signals.filter(s => new Date(s.sentAt) > new Date(Date.now() - 7*86400000)).reduce((a,s) => a + s.totalSent, 0), icon: <CheckCircle className="h-5 w-5 text-success" /> },
              { label: 'Skipped This Week', value: signals.filter(s => new Date(s.sentAt) > new Date(Date.now() - 7*86400000)).reduce((a,s) => a + s.totalSkipped, 0), icon: <AlertTriangle className="h-5 w-5 text-warning" /> },
            ].map(stat => (
              <GlassCard key={stat.label} padding="md">
                <div className="flex items-center gap-3">
                  {stat.icon}
                  <div>
                    <p className="text-2xl font-bold font-mono">{stat.value}</p>
                    <p className="text-xs text-text-tertiary">{stat.label}</p>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>

          {/* Signal History */}
          <GlassCard padding="md">
            <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">Signal History</h2>
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
                      <TableHead>Source</TableHead>
                      <TableHead align="center">Sent</TableHead>
                      <TableHead align="center">Skipped</TableHead>
                      <TableHead align="center">Details</TableHead>
                      {canDelete && <TableHead align="center">Delete</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {signals.length === 0 ? (
                      <TableEmpty colSpan={canDelete ? 10 : 9} message="No signals yet. Post a signal in Discord or use Manual Signal." />
                    ) : signals.map(sig => (
                      <>
                        <TableRow key={sig.id} onClick={() => setExpandedId(expandedId === sig.id ? null : sig.id)}>
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
                            <Badge variant={sig.source === 'admin' ? 'gold' : 'default'} size="sm">
                              {sig.source === 'admin' ? 'Admin' : 'Discord'}
                            </Badge>
                          </TableCell>
                          <TableCell align="center">
                            <span className="text-success font-mono font-bold">{sig.totalSent}</span>
                          </TableCell>
                          <TableCell align="center">
                            <span className="text-warning font-mono">{sig.totalSkipped}</span>
                          </TableCell>
                          <TableCell align="center">
                            <button className="text-text-tertiary hover:text-text-primary transition-colors">
                              {expandedId === sig.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </button>
                          </TableCell>
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

                        {/* Expanded delivery details */}
                        {expandedId === sig.id && sig.deliveries.length > 0 && (
                          <tr key={`${sig.id}-expanded`}>
                            <td colSpan={canDelete ? 10 : 9} className="px-4 pb-3">
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
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════
          VPS SIGNAL MODAL
          ═══════════════════════════════════════════════════════════ */}
      <Modal
        isOpen={vpsModalOpen}
        onClose={() => setVpsModalOpen(false)}
        title="Send Signal to VPS"
        description="Queue a trade for the Multi-Account Trade Manager. The VPS picks it up within 5 seconds."
        size="lg"
      >
        <div className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-text-tertiary mb-1.5 block font-medium uppercase tracking-wider">Pair</label>
              <Select value={vpsForm.pair} onChange={e => setVpsForm(f => ({...f, pair: e.target.value}))}>
                {PAIRS.map(p => <option key={p} value={p}>{p}</option>)}
              </Select>
            </div>
            <div>
              <label className="text-xs text-text-tertiary mb-1.5 block font-medium uppercase tracking-wider">Direction</label>
              <Select value={vpsForm.direction} onChange={e => setVpsForm(f => ({...f, direction: e.target.value}))}>
                <option value="BUY">BUY</option>
                <option value="SELL">SELL</option>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 [&_label]:min-h-[2.5rem] [&_label]:flex [&_label]:items-end">
            <Input label="Entry Price (0 = market)" type="number" placeholder="e.g. 2350" value={vpsForm.entry} onChange={e => setVpsForm(f => ({...f, entry: e.target.value}))} />
            <Input label="Stop Loss *" type="number" placeholder="e.g. 2340" value={vpsForm.sl} onChange={e => setVpsForm(f => ({...f, sl: e.target.value}))} />
            <Input label="Risk % Override" type="number" placeholder="e.g. 1.5" value={vpsForm.risk} onChange={e => setVpsForm(f => ({...f, risk: e.target.value}))} />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Input label="TP1 *" type="number" placeholder="e.g. 2365" value={vpsForm.tp1} onChange={e => setVpsForm(f => ({...f, tp1: e.target.value}))} />
            <Input label="TP2" type="number" placeholder="e.g. 2380" value={vpsForm.tp2} onChange={e => setVpsForm(f => ({...f, tp2: e.target.value}))} />
            <Input label="TP3" type="number" placeholder="e.g. 2400" value={vpsForm.tp3} onChange={e => setVpsForm(f => ({...f, tp3: e.target.value}))} />
          </div>

          <div className="bg-accent-primary/5 border border-accent-primary/20 rounded-xl p-3 text-xs text-text-secondary">
            <Zap className="h-3.5 w-3.5 text-accent-primary inline mr-1.5" />
            This queues the signal for the VPS Multi-Account Trade Manager. The manager polls every 5 seconds and executes the trade across all connected MT5 accounts.
          </div>

          <Button variant="primary" fullWidth loading={vpsSending} onClick={handleVpsSend} icon={<Zap className="h-4 w-4" />}>
            Queue Signal for VPS
          </Button>
        </div>
      </Modal>

      {/* Manual Signal Modal (existing) */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Send Manual Signal"
        description="Log a signal from the admin panel. This records it in the signal history."
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

          <div className="grid grid-cols-3 gap-3 [&_label]:min-h-[2.5rem] [&_label]:flex [&_label]:items-end">
            <Input label="Entry Price (0 = market)" type="number" placeholder="e.g. 2350" value={form.entry} onChange={e => setForm(f => ({...f, entry: e.target.value}))} />
            <Input label="Stop Loss *" type="number" placeholder="e.g. 2340" value={form.sl} onChange={e => setForm(f => ({...f, sl: e.target.value}))} />
            <Input label="Risk % Override" type="number" placeholder="e.g. 1.5" value={form.riskOverride} onChange={e => setForm(f => ({...f, riskOverride: e.target.value}))} />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Input label="TP1" type="number" placeholder="e.g. 2365" value={form.tp1} onChange={e => setForm(f => ({...f, tp1: e.target.value}))} />
            <Input label="TP2" type="number" placeholder="e.g. 2380" value={form.tp2} onChange={e => setForm(f => ({...f, tp2: e.target.value}))} />
            <Input label="TP3" type="number" placeholder="e.g. 2400" value={form.tp3} onChange={e => setForm(f => ({...f, tp3: e.target.value}))} />
          </div>

          <div className="bg-white/[0.04] rounded-xl p-3 text-xs text-text-tertiary">
            ℹ️ This logs the signal on the website. The actual trade execution still goes through the Python bridge → signal.txt → MT5 (fast path). This is for record keeping and monitoring only.
          </div>

          <Button variant="primary" fullWidth loading={sending} onClick={handleSend} icon={<Send className="h-4 w-4" />}>
            Log Signal
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

      {/* Delete VPS signal */}
      <Modal isOpen={!!vpsDeleteTarget} onClose={() => setVpsDeleteTarget(null)} title="Delete VPS Signal" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            Delete VPS signal <strong className="text-text-primary">{vpsDeleteTarget?.direction} {vpsDeleteTarget?.pair}</strong>? This cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <button onClick={() => setVpsDeleteTarget(null)} className="px-4 py-2 rounded-xl text-sm text-text-secondary hover:bg-white/[0.04]">Cancel</button>
            <button onClick={handleVpsDelete} disabled={vpsDeleting} className="flex items-center gap-2 px-5 py-2 rounded-xl bg-danger text-white text-sm font-medium disabled:opacity-40">
              {vpsDeleting && <Loader2 className="h-4 w-4 animate-spin" />} Delete
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
