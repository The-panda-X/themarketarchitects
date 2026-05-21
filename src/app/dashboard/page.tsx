'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Target,
  TrendingUp,
  DollarSign,
  Users,
  ArrowRight,
  Clock,
  CheckCircle,
  AlertCircle,
  Activity,
} from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import StatCard from '@/components/ui/StatCard';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import { StaggerContainer, StaggerItem } from '@/components/effects/ScrollReveal';
import { formatCurrency, formatRelativeTime } from '@/lib/utils';
import useAuth from '@/hooks/useAuth';
import type { DashboardStats, Challenge, Notification } from '@/types';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, challengesRes, notificationsRes] = await Promise.all([
          fetch('/api/dashboard/stats'),
          fetch('/api/dashboard/challenges?limit=3'),
          fetch('/api/dashboard/notifications?limit=5'),
        ]);

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData.data);
        }
        if (challengesRes.ok) {
          const challengesData = await challengesRes.json();
          setChallenges(challengesData.data ?? []);
        }
        if (notificationsRes.ok) {
          const notificationsData = await notificationsRes.json();
          setNotifications(notificationsData.data ?? []);
        }
      } catch {
        // API not connected yet — show empty state
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const statusConfig: Record<string, { color: 'green' | 'yellow' | 'blue' | 'red' | 'purple'; icon: typeof Target }> = {
    PASSED: { color: 'green', icon: CheckCircle },
    IN_PROGRESS: { color: 'blue', icon: Activity },
    PHASE_1: { color: 'yellow', icon: Target },
    PHASE_2: { color: 'yellow', icon: Target },
    PENDING: { color: 'purple', icon: Clock },
    FAILED: { color: 'red', icon: AlertCircle },
    FUNDED: { color: 'green', icon: DollarSign },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-heading font-bold">
          Welcome back, <span className="text-gradient-red">{user?.name?.split(' ')[0] || 'Trader'}</span>
        </h1>
        <p className="text-text-secondary mt-1">Here&apos;s an overview of your account.</p>
      </div>

      {/* Stats Grid */}
      <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StaggerItem>
          <StatCard
            label="Active Challenges"
            value={loading ? '—' : String(stats?.activeChallenges ?? 0)}
            icon={<Target className="h-5 w-5" />}
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Total Profit"
            value={loading ? '—' : formatCurrency(stats?.totalProfit ?? 0)}
            icon={<TrendingUp className="h-5 w-5" />}
            change={stats?.totalProfit && stats.totalProfit > 0 ? `+${formatCurrency(stats.totalProfit)}` : undefined}
            changeType="positive"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Success Rate"
            value={loading ? '—' : `${stats?.successRate ?? 0}%`}
            icon={<CheckCircle className="h-5 w-5" />}
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Referral Earnings"
            value={loading ? '—' : formatCurrency(stats?.referralEarnings ?? 0)}
            icon={<Users className="h-5 w-5" />}
          />
        </StaggerItem>
      </StaggerContainer>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Active Challenges */}
        <div className="lg:col-span-2">
          <GlassCard padding="none" className="p-4 sm:p-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-heading font-semibold">Active Challenges</h2>
              <Link href="/dashboard/challenges">
                <Button variant="ghost" size="sm" icon={<ArrowRight className="h-4 w-4" />} iconPosition="right">
                  View All
                </Button>
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-xl" />
                ))}
              </div>
            ) : challenges.length === 0 ? (
              <div className="text-center py-12">
                <Target className="h-12 w-12 text-text-tertiary mx-auto mb-3" />
                <p className="text-text-secondary font-medium">No active challenges</p>
                <p className="text-text-tertiary text-sm mt-1">Purchase a plan to get started.</p>
                <Link href="/dashboard/purchase" className="mt-4 inline-block">
                  <Button variant="primary" size="sm">Get Started</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {challenges.map((challenge) => {
                  const config = statusConfig[challenge.status] ?? statusConfig.PENDING;
                  const StatusIcon = config.icon;
                  const progress = challenge.targetProfit
                    ? Math.min(100, (challenge.currentProfit / challenge.targetProfit) * 100)
                    : 0;

                  return (
                    <Link key={challenge.id} href={`/dashboard/challenges/${challenge.id}`}>
                      <motion.div
                        whileHover={{ scale: 1.01 }}
                        className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-[rgba(230,57,70,0.28)] transition-colors"
                      >
                        <div className="p-2.5 rounded-lg bg-accent-primary/10">
                          <StatusIcon className="h-5 w-5 text-accent-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm">{challenge.firmName} — {challenge.accountSize}</p>
                            <Badge variant={config.color} size="sm">{challenge.status.replace('_', ' ')}</Badge>
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-xs text-text-tertiary">
                            <span>Phase {challenge.currentPhase}</span>
                            <span>Profit: {formatCurrency(challenge.currentProfit)}</span>
                            <span>Win Rate: {challenge.winRate}%</span>
                          </div>
                        </div>
                        <div className="hidden sm:block w-24">
                          <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${progress}%` }}
                              transition={{ duration: 1, ease: 'easeOut' }}
                              className="h-full bg-accent-primary rounded-full"
                            />
                          </div>
                          <p className="text-[10px] text-text-tertiary mt-1 text-right">{progress.toFixed(0)}%</p>
                        </div>
                      </motion.div>
                    </Link>
                  );
                })}
              </div>
            )}
          </GlassCard>
        </div>

        {/* Recent Notifications */}
        <div>
          <GlassCard padding="none" className="p-4 sm:p-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-heading font-semibold">Notifications</h2>
              <Link href="/dashboard/notifications">
                <Button variant="ghost" size="sm">View All</Button>
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-lg" />
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <p className="text-text-tertiary text-sm text-center py-8">No notifications yet.</p>
            ) : (
              <div className="space-y-2">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-3 rounded-lg border transition-colors ${
                      n.read
                        ? 'border-white/[0.04] bg-transparent'
                        : 'border-[rgba(230,57,70,0.20)] bg-accent-primary/[0.03]'
                    }`}
                  >
                    <p className="text-sm font-medium leading-snug">{n.title}</p>
                    <p className="text-xs text-text-tertiary mt-0.5">{formatRelativeTime(n.createdAt)}</p>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
