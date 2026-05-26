'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Menu,
  X,
  LayoutDashboard,
  Target,
  BarChart3,
  ShoppingCart,
  Briefcase,
  CreditCard,
  KeyRound,
  HeadphonesIcon,
  Users,
  Settings,
  Calculator,
  LineChart,
  LogOut,
  Shield,
  Coins,
  MessageCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import useAuth from '@/hooks/useAuth';
import useChatUnread from '@/hooks/useChatUnread';
import Avatar from '@/components/ui/Avatar';
import NotificationBell from '@/components/layout/NotificationBell';
import Dropdown from '@/components/ui/Dropdown';

const mobileNavItems = [
  { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Challenges', href: '/dashboard/challenges', icon: Target },
  { label: 'Purchase', href: '/dashboard/purchase', icon: ShoppingCart },
  { label: 'Services', href: '/dashboard/services', icon: Briefcase },
  { label: 'Payments', href: '/dashboard/payments', icon: CreditCard },
  { label: 'Credentials', href: '/dashboard/credentials', icon: KeyRound },
  { label: 'Messages', href: '/dashboard/chat', icon: MessageCircle },
  { label: 'Support', href: '/dashboard/support', icon: HeadphonesIcon },
  { label: 'Profit Split', href: '/dashboard/profit-split', icon: Coins },
  { label: 'Referrals', href: '/dashboard/referrals', icon: Users },
  { label: 'Calculator', href: '/dashboard/tools/calculator', icon: Calculator },
  { label: 'Widgets', href: '/dashboard/tools/widgets', icon: LineChart },
  { label: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
];

function getBreadcrumb(pathname: string): string[] {
  const parts = pathname.split('/').filter(Boolean);
  return parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1).replace(/-/g, ' '));
}

export default function DashboardTopbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { user, isStaff } = useAuth();
  const chatUnread = useChatUnread();
  const breadcrumb = getBreadcrumb(pathname);

  return (
    <>
      <header className="sticky top-0 z-20 h-16 border-b border-white/[0.06] bg-[rgba(9,7,7,0.70)] backdrop-blur-xl">
        <div className="flex items-center justify-between h-full px-4 lg:px-6">
          {/* Left: Mobile menu + Breadcrumb */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 -ml-2 text-text-secondary hover:text-text-primary transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>
            <nav className="hidden sm:flex items-center gap-1.5 text-sm">
              {breadcrumb.map((crumb, i) => (
                <span key={i} className="flex items-center gap-1.5">
                  {i > 0 && <span className="text-text-tertiary">/</span>}
                  <span
                    className={cn(
                      i === breadcrumb.length - 1
                        ? 'text-text-primary font-medium'
                        : 'text-text-tertiary'
                    )}
                  >
                    {crumb}
                  </span>
                </span>
              ))}
            </nav>
          </div>

          {/* Right: Notifications + User */}
          <div className="flex items-center gap-2">
            <NotificationBell notificationsHref="/dashboard/notifications" />

            <Dropdown
              trigger={
                <div className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white/[0.04] transition-colors cursor-pointer">
                  <Avatar src={user?.image} name={user?.name} size="sm" />
                  <span className="hidden md:block text-sm text-text-secondary">
                    {user?.name?.split(' ')[0] || 'User'}
                  </span>
                </div>
              }
              items={[
                {
                  label: 'Settings',
                  icon: <Settings className="h-4 w-4" />,
                  onClick: () => (window.location.href = '/dashboard/settings'),
                },
                {
                  label: 'Support',
                  icon: <HeadphonesIcon className="h-4 w-4" />,
                  onClick: () => (window.location.href = '/dashboard/support'),
                },
                {
                  label: 'Logout',
                  icon: <LogOut className="h-4 w-4" />,
                  onClick: () => signOut({ callbackUrl: '/login' }),
                  danger: true,
                  divider: true,
                },
              ]}
            />
          </div>
        </div>
      </header>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="absolute left-0 top-0 bottom-0 w-[280px] bg-bg-secondary border-r border-white/[0.06] flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between h-16 px-4 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <Image src="/assets/logos/logo.png" alt="Logo" width={28} height={28} />
                  <span className="text-xs font-heading font-bold">
                    MARKET <span className="text-accent-primary">ARCHITECTS</span>
                  </span>
                </div>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-1.5 text-text-tertiary hover:text-text-primary"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Nav items */}
              <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
                {mobileNavItems.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== '/dashboard' && pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-accent-primary/10 text-accent-primary'
                          : 'text-text-secondary hover:text-text-primary hover:bg-white/[0.04]'
                      )}
                    >
                      <item.icon className="h-[18px] w-[18px] shrink-0" />
                      {item.label}
                      {item.href === '/dashboard/chat' && chatUnread > 0 && (
                        <span className="ml-auto flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-accent-primary text-[10px] font-bold text-white leading-none">
                          {chatUnread > 9 ? '9+' : chatUnread}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>

              {/* Footer */}
              <div className="border-t border-white/[0.06] p-3 space-y-1">
                {isStaff && (
                  <Link
                    href="/admin"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-accent-gold hover:bg-accent-gold/10 transition-colors"
                  >
                    <Shield className="h-[18px] w-[18px] shrink-0" />
                    Admin Panel
                  </Link>
                )}
                <button
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-text-secondary hover:text-danger hover:bg-danger/5 transition-colors"
                >
                  <LogOut className="h-[18px] w-[18px]" />
                  Logout
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
