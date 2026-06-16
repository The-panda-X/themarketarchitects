'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  ShoppingBag,
  Target,
  Banknote,
  FileText,
  Tag,
  ScrollText,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Shield,
  Radio,
  Layers,
  MessageCircle,
  Home,
  TicketCheck,
  Bell,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import useAuth from '@/hooks/useAuth';
import Avatar from '@/components/ui/Avatar';
import { setLastPanel } from '@/hooks/useLastPanel';

/** Navigation items with optional minimum role requirement.
 *  'admin' = ADMIN or HEAD_ADMIN only. Omit = all staff. */
const adminNavItems: { label: string; href: string; icon: typeof LayoutDashboard; minRole?: 'admin'; badgeKey?: string }[] = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'Orders', href: '/admin/orders', icon: ShoppingBag, badgeKey: 'orders' },
  { label: 'Challenges', href: '/admin/challenges', icon: Target },
  { label: 'Signal Hub', href: '/admin/signals', icon: Radio, minRole: 'admin' },
  { label: 'Chat', href: '/admin/chat', icon: MessageCircle },
  { label: 'Tickets', href: '/admin/tickets', icon: TicketCheck },
  { label: 'Payouts', href: '/admin/payouts', icon: Banknote },
  { label: 'Referrals', href: '/admin/referrals', icon: Users },
  { label: 'Notifications', href: '/admin/notifications', icon: Bell },
  { label: 'Services', href: '/admin/services', icon: Layers, minRole: 'admin' },
  { label: 'Blog', href: '/admin/blog', icon: FileText },
  { label: 'Home Page', href: '/admin/home-page', icon: Home, minRole: 'admin' },
  { label: 'Coupons', href: '/admin/coupons', icon: Tag, minRole: 'admin' },
  { label: 'Activity Logs', href: '/admin/logs', icon: ScrollText, minRole: 'admin' },
  { label: 'Settings', href: '/admin/settings', icon: Settings, minRole: 'admin' },
];

export default function AdminSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { user, isHeadAdmin, isAdmin, canViewSensitive } = useAuth();
  const [pendingOrders, setPendingOrders] = useState(0);

  const roleLabel = isHeadAdmin ? 'Head Administrator' : isAdmin ? 'Administrator' : 'Moderator';

  // Filter nav items based on role
  const visibleNavItems = adminNavItems.filter((item) => {
    if (item.minRole === 'admin' && !canViewSensitive) return false;
    return true;
  });

  // Fetch pending order count and poll every 30s
  useEffect(() => {
    let mounted = true;

    async function fetchPendingCount() {
      try {
        const res = await fetch('/api/admin/orders/pending-count');
        if (res.ok) {
          const data = await res.json();
          if (mounted) setPendingOrders(data.data?.count ?? 0);
        }
      } catch {
        // silent
      }
    }

    fetchPendingCount();
    const interval = setInterval(fetchPendingCount, 30_000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  // Clear badge when admin visits the orders page
  useEffect(() => {
    if (pathname.startsWith('/admin/orders')) {
      setPendingOrders(0);
    }
  }, [pathname]);

  // Map badgeKey → count
  const badgeCounts: Record<string, number> = {
    orders: pendingOrders,
  };

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className={cn(
        'hidden lg:flex flex-col h-screen sticky top-0 border-r border-white/[0.06]',
        'bg-bg-secondary/80 backdrop-blur-xl z-30'
      )}
    >
      {/* Logo + admin badge */}
      <div className="flex items-center gap-2.5 h-20 px-4 border-b border-white/[0.06] shrink-0">
        <Image
          src="/assets/logos/logo.png"
          alt="Logo"
          width={32}
          height={32}
          className="shrink-0"
        />
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="flex items-center gap-2 overflow-hidden whitespace-nowrap"
            >
              <span className="text-xs font-heading font-bold tracking-wide">
                ADMIN <span className="text-accent-primary">PANEL</span>
              </span>
              <Shield className="h-3.5 w-3.5 text-accent-gold" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto no-scrollbar py-4 px-2 space-y-1">
        {visibleNavItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/admin' && pathname.startsWith(item.href));
          const badgeCount = item.badgeKey ? (badgeCounts[item.badgeKey] ?? 0) : 0;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative',
                isActive
                  ? 'bg-accent-primary/10 text-accent-primary'
                  : 'text-text-secondary hover:text-text-primary hover:bg-white/[0.04]',
                collapsed && 'justify-center px-0'
              )}
              title={collapsed ? item.label : undefined}
            >
              <div className="relative shrink-0">
                <item.icon
                  className={cn(
                    'h-[18px] w-[18px]',
                    isActive ? 'text-accent-primary' : 'text-text-tertiary group-hover:text-text-secondary'
                  )}
                />
                {/* Red dot for collapsed sidebar */}
                {collapsed && badgeCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 h-4 min-w-[16px] px-1 flex items-center justify-center rounded-full bg-danger text-[10px] font-bold text-white">
                    {badgeCount > 99 ? '99+' : badgeCount}
                  </span>
                )}
              </div>
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className="whitespace-nowrap overflow-hidden flex-1"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
              {/* Badge for expanded sidebar */}
              {!collapsed && badgeCount > 0 && (
                <span className="ml-auto h-5 min-w-[20px] px-1.5 flex items-center justify-center rounded-full bg-danger text-[11px] font-bold text-white shrink-0">
                  {badgeCount > 99 ? '99+' : badgeCount}
                </span>
              )}
            </Link>
          );
        })}

        {/* Back to User Dashboard */}
        <div className="border-t border-white/[0.04] my-3" />
        <Link
          href="/dashboard"
          onClick={() => setLastPanel('dashboard')}
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-text-secondary hover:text-text-primary hover:bg-white/[0.04] transition-colors',
            collapsed && 'justify-center px-0'
          )}
          title={collapsed ? 'User Dashboard' : undefined}
        >
          <LayoutDashboard className="h-[18px] w-[18px] shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="whitespace-nowrap overflow-hidden"
              >
                User Dashboard
              </motion.span>
            )}
          </AnimatePresence>
        </Link>
      </nav>

      {/* Bottom */}
      <div className="border-t border-white/[0.06] p-3 space-y-2 shrink-0">
        <div className={cn('flex items-center gap-3 px-2 py-2 rounded-xl', collapsed && 'justify-center px-0')}>
          <Avatar src={user?.image} name={user?.name} size="sm" />
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="flex-1 min-w-0 overflow-hidden"
              >
                <p className="text-sm font-medium text-text-primary truncate">
                  {user?.name || 'Admin'}
                </p>
                <p className="text-[10px] text-accent-gold font-medium">{roleLabel}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className={cn('flex gap-1', collapsed ? 'flex-col items-center' : '')}>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 rounded-lg text-text-tertiary hover:text-text-secondary hover:bg-white/[0.04] transition-colors"
            title={collapsed ? 'Expand' : 'Collapse'}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
          {!collapsed && (
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="flex-1 flex items-center justify-center gap-2 p-2 rounded-lg text-text-tertiary hover:text-danger hover:bg-danger/5 transition-colors text-sm"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          )}
          {collapsed && (
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="p-2 rounded-lg text-text-tertiary hover:text-danger hover:bg-danger/5 transition-colors"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </motion.aside>
  );
}
