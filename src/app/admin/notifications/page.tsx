'use client';

import { useEffect, useState } from 'react';
import { Bell, Check, CheckCheck, Info, AlertCircle, DollarSign, Target, CreditCard } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import useToast from '@/hooks/useToast';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'payment' | 'challenge';
  read: boolean;
  link: string | null;
  createdAt: string;
}

const typeIcons: Record<string, typeof Info> = {
  info: Info,
  success: Check,
  warning: AlertCircle,
  payment: CreditCard,
  challenge: Target,
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function AdminNotificationsPage() {
  const { addToast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard/notifications')
      .then((r) => r.json())
      .then((d) => setNotifications(d.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = async () => {
    try {
      await fetch('/api/dashboard/notifications/mark-all-read', { method: 'POST' });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      addToast('All notifications marked as read.', 'success');
    } catch {
      addToast('Failed to update.', 'error');
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">Notifications</h1>
          <p className="text-text-secondary mt-1">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" icon={<CheckCheck className="h-4 w-4" />} onClick={handleMarkAllRead}>
            Mark All Read
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
        </div>
      ) : notifications.length === 0 ? (
        <GlassCard padding="lg">
          <div className="text-center py-16">
            <Bell className="h-16 w-16 text-text-tertiary mx-auto mb-4" />
            <h3 className="text-lg font-heading font-semibold">No Notifications</h3>
            <p className="text-text-secondary mt-2">Notifications will appear here.</p>
          </div>
        </GlassCard>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const Icon = typeIcons[n.type] ?? Info;
            return (
              <div
                key={n.id}
                className={`p-4 rounded-xl border transition-all ${
                  n.read
                    ? 'border-white/[0.04] bg-transparent'
                    : 'border-[rgba(230,57,70,0.20)] bg-accent-primary/[0.03]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg shrink-0 ${n.read ? 'bg-white/[0.04]' : 'bg-accent-primary/10'}`}>
                    <Icon className={`h-4 w-4 ${n.read ? 'text-text-tertiary' : 'text-accent-primary'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${n.read ? 'text-text-secondary' : 'text-text-primary'}`}>
                      {n.title}
                    </p>
                    <p className="text-xs text-text-tertiary mt-0.5">{n.message}</p>
                  </div>
                  <p className="text-xs text-text-tertiary shrink-0">{timeAgo(n.createdAt)}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
