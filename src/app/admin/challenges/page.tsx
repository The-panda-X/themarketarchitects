'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Search, Trophy, Trash2 } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Skeleton from '@/components/ui/Skeleton';
import Modal from '@/components/ui/Modal';
import ProgressBar from '@/components/ui/ProgressBar';
import {
  Table, TableHeader, TableBody, TableRow, TableHead,
  TableCell, TableEmpty, TablePagination,
} from '@/components/ui/Table';
import { formatRelativeTime } from '@/lib/utils';
import useToast from '@/hooks/useToast';

interface ChallengeRow {
  id: string;
  firmName: string;
  accountSize: string;
  status: string;
  currentPhase: number;
  currentProfit: number;
  targetProfit: number | null;
  currentDrawdown: number;
  maxDrawdown: number | null;
  createdAt: string;
  user: { email: string; name: string | null };
  order: { planName: string };
}

interface OrderResult {
  id: string;
  planName: string;
  serviceType: string;
  firmName: string | null;
  accountSize: string | null;
  status: string;
  user: { email: string; name: string | null };
}

const statusVariant: Record<string, 'yellow' | 'blue' | 'green' | 'red' | 'default' | 'gold'> = {
  PENDING: 'default',
  IN_PROGRESS: 'blue',
  PHASE_1: 'blue',
  PHASE_2: 'yellow',
  PASSED: 'green',
  FUNDED: 'gold',
  FAILED: 'red',
};

export default function AdminChallengesPage() {
  const { addToast } = useToast();

  // List state
  const [challenges, setChallenges] = useState<ChallengeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResults, setSearchResults] = useState<OrderResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderResult | null>(null);
  const [targetProfit, setTargetProfit] = useState('');
  const [maxDrawdown, setMaxDrawdown] = useState('');
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDelete = async (id: string, firmName: string) => {
    if (!confirm(`Delete challenge for "${firmName}"? This will also delete all daily stats and signal deliveries. This cannot be undone.`)) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/challenges/${id}`, { method: 'DELETE' });
      if (res.ok) {
        addToast('Challenge deleted successfully.', 'success');
        fetchChallenges();
      } else {
        const d = await res.json();
        addToast(d.error ?? 'Failed to delete challenge.', 'error');
      }
    } catch { addToast('Failed to delete challenge.', 'error'); }
    finally { setDeleting(null); }
  };

  const fetchChallenges = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (statusFilter) params.set('status', statusFilter);
      const res = await fetch(`/api/admin/challenges?${params}`);
      if (res.ok) {
        const d = await res.json();
        setChallenges(d.data.data ?? []);
        setTotalPages(d.data.totalPages ?? 1);
        setTotal(d.data.total ?? 0);
      }
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => { fetchChallenges(); }, [fetchChallenges]);
  useEffect(() => { setPage(1); }, [statusFilter]);

  const handleSearch = async () => {
    if (!searchEmail.trim()) return;
    setSearching(true);
    setSelectedOrder(null);
    try {
      const res = await fetch(`/api/admin/orders?search=${encodeURIComponent(searchEmail.trim())}&limit=10`);
      const d = await res.json();
      // Only show CHALLENGE_PASSING orders
      const orders: OrderResult[] = (d.data?.data ?? []).filter(
        (o: OrderResult) => o.serviceType === 'CHALLENGE_PASSING'
      );
      setSearchResults(orders);
    } finally {
      setSearching(false);
    }
  };

  const handleCreate = async () => {
    if (!selectedOrder) return;
    setCreating(true);
    try {
      const res = await fetch('/api/admin/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: selectedOrder.id,
          targetProfit: targetProfit || undefined,
          maxDrawdown: maxDrawdown || undefined,
        }),
      });
      const d = await res.json();
      if (res.ok) {
        addToast('Challenge created! User has been notified.', 'success');
        setModalOpen(false);
        resetModal();
        fetchChallenges();
      } else {
        addToast(d.error ?? 'Failed to create challenge.', 'error');
      }
    } finally {
      setCreating(false);
    }
  };

  const resetModal = () => {
    setSearchEmail('');
    setSearchResults([]);
    setSelectedOrder(null);
    setTargetProfit('');
    setMaxDrawdown('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">Challenges</h1>
          <p className="text-text-secondary mt-1">{total} total challenges</p>
        </div>
        <Button
          variant="primary"
          icon={<Plus className="h-4 w-4" />}
          onClick={() => { resetModal(); setModalOpen(true); }}
        >
          New Challenge
        </Button>
      </div>

      {/* List */}
      <GlassCard padding="md">
        <div className="mb-4 w-48">
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="PHASE_1">Phase 1</option>
            <option value="PHASE_2">Phase 2</option>
            <option value="PASSED">Passed</option>
            <option value="FUNDED">Funded</option>
            <option value="FAILED">Failed</option>
          </Select>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow hoverable={false}>
                  <TableHead>Client</TableHead>
                  <TableHead>Firm / Size</TableHead>
                  <TableHead>Phase</TableHead>
                  <TableHead>Profit</TableHead>
                  <TableHead>Drawdown</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead align="center">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {challenges.length === 0 ? (
                  <TableEmpty colSpan={8} message="No challenges found" />
                ) : (
                  challenges.map((ch) => (
                    <TableRow key={ch.id} onClick={() => window.location.href = `/admin/challenges/${ch.id}`}>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium text-text-primary">{ch.user.name ?? '—'}</p>
                          <p className="text-xs text-text-tertiary">{ch.user.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{ch.firmName}</p>
                        <p className="text-xs text-text-tertiary">{ch.accountSize}</p>
                      </TableCell>
                      <TableCell align="center">
                        <Badge variant="default" size="sm">P{ch.currentPhase}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="w-24">
                          <p className="text-xs mb-1 font-mono">
                            ${ch.currentProfit.toFixed(0)} / ${ch.targetProfit?.toFixed(0) ?? '—'}
                          </p>
                          {ch.targetProfit && (
                            <ProgressBar
                              value={Math.min(100, (ch.currentProfit / ch.targetProfit) * 100)}
                              color="green"
                              size="sm"
                            />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="w-24">
                          <p className="text-xs mb-1 font-mono">
                            {ch.currentDrawdown.toFixed(1)}% / {ch.maxDrawdown?.toFixed(1) ?? '—'}%
                          </p>
                          {ch.maxDrawdown && (
                            <ProgressBar
                              value={Math.min(100, (ch.currentDrawdown / ch.maxDrawdown) * 100)}
                              color="red"
                              size="sm"
                            />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant[ch.status] ?? 'default'} size="sm">
                          {ch.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatRelativeTime(ch.createdAt)}</TableCell>
                      <TableCell align="center">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(ch.id, ch.firmName); }}
                          disabled={deleting === ch.id}
                          className="p-1.5 rounded-lg text-text-tertiary hover:text-red-400 hover:bg-red-400/10 transition-colors disabled:opacity-50"
                          title="Delete challenge"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <TablePagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
      </GlassCard>

      {/* Create Challenge Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Create New Challenge"
        description="Search for a paid order by user email, then fill in the challenge targets."
        size="lg"
      >
        <div className="space-y-5 mt-2">
          {/* Step 1 — Search */}
          <div>
            <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2">
              Step 1 — Find Order
            </p>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder="Search by user email..."
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                />
              </div>
              <Button
                variant="secondary"
                icon={<Search className="h-4 w-4" />}
                loading={searching}
                onClick={handleSearch}
              >
                Search
              </Button>
            </div>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && !selectedOrder && (
            <div className="space-y-2">
              <p className="text-xs text-text-tertiary">
                {searchResults.length} Challenge Passing order{searchResults.length !== 1 ? 's' : ''} found — click to select:
              </p>
              {searchResults.map((order) => (
                <button
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  className="w-full text-left p-3 rounded-xl border border-white/10 hover:border-accent-primary/50 hover:bg-white/[0.04] transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-text-primary">{order.planName}</p>
                      <p className="text-xs text-text-tertiary mt-0.5">
                        {order.user.email} &nbsp;·&nbsp; {order.firmName ?? 'No firm'} &nbsp;·&nbsp; {order.accountSize ?? 'No size'}
                      </p>
                    </div>
                    <Badge variant={order.status === 'PAID' ? 'green' : 'default'} size="sm">
                      {order.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <p className="text-xs font-mono text-text-tertiary mt-1">ID: {order.id}</p>
                </button>
              ))}
            </div>
          )}

          {searchResults.length === 0 && searchEmail && !searching && (
            <p className="text-sm text-text-tertiary">No challenge passing orders found for that email.</p>
          )}

          {/* Selected Order */}
          {selectedOrder && (
            <>
              <div className="p-3 rounded-xl bg-accent-primary/10 border border-accent-primary/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-text-primary">{selectedOrder.planName}</p>
                    <p className="text-xs text-text-tertiary mt-0.5">
                      {selectedOrder.user.email} &nbsp;·&nbsp; {selectedOrder.firmName ?? '—'} &nbsp;·&nbsp; {selectedOrder.accountSize ?? '—'}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="text-xs text-text-tertiary hover:text-text-primary underline"
                  >
                    Change
                  </button>
                </div>
              </div>

              {/* Step 2 — Targets */}
              <div>
                <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-3">
                  Step 2 — Set Targets (optional)
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Target Profit ($)"
                    type="number"
                    placeholder="e.g. 1000"
                    value={targetProfit}
                    onChange={(e) => setTargetProfit(e.target.value)}
                  />
                  <Input
                    label="Max Drawdown (%)"
                    type="number"
                    placeholder="e.g. 10"
                    value={maxDrawdown}
                    onChange={(e) => setMaxDrawdown(e.target.value)}
                  />
                </div>
                <p className="text-xs text-text-tertiary mt-2">
                  Leave blank to set targets later from the challenge detail page.
                </p>
              </div>

              {/* Create Button */}
              <Button
                variant="primary"
                fullWidth
                loading={creating}
                onClick={handleCreate}
                icon={<Trophy className="h-4 w-4" />}
              >
                Create Challenge & Notify User
              </Button>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
