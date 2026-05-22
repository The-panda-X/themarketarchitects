'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  CheckCircle,
  AlertTriangle,
  Info,
  CreditCard,
  Target,
  ChevronRight,
  CheckCheck,
} from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'payment' | 'challenge';
  read: boolean;
  link: string | null;
  createdAt: string;
}

const typeIcon: Record<string, React.ReactNode> = {
  info:      <Info className="h-4 w-4 text-blue-400" />,
  success:   <CheckCircle className="h-4 w-4 text-success" />,
  warning:   <AlertTriangle className="h-4 w-4 text-accent-gold" />,
  payment:   <CreditCard className="h-4 w-4 text-accent-primary" />,
  challenge: <Target className="h-4 w-4 text-accent-primary" />,
};

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const diff = now - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function NotificationBell({
  notificationsHref = '/dashboard/notifications',
}: {
  notificationsHref?: string;
}) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = useCallback(async () => {
    if (fetched) return;
    setLoading(true);
    try {
      const res = await fetch('/api/dashboard/notifications');
      if (res.ok) {
        const d = await res.json();
        setNotifications(d.data ?? []);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
      setFetched(true);
    }
  }, [fetched]);

  const handleToggle = () => {
    if (!open) fetchNotifications();
    setOpen(!open);
  };

  const handleMarkAllRead = async () => {
    try {
      await fetch('/api/dashboard/notifications/mark-all-read', { method: 'POST' });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      // silently fail
    }
  };

  const recent = notifications.slice(0, 5);

  return (
    <div ref={ref} className="relative">
      {/* Bell trigger */}
      <button
        onClick={handleToggle}
        className="relative p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-white/[0.04] transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-accent-primary text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
        {unreadCount === 0 && fetched && (
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-transparent" />
        )}
        {!fetched && (
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-accent-primary" />
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 z-50 mt-2 w-[300px] max-w-[calc(100vw-1.5rem)] rounded-xl bg-[#1e1010] border border-[rgba(230,57,70,0.30)] shadow-[0_8px_32px_rgba(0,0,0,0.7)] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.06]">
              <h3 className="text-xs font-semibold text-text-primary">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="flex items-center gap-1 text-xs text-accent-primary hover:text-red-300 transition-colors"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Mark all read
                </button>
              )}
            </div>

            {/* Notification list */}
            <div className="max-h-[280px] overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-6">
                  <div className="h-4 w-4 border-2 border-accent-primary/30 border-t-accent-primary rounded-full animate-spin" />
                </div>
              ) : recent.length === 0 ? (
                <div className="text-center py-6 px-3">
                  <Bell className="h-6 w-6 text-text-tertiary mx-auto mb-1.5" />
                  <p className="text-xs text-text-secondary">No notifications yet</p>
                </div>
              ) : (
                recent.map((n) => {
                  const content = (
                    <div
                      key={n.id}
                      className={`flex items-start gap-2.5 px-3 py-2.5 hover:bg-white/[0.03] transition-colors cursor-pointer border-b border-white/[0.03] last:border-0 ${
                        !n.read ? 'bg-white/[0.02]' : ''
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {typeIcon[n.type] ?? typeIcon.info}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-1.5">
                          <p className={`text-xs leading-tight ${!n.read ? 'font-semibold text-text-primary' : 'text-text-secondary'}`}>
                            {n.title}
                          </p>
                          {!n.read && (
                            <span className="shrink-0 mt-0.5 h-1.5 w-1.5 rounded-full bg-accent-primary" />
                          )}
                        </div>
                        <p className="text-[11px] text-text-tertiary mt-0.5 line-clamp-1">{n.message}</p>
                        <p className="text-[10px] text-text-tertiary mt-0.5">{timeAgo(n.createdAt)}</p>
                      </div>
                    </div>
                  );

                  return n.link ? (
                    <Link key={n.id} href={n.link} onClick={() => setOpen(false)}>
                      {content}
                    </Link>
                  ) : (
                    <div key={n.id}>{content}</div>
                  );
                })
              )}
            </div>

            {/* See All footer */}
            <Link
              href={notificationsHref}
              onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-1 px-3 py-2 border-t border-white/[0.06] text-xs font-medium text-accent-primary hover:bg-white/[0.03] transition-colors"
            >
              See All Notifications
              <ChevronRight className="h-4 w-4" />
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
