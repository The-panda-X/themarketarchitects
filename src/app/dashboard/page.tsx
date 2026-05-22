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
  BarChart3,
  CalendarDays,
  TrendingDown,
} from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import StatCard from '@/components/ui/StatCard';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import { StaggerContainer, StaggerItem } from '@/components/effects/ScrollReveal';
import { formatCurrency, formatRelativeTime } from '@/lib/utils';
import useAuth from '@/hooks/useAuth';
import type { DashboardStats, Challenge } from '@/types';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, challengesRes] = await Promise.all([
          fetch('/api/dashboard/stats'),
          fetch('/api/dashboard/challenges?limit=5'),
        ]);

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData.data);
        }
        if (challengesRes.ok) {
          const challengesData = await challengesRes.json();
          setChallenges(challengesData.data ?? []);
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
            className="h-full"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Total Profit"
            value={loading ? '—' : formatCurrency(stats?.totalProfit ?? 0)}
            icon={<TrendingUp className="h-5 w-5" />}
            className="h-full"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Success Rate"
            value={loading ? '—' : `${stats?.successRate ?? 0}%`}
            icon={<CheckCircle className="h-5 w-5" />}
            className="h-full"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Referral Earnings"
            value={loading ? '—' : formatCurrency(stats?.referralEarnings ?? 0)}
            icon={<Users className="h-5 w-5" />}
            className="h-full"
          />
        </StaggerItem>
      </StaggerContainer>

      {/* Active Challenges — full width */}
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
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
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
                    whileHover={{ scale: 1.005 }}
                    className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-[rgba(230,57,70,0.28)] transition-colors"
                  >
                    {/* Top row: firm info + status */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2.5 rounded-lg bg-accent-primary/10">
                        <StatusIcon className="h-5 w-5 text-accent-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-sm">{challenge.firmName} — {challenge.accountSize}</p>
                          <Badge variant={config.color} size="sm">{challenge.status.replace('_', ' ')}</Badge>
                        </div>
                        <p className="text-xs text-text-tertiary mt-0.5">
                          Phase {challenge.currentPhase}
                          {challenge.startDate && ` · Started ${formatRelativeTime(challenge.startDate)}`}
                        </p>
                      </div>
                    </div>

                    {/* Stats row */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-3.5 w-3.5 text-success shrink-0" />
                        <div>
                          <p className="text-[10px] text-text-tertiary uppercase">Profit</p>
                          <p className="text-sm font-mono font-semibold text-success">
                            {formatCurrency(challenge.currentProfit)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Target className="h-3.5 w-3.5 text-accent-gold shrink-0" />
                        <div>
                          <p className="text-[10px] text-text-tertiary uppercase">Target</p>
                          <p className="text-sm font-mono font-medium">
                            {challenge.targetProfit ? formatCurrency(challenge.targetProfit) : '—'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingDown className="h-3.5 w-3.5 text-danger shrink-0" />
                        <div>
                          <p className="text-[10px] text-text-tertiary uppercase">Drawdown</p>
                          <p className="text-sm font-mono font-medium">
                            {challenge.currentDrawdown ? `${challenge.currentDrawdown.toFixed(1)}%` : '0%'}
                            {challenge.maxDrawdown ? <span className="text-text-tertiary text-[10px]"> / {challenge.maxDrawdown}%</span> : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-3.5 w-3.5 text-accent-primary shrink-0" />
                        <div>
                          <p className="text-[10px] text-text-tertiary uppercase">Win Rate</p>
                          <p className="text-sm font-mono font-medium">{challenge.winRate}%</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-3.5 w-3.5 text-text-secondary shrink-0" />
                        <div>
                          <p className="text-[10px] text-text-tertiary uppercase">Days</p>
                          <p className="text-sm font-mono font-medium">{challenge.daysTraded}</p>
                        </div>
                      </div>
                    </div>

                    {/* Progress bar */}
                    {challenge.targetProfit && challenge.targetProfit > 0 && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-[10px] text-text-tertiary uppercase">Progress to Target</p>
                          <p className="text-[10px] text-text-tertiary font-mono">{progress.toFixed(0)}%</p>
                        </div>
                        <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                            className={`h-full rounded-full ${
                              progress >= 100 ? 'bg-success' : progress >= 75 ? 'bg-accent-gold' : 'bg-accent-primary'
                            }`}
                          />
                        </div>
                      </div>
                    )}
                  </motion.div>
                </Link>
              );
            })}
          </div>
        )}
      </GlassCard>
    </div>
  );
}
