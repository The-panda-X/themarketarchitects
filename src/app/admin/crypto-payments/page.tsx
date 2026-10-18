'use client';

import { useEffect, useState, useCallback } from 'react';
import { Search, CheckCircle, XCircle, ExternalLink, Clock, Image as ImageIcon, Copy, Check } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Skeleton from '@/components/ui/Skeleton';
import {
  Table, TableHeader, TableBody, TableRow, TableHead,
  TableCell, TableEmpty, TablePagination,
} from '@/components/ui/Table';
import { formatDate, formatCurrency } from '@/lib/utils';
import useToast from '@/hooks/useToast';
import useAuth from '@/hooks/useAuth';

interface CryptoOrder {
  id: string;
  planName: string;
  serviceType: string;
  totalAmount: number;
  status: string;
  proofImage: string | null;
  paymentNetwork: string | null;
  cryptoTxId: string | null;
  createdAt: string;
  user: { id: string; email: string; name: string | null };
}

const EXPLORER_URLS: Record<string, string> = {
  'BEP-20 (BSC)': 'https://bscscan.com/tx/',
  'TRC-20 (Tron)': 'https://tronscan.org/#/transaction/',
  'ERC-20 (Ethereum)': 'https://etherscan.io/tx/',
};

function getExplorerUrl(network: string | null, txId: string | null): string | null {
  if (!network || !txId) return null;
  const base = EXPLORER_URLS[network];
  return base ? `${base}${txId}` : null;
}

const filterOptions = [
  { value: 'pending', label: 'Pending Verification' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'all', label: 'All' },
];

export default function CryptoPaymentsPage() {
  const [orders, setOrders] = useState<CryptoOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [proofModal, setProofModal] = useState<CryptoOrder | null>(null);
  const [copiedTx, setCopiedTx] = useState<string | null>(null);
  const { addToast } = useToast();
  const { isAdmin } = useAuth();

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ filter, page: String(page), limit: '15' });
      if (search) params.set('search', search);
      const res = await fetch(`/api/admin/crypto-payments?${params}`);
      if (!res.ok) throw new Error();
      const json = await res.json();
      setOrders(json.data?.data ?? []);
      setTotalPages(json.data?.totalPages ?? 1);
      setTotal(json.data?.total ?? 0);
    } catch {
      addToast('Failed to load crypto payments.', 'error');
    } finally {
      setLoading(false);
    }
  }, [filter, page, search, addToast]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleAction = async (orderId: string, action: 'approve' | 'reject') => {
    setActionLoading(orderId);
    try {
      const res = await fetch(`/api/admin/crypto-payments/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? 'Action failed');
      }
      addToast(`Payment ${action === 'approve' ? 'approved' : 'rejected'} successfully.`, 'success');
      fetchOrders();
      if (proofModal?.id === orderId) setProofModal(null);
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Action failed', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const copyTxId = (txId: string) => {
    navigator.clipboard.writeText(txId);
    setCopiedTx(txId);
    setTimeout(() => setCopiedTx(null), 2000);
  };

  const networkBadge = (network: string | null) => {
    if (!network) return <Badge variant="default">Unknown</Badge>;
    if (network.includes('BSC') || network.includes('BEP')) return <Badge variant="yellow">{network}</Badge>;
    if (network.includes('Tron') || network.includes('TRC')) return <Badge variant="purple">{network}</Badge>;
    if (network.includes('Ethereum') || network.includes('ERC')) return <Badge variant="blue">{network}</Badge>;
    return <Badge variant="default">{network}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">Crypto Payment Verification</h1>
        <p className="text-text-secondary text-sm mt-1">
          Review and verify crypto payments. {filter === 'pending' && total > 0 && <span className="text-accent-primary font-semibold">{total} pending</span>}
        </p>
      </div>

      <GlassCard padding="md">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              placeholder="Search by email, plan, or txid..."
              icon={<Search className="h-4 w-4" />}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <div className="flex gap-2">
            {filterOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { setFilter(opt.value); setPage(1); }}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  filter === opt.value
                    ? 'bg-accent-primary text-white'
                    : 'bg-white/[0.04] text-text-secondary hover:bg-white/[0.08] hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </GlassCard>

      <GlassCard padding="none">
        {loading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Network</TableHead>
                <TableHead>TxID</TableHead>
                <TableHead>Proof</TableHead>
                <TableHead>Date</TableHead>
                {filter === 'pending' && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length === 0 ? (
                <TableEmpty colSpan={filter === 'pending' ? 8 : 7} message={`No ${filter} crypto payments found.`} />
              ) : (
                orders.map((order) => {
                  const explorerUrl = getExplorerUrl(order.paymentNetwork, order.cryptoTxId);
                  return (
                    <TableRow key={order.id}>
                      <TableCell>
                        <div>
                          <p className="text-sm text-white font-medium">{order.user.name || 'No name'}</p>
                          <p className="text-xs text-text-tertiary">{order.user.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-white">{order.planName}</p>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm font-semibold text-white">{formatCurrency(order.totalAmount)}</p>
                      </TableCell>
                      <TableCell>{networkBadge(order.paymentNetwork)}</TableCell>
                      <TableCell>
                        {order.cryptoTxId ? (
                          <div className="flex items-center gap-1.5">
                            <code className="text-xs text-text-secondary font-mono max-w-[100px] truncate" title={order.cryptoTxId}>
                              {order.cryptoTxId.slice(0, 8)}...{order.cryptoTxId.slice(-6)}
                            </code>
                            <button
                              onClick={() => copyTxId(order.cryptoTxId!)}
                              className="text-text-tertiary hover:text-white transition-colors"
                              title="Copy TxID"
                            >
                              {copiedTx === order.cryptoTxId ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
                            </button>
                            {explorerUrl && (
                              <a
                                href={explorerUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-accent-primary hover:text-accent-hover transition-colors"
                                title="View on blockchain explorer"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-text-tertiary">Not provided</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {order.proofImage ? (
                          <button
                            onClick={() => setProofModal(order)}
                            className="flex items-center gap-1.5 text-accent-primary hover:text-accent-hover transition-colors text-sm"
                          >
                            <ImageIcon className="h-4 w-4" />
                            View
                          </button>
                        ) : (
                          <span className="text-xs text-text-tertiary">None</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-text-secondary text-sm">
                          <Clock className="h-3.5 w-3.5" />
                          {formatDate(order.createdAt)}
                        </div>
                      </TableCell>
                      {filter === 'pending' && (
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="primary"
                              size="sm"
                              icon={<CheckCircle className="h-4 w-4" />}
                              loading={actionLoading === order.id}
                              disabled={!isAdmin || !!actionLoading}
                              onClick={() => handleAction(order.id, 'approve')}
                            >
                              Approve
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              icon={<XCircle className="h-4 w-4" />}
                              loading={actionLoading === order.id}
                              disabled={!isAdmin || !!actionLoading}
                              onClick={() => handleAction(order.id, 'reject')}
                            >
                              Reject
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        )}

        {totalPages > 1 && (
          <TablePagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        )}
      </GlassCard>

      {/* Proof Image Modal */}
      <Modal isOpen={!!proofModal} onClose={() => setProofModal(null)} title="Payment Proof">
        {proofModal && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-text-tertiary text-xs mb-0.5">Customer</p>
                <p className="text-white">{proofModal.user.name || proofModal.user.email}</p>
              </div>
              <div>
                <p className="text-text-tertiary text-xs mb-0.5">Amount</p>
                <p className="text-white font-semibold">{formatCurrency(proofModal.totalAmount)}</p>
              </div>
              <div>
                <p className="text-text-tertiary text-xs mb-0.5">Plan</p>
                <p className="text-white">{proofModal.planName}</p>
              </div>
              <div>
                <p className="text-text-tertiary text-xs mb-0.5">Network</p>
                {networkBadge(proofModal.paymentNetwork)}
              </div>
              {proofModal.cryptoTxId && (
                <div className="col-span-2">
                  <p className="text-text-tertiary text-xs mb-0.5">Transaction ID</p>
                  <div className="flex items-center gap-2">
                    <code className="text-sm font-mono text-white break-all">{proofModal.cryptoTxId}</code>
                    {getExplorerUrl(proofModal.paymentNetwork, proofModal.cryptoTxId) && (
                      <a
                        href={getExplorerUrl(proofModal.paymentNetwork, proofModal.cryptoTxId)!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 text-accent-primary hover:text-accent-hover transition-colors"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-white/[0.08] overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={proofModal.proofImage!}
                alt="Payment proof"
                className="w-full max-h-[400px] object-contain bg-black/30"
              />
            </div>

            {proofModal.status === 'PENDING_PAYMENT' && (
              <div className="flex gap-3">
                <Button
                  variant="primary"
                  fullWidth
                  icon={<CheckCircle className="h-5 w-5" />}
                  loading={actionLoading === proofModal.id}
                  disabled={!isAdmin || !!actionLoading}
                  onClick={() => handleAction(proofModal.id, 'approve')}
                >
                  Approve Payment
                </Button>
                <Button
                  variant="danger"
                  fullWidth
                  icon={<XCircle className="h-5 w-5" />}
                  loading={actionLoading === proofModal.id}
                  disabled={!isAdmin || !!actionLoading}
                  onClick={() => handleAction(proofModal.id, 'reject')}
                >
                  Reject
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
