'use client';

import { useEffect, useState, useCallback } from 'react';
import { Trash2, Loader2 } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import Skeleton from '@/components/ui/Skeleton';
import Avatar from '@/components/ui/Avatar';
import Modal from '@/components/ui/Modal';
import {
  Table, TableHeader, TableBody, TableRow, TableHead,
  TableCell, TableEmpty, TablePagination,
} from '@/components/ui/Table';
import { formatRelativeTime } from '@/lib/utils';
import useAuth from '@/hooks/useAuth';
import useToast from '@/hooks/useToast';

interface LogRow {
  id: string;
  action: string;
  details: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
  admin: { id: string; name: string | null; email: string };
}

export default function AdminLogsPage() {
  const { canDelete } = useAuth();
  const { addToast } = useToast();

  const [logs, setLogs] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [deleteTarget, setDeleteTarget] = useState<LogRow | null>(null);
  const [clearAllOpen, setClearAllOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/logs?page=${page}&limit=30`);
      if (res.ok) {
        const d = await res.json();
        setLogs(d.data.data ?? []);
        setTotalPages(d.data.totalPages ?? 1);
        setTotal(d.data.total ?? 0);
      }
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const handleDeleteOne = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/logs?id=${deleteTarget.id}`, { method: 'DELETE' });
      if (res.ok) { addToast('Log deleted', 'success'); setDeleteTarget(null); fetchLogs(); }
      else addToast('Failed to delete', 'error');
    } catch { addToast('Failed to delete', 'error'); }
    finally { setDeleting(false); }
  };

  const handleClearAll = async () => {
    setDeleting(true);
    try {
      const res = await fetch('/api/admin/logs?all=true', { method: 'DELETE' });
      if (res.ok) {
        const d = await res.json();
        addToast(`Cleared ${d.data?.deleted ?? 0} logs`, 'success');
        setClearAllOpen(false);
        setPage(1);
        fetchLogs();
      } else addToast('Failed to clear', 'error');
    } catch { addToast('Failed to clear', 'error'); }
    finally { setDeleting(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">Activity Logs</h1>
          <p className="text-text-secondary mt-1">{total} total admin actions logged.</p>
        </div>
        {canDelete && total > 0 && (
          <button
            onClick={() => setClearAllOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-danger/30 text-danger text-sm font-medium hover:bg-danger/5 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            Clear All
          </button>
        )}
      </div>

      <GlassCard padding="md">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow hoverable={false}>
                  <TableHead>Admin</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead>Time</TableHead>
                  {canDelete && <TableHead align="center">Delete</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length === 0 ? (
                  <TableEmpty colSpan={canDelete ? 6 : 5} message="No activity logs yet." />
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar name={log.admin.name} size="sm" />
                          <span className="text-sm">{log.admin.name ?? log.admin.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-xs bg-white/[0.05] px-2 py-0.5 rounded text-accent-primary">
                          {log.action}
                        </span>
                      </TableCell>
                      <TableCell>
                        {log.details ? (
                          <span className="text-xs text-text-tertiary font-mono truncate max-w-xs block">
                            {JSON.stringify(log.details)}
                          </span>
                        ) : '—'}
                      </TableCell>
                      <TableCell mono>{log.ipAddress ?? '—'}</TableCell>
                      <TableCell>{formatRelativeTime(log.createdAt)}</TableCell>
                      {canDelete && (
                        <TableCell align="center">
                          <button
                            onClick={() => setDeleteTarget(log)}
                            className="p-1.5 rounded-lg text-text-tertiary hover:text-danger hover:bg-danger/5 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <TablePagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
      </GlassCard>

      {/* Delete single log */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Log Entry" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            Delete this log entry for <strong className="text-text-primary">{deleteTarget?.action}</strong>? This cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 rounded-xl text-sm text-text-secondary hover:bg-white/[0.04]">Cancel</button>
            <button onClick={handleDeleteOne} disabled={deleting} className="flex items-center gap-2 px-5 py-2 rounded-xl bg-danger text-white text-sm font-medium disabled:opacity-40">
              {deleting && <Loader2 className="h-4 w-4 animate-spin" />} Delete
            </button>
          </div>
        </div>
      </Modal>

      {/* Clear all logs */}
      <Modal isOpen={clearAllOpen} onClose={() => setClearAllOpen(false)} title="Clear All Logs" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            This will permanently delete <strong className="text-text-primary">all {total} activity logs</strong>. This cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <button onClick={() => setClearAllOpen(false)} className="px-4 py-2 rounded-xl text-sm text-text-secondary hover:bg-white/[0.04]">Cancel</button>
            <button onClick={handleClearAll} disabled={deleting} className="flex items-center gap-2 px-5 py-2 rounded-xl bg-danger text-white text-sm font-medium disabled:opacity-40">
              {deleting && <Loader2 className="h-4 w-4 animate-spin" />} Clear All Logs
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
