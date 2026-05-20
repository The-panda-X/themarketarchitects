'use client';

import { useEffect, useState } from 'react';
import { Bell, Check, CheckCheck, Trash2, Info, AlertCircle, DollarSign, Target } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { formatRelativeTime } from '@/lib/utils';
import useNotificationStore from '@/store/notificationStore';
import type { Notification } from '@/types';

const typeIcons: Record<string, typeof Info> = {
  info: Info,
  success: Check,
  warning: AlertCircle,
  payment: DollarSign,
  challenge: Target,
};

export default function NotificationsPage() {
  const { addToast } = useToast();
  const { notifications, setNotifications, markAsRead, markAllAsRead } = useNotificationStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNotifications() {
      try {
        const res = await fetch('/api/dashboard/notifications');
        if (res.ok) {
          const data = await res.json();
          setNotifications(data.data ?? []);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    fetchNotifications();
  }, [setNotifications]);

  const handleMarkAllRead = async () => {
    try {
      await fetch('/api/dashboard/notifications/read-all', { method: 'POST' });
      markAllAsRead();
      addToast('All notifications marked as read.', 'success');
    } catch {
      addToast('Failed to update notifications.', 'error');
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await fetch(`/api/dashboard/notifications/${id}/read`, { method: 'POST' });
      markAsRead(id);
    } catch {
      // silent
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">Notifications</h1>
          <p className="text-text-secondary mt-1">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            icon={<CheckCheck className="h-4 w-4" />}
            onClick={handleMarkAllRead}
          >
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
            <p className="text-text-secondary mt-2">You&apos;re all caught up! Notifications will appear here.</p>
          </div>
        </GlassCard>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => {
            const Icon = typeIcons[notification.type] ?? Info;
            return (
              <button
                key={notification.id}
                onClick={() => !notification.read && handleMarkRead(notification.id)}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  notification.read
                    ? 'border-white/[0.04] bg-transparent hover:bg-white/[0.02]'
                    : 'border-accent-primary/20 bg-accent-primary/[0.03] hover:bg-accent-primary/[0.05]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg shrink-0 ${notification.read ? 'bg-white/[0.04]' : 'bg-accent-primary/10'}`}>
                    <Icon className={`h-4 w-4 ${notification.read ? 'text-text-tertiary' : 'text-accent-primary'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${notification.read ? 'text-text-secondary' : 'text-text-primary'}`}>
                      {notification.title}
                    </p>
                    <p className="text-xs text-text-tertiary mt-0.5">{notification.message}</p>
                  </div>
                  <p className="text-xs text-text-tertiary shrink-0">{formatRelativeTime(notification.createdAt)}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
