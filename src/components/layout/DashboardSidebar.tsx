'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Target,
  BarChart3,
  ShoppingCart,
  Briefcase,
  CreditCard,
  KeyRound,
  Bell,
  HeadphonesIcon,
  Users,
  Settings,
  Calculator,
  LineChart,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import useAuth from '@/hooks/useAuth';
import Avatar from '@/components/ui/Avatar';

const navItems = [
  { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { label: 'My Challenges', href: '/dashboard/challenges', icon: Target },
  { label: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { label: 'Purchase', href: '/dashboard/purchase', icon: ShoppingCart },
  { label: 'Services', href: '/dashboard/services', icon: Briefcase },
  { label: 'Payments', href: '/dashboard/payments', icon: CreditCard },
  { label: 'Credentials', href: '/dashboard/credentials', icon: KeyRound },
  { label: 'Notifications', href: '/dashboard/notifications', icon: Bell },
  { label: 'Support', href: '/dashboard/support', icon: HeadphonesIcon },
  { label: 'Referrals', href: '/dashboard/referrals', icon: Users },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
];

const toolItems = [
  { label: 'Calculator', href: '/dashboard/tools/calculator', icon: Calculator },
  { label: 'Market Widgets', href: '/dashboard/tools/widgets', icon: LineChart },
];

export default function DashboardSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 260 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className={cn(
          'hidden lg:flex flex-col h-screen sticky top-0 border-r border-white/[0.06]',
          'bg-bg-secondary/80 backdrop-blur-xl z-30'
        )}
      >
        {/* Logo */}
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
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="text-xs font-heading font-bold tracking-wide whitespace-nowrap overflow-hidden"
              >
                THE MARKET <span className="text-accent-primary">ARCHITECTS</span>
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto no-scrollbar py-4 px-2 space-y-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group',
                  isActive
                    ? 'bg-accent-primary/10 text-accent-primary'
                    : 'text-text-secondary hover:text-text-primary hover:bg-white/[0.04]',
                  collapsed && 'justify-center px-0'
                )}
                title={collapsed ? item.label : undefined}
              >
                <item.icon
                  className={cn(
                    'h-[18px] w-[18px] shrink-0 transition-colors',
                    isActive ? 'text-accent-primary' : 'text-text-tertiary group-hover:text-text-secondary'
                  )}
                />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      className="whitespace-nowrap overflow-hidden"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            );
          })}

          {/* Tools section */}
          {!collapsed && (
            <div className="pt-4 mt-4 border-t border-white/[0.04]">
              <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-text-tertiary">
                Tools
              </p>
            </div>
          )}
          {collapsed && <div className="border-t border-white/[0.04] my-3" />}

          {toolItems.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group',
                  isActive
                    ? 'bg-accent-primary/10 text-accent-primary'
                    : 'text-text-secondary hover:text-text-primary hover:bg-white/[0.04]',
                  collapsed && 'justify-center px-0'
                )}
                title={collapsed ? item.label : undefined}
              >
                <item.icon
                  className={cn(
                    'h-[18px] w-[18px] shrink-0',
                    isActive ? 'text-accent-primary' : 'text-text-tertiary group-hover:text-text-secondary'
                  )}
                />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      className="whitespace-nowrap overflow-hidden"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            );
          })}
        </nav>

        {/* Bottom: User + Collapse */}
        <div className="border-t border-white/[0.06] p-3 space-y-2 shrink-0">
          {/* User */}
          <div
            className={cn(
              'flex items-center gap-3 px-2 py-2 rounded-xl',
              collapsed && 'justify-center px-0'
            )}
          >
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
                    {user?.name || 'User'}
                  </p>
                  <p className="text-xs text-text-tertiary truncate">{user?.email}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Actions */}
          <div className={cn('flex gap-1', collapsed ? 'flex-col items-center' : '')}>
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-2 rounded-lg text-text-tertiary hover:text-text-secondary hover:bg-white/[0.04] transition-colors"
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
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
    </>
  );
}
