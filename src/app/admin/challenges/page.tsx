'use client';

import { useEffect, useState, useCallback } from 'react';
import GlassCard from '@/components/ui/GlassCard';
import Badge from '@/components/ui/Badge';
import Select from '@/components/ui/Select';
import Skeleton from '@/components/ui/Skeleton';
import ProgressBar from '@/components/ui/ProgressBar';
import {
  Table, TableHeader, TableBody, TableRow, TableHead,
  TableCell, TableEmpty, TablePagination,
} from '@/components/ui/Table';
import { formatRelativeTime } from '@/lib/utils';

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
  const [challenges, setChallenges] = useState<ChallengeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchChallenges = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (status) params.set('status', status);
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
  }, [page, status]);

  useEffect(() => { fetchChallenges(); }, [fetchChallenges]);
  useEffect(() => { setPage(1); }, [status]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">Challenges</h1>
        <p className="text-text-secondary mt-1">{total} total challenges</p>
      </div>

      <GlassCard padding="md">
        <div className="mb-4 w-48">
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {challenges.length === 0 ? (
                  <TableEmpty colSpan={7} message="No challenges found" />
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
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <TablePagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
      </GlassCard>
    </div>
  );
}
