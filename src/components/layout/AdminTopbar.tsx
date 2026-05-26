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
  Users,
  ShoppingBag,
  Target,
  Banknote,
  Layers,
  FileText,
  Tag,
  ScrollText,
  Settings,
  LogOut,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import useAuth from '@/hooks/useAuth';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Dropdown from '@/components/ui/Dropdown';
import NotificationBell from '@/components/layout/NotificationBell';

const mobileAdminItems = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'Orders', href: '/admin/orders', icon: ShoppingBag },
  { label: 'Challenges', href: '/admin/challenges', icon: Target },
  { label: 'Payouts', href: '/admin/payouts', icon: Banknote },
  { label: 'Services', href: '/admin/services', icon: Layers },
  { label: 'Blog', href: '/admin/blog', icon: FileText },
  { label: 'Coupons', href: '/admin/coupons', icon: Tag },
  { label: 'Logs', href: '/admin/logs', icon: ScrollText },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
];

function getBreadcrumb(pathname: string): string[] {
  const parts = pathname.split('/').filter(Boolean);
  return parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1).replace(/-/g, ' '));
}

export default function AdminTopbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { user } = useAuth();
  const breadcrumb = getBreadcrumb(pathname);

  return (
    <>
      <header className="sticky top-0 z-20 h-16 border-b border-white/[0.06] bg-bg-primary/80 backdrop-blur-xl">
        <div className="flex items-center justify-between h-full px-4 lg:px-6">
          {/* Left */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 -ml-2 text-text-secondary hover:text-text-primary transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>
            <Badge variant="gold" size="sm" className="hidden sm:inline-flex">
              <Shield className="h-3 w-3" /> Admin
            </Badge>
            <nav className="hidden md:flex items-center gap-1.5 text-sm">
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

          {/* Right */}
          <div className="flex items-center gap-2">
            <NotificationBell notificationsHref="/admin/notifications" />

            <Dropdown
              trigger={
                <div className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white/[0.04] transition-colors cursor-pointer">
                  <Avatar src={user?.image} name={user?.name} size="sm" />
                </div>
              }
              items={[
                {
                  label: 'Admin Settings',
                  icon: <Settings className="h-4 w-4" />,
                  onClick: () => (window.location.href = '/admin/settings'),
                },
                {
                  label: 'Client Dashboard',
                  icon: <LayoutDashboard className="h-4 w-4" />,
                  onClick: () => (window.location.href = '/dashboard'),
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

      {/* Mobile sidebar */}
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
              <div className="flex items-center justify-between h-16 px-4 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <Image src="/assets/logos/logo.png" alt="Logo" width={28} height={28} />
                  <span className="text-xs font-heading font-bold">
                    ADMIN <span className="text-accent-primary">PANEL</span>
                  </span>
                </div>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-1.5 text-text-tertiary hover:text-text-primary"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
                {mobileAdminItems.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== '/admin' && pathname.startsWith(item.href));
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
                    </Link>
                  );
                })}
              </nav>

              <div className="border-t border-white/[0.06] p-3">
                <Link
                  href="/dashboard"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-text-tertiary hover:text-text-secondary hover:bg-white/[0.04] transition-colors mb-1"
                >
                  <LayoutDashboard className="h-[18px] w-[18px]" />
                  Client Dashboard
                </Link>
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
