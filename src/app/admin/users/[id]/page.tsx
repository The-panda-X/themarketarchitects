'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ShoppingBag, Target, Mail, Calendar, Shield } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import Skeleton from '@/components/ui/Skeleton';
import Modal from '@/components/ui/Modal';
import Select from '@/components/ui/Select';
import useToast from '@/hooks/useToast';
import useAuth from '@/hooks/useAuth';
import { formatDate, formatRelativeTime } from '@/lib/utils';

interface UserDetail {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
  role: string;
  emailVerified: string | null;
  referralCode: string;
  createdAt: string;
  orders: Array<{ id: string; planName: string; status: string; totalAmount: number; createdAt: string }>;
  challenges: Array<{ id: string; firmName: string; accountSize: string; status: string; createdAt: string }>;
}

export default function AdminUserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { addToast } = useToast();
  const { isHeadAdmin, isAdmin, isModerator } = useAuth();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [newRole, setNewRole] = useState('USER');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/users/${params.id}`)
      .then((r) => r.json())
      .then((d) => { setUser(d.data); setNewRole(d.data?.role ?? 'USER'); })
      .finally(() => setLoading(false));
  }, [params.id]);

  const handleRoleUpdate = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        const d = await res.json();
        setUser((prev) => prev ? { ...prev, role: d.data.role } : prev);
        addToast('User role updated.', 'success');
        setShowRoleModal(false);
      } else {
        addToast('Failed to update role.', 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="space-y-4 max-w-3xl">
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-32 rounded-2xl" />
      <Skeleton className="h-48 rounded-2xl" />
    </div>
  );

  if (!user) return (
    <div className="text-center py-20">
      <p className="text-text-secondary">User not found.</p>
      <Button variant="secondary" onClick={() => router.push('/admin/users')} className="mt-4">Back</Button>
    </div>
  );

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Link href="/admin/users">
          <Button variant="ghost" size="sm" icon={<ArrowLeft className="h-4 w-4" />}>Users</Button>
        </Link>
        <h1 className="text-xl font-heading font-bold flex-1">User Detail</h1>
        {(isHeadAdmin || isAdmin) && (
          <Button variant="secondary" size="sm" onClick={() => setShowRoleModal(true)}>
            Change Role
          </Button>
        )}
      </div>

      {/* Profile */}
      <GlassCard padding="lg">
        <div className="flex items-center gap-4 mb-6">
          <Avatar src={user.avatar} name={user.name} size="xl" />
          <div>
            <p className="font-heading font-semibold text-lg">{user.name ?? 'No name'}</p>
            <p className="text-sm text-text-tertiary">{user.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={user.role === 'HEAD_ADMIN' ? 'purple' : user.role === 'ADMIN' ? 'gold' : user.role === 'MODERATOR' ? 'blue' : 'default'} size="sm">
                {user.role === 'HEAD_ADMIN' ? 'HEAD ADMIN' : user.role}
              </Badge>
              {user.emailVerified ? (
                <Badge variant="green" size="sm">Verified</Badge>
              ) : (
                <Badge variant="red" size="sm">Unverified</Badge>
              )}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2 text-text-secondary">
            <Mail className="h-4 w-4 text-text-tertiary" />{user.email}
          </div>
          <div className="flex items-center gap-2 text-text-secondary">
            <Calendar className="h-4 w-4 text-text-tertiary" />Joined {formatDate(user.createdAt)}
          </div>
          <div className="flex items-center gap-2 text-text-secondary">
            <Shield className="h-4 w-4 text-text-tertiary" />Referral: {user.referralCode}
          </div>
        </div>
      </GlassCard>

      {/* Orders */}
      <GlassCard padding="lg">
        <h3 className="text-base font-heading font-semibold flex items-center gap-2 mb-4">
          <ShoppingBag className="h-4 w-4 text-accent-primary" />Recent Orders
        </h3>
        {user.orders.length === 0 ? (
          <p className="text-sm text-text-tertiary">No orders yet.</p>
        ) : (
          <div className="space-y-2">
            {user.orders.map((order) => (
              <Link key={order.id} href={`/admin/orders/${order.id}`}>
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] transition-colors">
                  <div>
                    <p className="text-sm font-medium">{order.planName}</p>
                    <p className="text-xs text-text-tertiary">{formatRelativeTime(order.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono">${order.totalAmount}</p>
                    <Badge variant="default" size="sm">{order.status}</Badge>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </GlassCard>

      {/* Challenges */}
      <GlassCard padding="lg">
        <h3 className="text-base font-heading font-semibold flex items-center gap-2 mb-4">
          <Target className="h-4 w-4 text-accent-primary" />Recent Challenges
        </h3>
        {user.challenges.length === 0 ? (
          <p className="text-sm text-text-tertiary">No challenges yet.</p>
        ) : (
          <div className="space-y-2">
            {user.challenges.map((ch) => (
              <Link key={ch.id} href={`/admin/challenges/${ch.id}`}>
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] transition-colors">
                  <div>
                    <p className="text-sm font-medium">{ch.firmName} — {ch.accountSize}</p>
                    <p className="text-xs text-text-tertiary">{formatRelativeTime(ch.createdAt)}</p>
                  </div>
                  <Badge variant="default" size="sm">{ch.status}</Badge>
                </div>
              </Link>
            ))}
          </div>
        )}
      </GlassCard>

      {/* Role Modal */}
      <Modal isOpen={showRoleModal} onClose={() => setShowRoleModal(false)} title="Change User Role" size="sm">
        <div className="space-y-4">
          <Select label="Role" value={newRole} onChange={(e) => setNewRole(e.target.value)}>
            <option value="USER">User</option>
            <option value="MODERATOR">Moderator</option>
            {isHeadAdmin && <option value="ADMIN">Admin</option>}
            {isHeadAdmin && <option value="HEAD_ADMIN">Head Admin</option>}
          </Select>
          <div className="flex gap-3">
            <Button variant="primary" loading={saving} onClick={handleRoleUpdate} fullWidth>Save</Button>
            <Button variant="ghost" onClick={() => setShowRoleModal(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
