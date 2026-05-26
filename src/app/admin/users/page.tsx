'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Search, UserCheck, UserX, Trash2, MessageCircle, MapPin } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import Avatar from '@/components/ui/Avatar';
import Skeleton from '@/components/ui/Skeleton';
import {
  Table, TableHeader, TableBody, TableRow, TableHead,
  TableCell, TableEmpty, TablePagination,
} from '@/components/ui/Table';
import { formatRelativeTime } from '@/lib/utils';
import useToast from '@/hooks/useToast';
import useAuth from '@/hooks/useAuth';

interface UserRow {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
  role: 'USER' | 'MODERATOR' | 'ADMIN' | 'HEAD_ADMIN';
  emailVerified: string | null;
  lastLoginCountry: string | null;
  createdAt: string;
  _count: { orders: number; challenges: number };
}

export default function AdminUsersPage() {
  const { addToast } = useToast();
  const { canDelete } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDelete = async (id: string, email: string) => {
    if (!confirm(`Delete user "${email}" and ALL their data (orders, challenges, credentials, payments, tickets)? This cannot be undone.`)) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
      if (res.ok) {
        addToast('User deleted successfully.', 'success');
        fetchUsers();
      } else {
        const d = await res.json();
        addToast(d.error ?? 'Failed to delete user.', 'error');
      }
    } catch { addToast('Failed to delete user.', 'error'); }
    finally { setDeleting(null); }
  };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('search', search);
      const res = await fetch(`/api/admin/users?${params}`);
      if (res.ok) {
        const d = await res.json();
        setUsers(d.data.data ?? []);
        setTotalPages(d.data.totalPages ?? 1);
        setTotal(d.data.total ?? 0);
      }
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  useEffect(() => { setPage(1); }, [search]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">Users</h1>
          <p className="text-text-secondary mt-1">{total} total users</p>
        </div>
      </div>

      <GlassCard padding="md">
        <div className="mb-4">
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search className="h-4 w-4" />}
          />
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
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Email Verified</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead align="center">Orders</TableHead>
                  <TableHead align="center">Challenges</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead align="center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableEmpty colSpan={8} message="No users found" />
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id} onClick={() => window.location.href = `/admin/users/${user.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar src={user.avatar} name={user.name} size="sm" />
                          <div>
                            <p className="text-sm font-medium text-text-primary">{user.name ?? '—'}</p>
                            <p className="text-xs text-text-tertiary">{user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.role === 'HEAD_ADMIN' ? 'purple' : user.role === 'ADMIN' ? 'gold' : user.role === 'MODERATOR' ? 'blue' : 'default'} size="sm">
                          {user.role === 'HEAD_ADMIN' ? 'HEAD ADMIN' : user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.emailVerified ? (
                          <UserCheck className="h-4 w-4 text-success" />
                        ) : (
                          <UserX className="h-4 w-4 text-danger" />
                        )}
                      </TableCell>
                      <TableCell>
                        {user.lastLoginCountry ? (
                          <span className="flex items-center gap-1.5 text-xs text-text-secondary">
                            <MapPin className="h-3 w-3 text-text-tertiary shrink-0" />
                            {user.lastLoginCountry}
                          </span>
                        ) : (
                          <span className="text-xs text-text-tertiary">—</span>
                        )}
                      </TableCell>
                      <TableCell align="center">{user._count.orders}</TableCell>
                      <TableCell align="center">{user._count.challenges}</TableCell>
                      <TableCell>{formatRelativeTime(user.createdAt)}</TableCell>
                      <TableCell align="center">
                        <div className="flex items-center justify-center gap-1">
                          {user.role === 'USER' && (
                            <Link
                              href={`/admin/chat?userId=${user.id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="p-1.5 rounded-lg text-text-tertiary hover:text-accent-primary hover:bg-accent-primary/10 transition-colors"
                              title="Message user"
                            >
                              <MessageCircle className="h-4 w-4" />
                            </Link>
                          )}
                          {canDelete && user.role !== 'ADMIN' && user.role !== 'HEAD_ADMIN' && user.role !== 'MODERATOR' && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDelete(user.id, user.email); }}
                              disabled={deleting === user.id}
                              className="p-1.5 rounded-lg text-text-tertiary hover:text-red-400 hover:bg-red-400/10 transition-colors disabled:opacity-50"
                              title="Delete user"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
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
    </div>
  );
}
