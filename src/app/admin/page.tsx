'use client';

import { useEffect, useState } from 'react';
import {
  DollarSign, Users, ShoppingBag, Target, TrendingUp,
  MessageSquare, Clock, AlertCircle, Globe,
} from 'lucide-react';
import StatCard from '@/components/ui/StatCard';
import GlassCard from '@/components/ui/GlassCard';
import Skeleton from '@/components/ui/Skeleton';

interface AdminStats {
  revenueToday: number;
  revenueWeek: number;
  revenueMonth: number;
  revenueTotal: number;
  newUsersToday: number;
  totalUsers: number;
  pendingOrders: number;
  openTickets: number;
  activeChallenges: number;
  challengesByStatus: Record<string, number>;
  usersByCountry: Array<{ country: string; count: number }>;
}

function fmt(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((r) => r.json())
      .then((d) => setStats(d.data))
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-heading font-bold">Admin Dashboard</h1>
          <p className="text-text-secondary mt-1">Platform overview and key metrics.</p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">Admin Dashboard</h1>
        <p className="text-text-secondary mt-1">Platform overview and key metrics.</p>
      </div>

      {/* Revenue */}
      <div>
        <h2 className="text-sm font-semibold text-text-tertiary uppercase tracking-wider mb-3">Revenue</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Today" value={fmt(stats?.revenueToday ?? 0)} prefix="$" icon={<DollarSign className="h-5 w-5" />} />
          <StatCard label="This Week" value={fmt(stats?.revenueWeek ?? 0)} prefix="$" icon={<TrendingUp className="h-5 w-5" />} />
          <StatCard label="This Month" value={fmt(stats?.revenueMonth ?? 0)} prefix="$" icon={<TrendingUp className="h-5 w-5" />} />
          <StatCard label="All Time" value={fmt(stats?.revenueTotal ?? 0)} prefix="$" icon={<DollarSign className="h-5 w-5" />} />
        </div>
      </div>

      {/* Platform */}
      <div>
        <h2 className="text-sm font-semibold text-text-tertiary uppercase tracking-wider mb-3">Platform</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="New Users Today"
            value={stats?.newUsersToday ?? 0}
            change={`${stats?.totalUsers ?? 0} total`}
            icon={<Users className="h-5 w-5" />}
          />
          <StatCard
            label="Pending Orders"
            value={stats?.pendingOrders ?? 0}
            change="Awaiting payment"
            changeType={stats?.pendingOrders ? 'negative' : 'neutral'}
            icon={<ShoppingBag className="h-5 w-5" />}
          />
          <StatCard
            label="Active Challenges"
            value={stats?.activeChallenges ?? 0}
            icon={<Target className="h-5 w-5" />}
          />
          <StatCard
            label="Open Tickets"
            value={stats?.openTickets ?? 0}
            changeType={stats?.openTickets ? 'negative' : 'neutral'}
            change={stats?.openTickets ? 'Needs attention' : 'All clear'}
            icon={<MessageSquare className="h-5 w-5" />}
          />
        </div>
      </div>

      {/* Challenge breakdown */}
      <GlassCard padding="lg">
        <h3 className="text-base font-heading font-semibold mb-4 flex items-center gap-2">
          <Target className="h-4 w-4 text-accent-primary" />
          Challenges by Status
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { status: 'PENDING', label: 'Pending', color: 'text-text-tertiary' },
            { status: 'IN_PROGRESS', label: 'In Progress', color: 'text-accent-primary' },
            { status: 'PHASE_1', label: 'Phase 1', color: 'text-blue-400' },
            { status: 'PHASE_2', label: 'Phase 2', color: 'text-purple-400' },
            { status: 'PASSED', label: 'Passed', color: 'text-success' },
            { status: 'FUNDED', label: 'Funded', color: 'text-accent-gold' },
          ].map(({ status, label, color }) => (
            <div key={status} className="text-center p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <p className={`text-2xl font-bold font-mono ${color}`}>
                {stats?.challengesByStatus?.[status] ?? 0}
              </p>
              <p className="text-xs text-text-tertiary mt-1">{label}</p>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Users by Country */}
      {stats?.usersByCountry && stats.usersByCountry.length > 0 && (
        <GlassCard padding="lg">
          <h3 className="text-base font-heading font-semibold mb-4 flex items-center gap-2">
            <Globe className="h-4 w-4 text-accent-primary" />
            Users by Country
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {stats.usersByCountry.map(({ country, count }) => (
              <div
                key={country}
                className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]"
              >
                <span className="text-sm text-text-secondary truncate">{country}</span>
                <span className="text-sm font-mono font-bold text-accent-primary ml-2 shrink-0">{count}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Quick links */}
      <GlassCard padding="md">
        <h3 className="text-sm font-semibold text-text-secondary mb-3">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'View Pending Orders', href: '/admin/orders?status=PENDING_PAYMENT', icon: Clock },
            { label: 'Open Tickets', href: '/admin/tickets?status=OPEN', icon: AlertCircle },
            { label: 'Active Challenges', href: '/admin/challenges?status=IN_PROGRESS', icon: Target },
            { label: 'All Users', href: '/admin/users', icon: Users },
          ].map(({ label, href, icon: Icon }) => (
            <a
              key={href}
              href={href}
              className="flex items-center gap-2 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-colors text-sm text-text-secondary hover:text-text-primary"
            >
              <Icon className="h-4 w-4 text-accent-primary shrink-0" />
              {label}
            </a>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
