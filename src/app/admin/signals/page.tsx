'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Send, Radio, CheckCircle, XCircle, AlertTriangle, ChevronDown, ChevronUp, Trash2, Loader2 } from 'lucide-react';
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

interface Delivery {
  id: string;
  status: string;
  skipReason: string | null;
  challenge: { id: string; firmName: string; accountSize: string; user: { email: string; name: string | null } };
}

interface Signal {
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

export default function AdminSignalsPage() {
  const { canDelete } = useAuth();
  const { addToast } = useToast();

  const [signals, setSignals]     = useState<Signal[]>([]);
  const [loading, setLoading]     = useState(true);
  const [page, setPage]           = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal]         = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Manual signal modal
  const [modalOpen, setModalOpen] = useState(false);
  const [sending, setSending]     = useState(false);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<Signal | null>(null);
  const [clearAllOpen, setClearAllOpen] = useState(false);
  const [deleting, setDeleting]   = useState(false);
  const [form, setForm] = useState({
    pair: 'XAUUSD', direction: 'BUY',
    entry: '', sl: '', tp1: '', tp2: '', tp3: '', riskOverride: '',
  });

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

  useEffect(() => { fetchSignals(); }, [fetchSignals]);

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
          <p className="text-text-secondary mt-1">{total} signals logged</p>
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
          <Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={() => setModalOpen(true)}>
            Manual Signal
          </Button>
        </div>
      </div>

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

      {/* Manual Signal Modal */}
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

          <div className="grid grid-cols-3 gap-3">
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

      {/* Delete single signal */}
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

      {/* Clear all signals */}
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
