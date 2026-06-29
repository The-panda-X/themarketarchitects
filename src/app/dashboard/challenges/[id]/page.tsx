'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Target,
  TrendingUp,
  TrendingDown,
  Calendar,
  Award,
  Activity,
  BarChart3,
  Wallet,
} from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import StatCard from '@/components/ui/StatCard';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import ProgressBar from '@/components/ui/ProgressBar';
import Skeleton from '@/components/ui/Skeleton';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Challenge, DailyStat } from '@/types';

export default function ChallengeDetailPage() {
  const params = useParams();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [dailyStats, setDailyStats] = useState<DailyStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchChallenge() {
      try {
        const res = await fetch(`/api/dashboard/challenges/${params.id}`);
        if (res.ok) {
          const data = await res.json();
          setChallenge(data.data?.challenge ?? null);
          setDailyStats(data.data?.dailyStats ?? []);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    fetchChallenge();
  }, [params.id]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="text-center py-20">
        <Target className="h-16 w-16 text-text-tertiary mx-auto mb-4" />
        <h2 className="text-xl font-heading font-semibold">Challenge Not Found</h2>
        <Link href="/dashboard/challenges" className="mt-4 inline-block">
          <Button variant="secondary">Back to Challenges</Button>
        </Link>
      </div>
    );
  }

  const progress = challenge.targetProfit
    ? Math.min(100, (challenge.currentProfit / challenge.targetProfit) * 100)
    : 0;

  const drawdownUsed = challenge.maxDrawdown
    ? (challenge.currentDrawdown / challenge.maxDrawdown) * 100
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/challenges">
          <Button variant="ghost" size="sm" icon={<ArrowLeft className="h-4 w-4" />}>
            Back
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-heading font-bold">
              {challenge.firmName} — {challenge.accountSize}
            </h1>
            <Badge
              variant={
                challenge.status === 'PASSED' || challenge.status === 'FUNDED'
                  ? 'green'
                  : challenge.status === 'FAILED'
                  ? 'red'
                  : 'yellow'
              }
            >
              {challenge.status.replace('_', ' ')}
            </Badge>
          </div>
          <p className="text-text-secondary text-sm mt-1">
            Phase {challenge.currentPhase} • Started {challenge.startDate ? formatDate(challenge.startDate) : 'Pending'}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {challenge.balance != null && (
          <StatCard
            label="Balance"
            value={formatCurrency(challenge.balance)}
            icon={<Wallet className="h-5 w-5" />}
          />
        )}
        {challenge.equity != null && (
          <StatCard
            label="Equity"
            value={formatCurrency(challenge.equity)}
            icon={<Activity className="h-5 w-5" />}
          />
        )}
        <StatCard
          label="Current Profit"
          value={formatCurrency(challenge.currentProfit)}
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <StatCard
          label="Win Rate"
          value={`${challenge.winRate}%`}
          icon={<Award className="h-5 w-5" />}
          change={challenge.totalTrades > 0 ? `${challenge.winCount}W / ${challenge.totalTrades - challenge.winCount}L` : undefined}
          changeType="neutral"
        />
        <StatCard
          label="Days Traded"
          value={String(challenge.daysTraded)}
          icon={<Calendar className="h-5 w-5" />}
        />
        <StatCard
          label="Current Drawdown"
          value={`${challenge.currentDrawdown.toFixed(2)}%`}
          icon={<TrendingDown className="h-5 w-5" />}
        />
        {challenge.openTrades > 0 && (
          <StatCard
            label="Open Trades"
            value={String(challenge.openTrades)}
            icon={<BarChart3 className="h-5 w-5" />}
            change={challenge.openProfit != null ? `${challenge.openProfit >= 0 ? '+' : ''}${formatCurrency(challenge.openProfit)} P/L` : undefined}
            changeType={challenge.openProfit != null ? (challenge.openProfit >= 0 ? 'positive' : 'negative') : 'neutral'}
          />
        )}
      </div>

      {/* Progress Bars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <GlassCard padding="lg">
          <h3 className="text-sm font-semibold text-text-secondary mb-3">Profit Target Progress</h3>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="font-mono">{formatCurrency(challenge.currentProfit)}</span>
            <span className="text-text-tertiary font-mono">{formatCurrency(challenge.targetProfit ?? 0)}</span>
          </div>
          <ProgressBar value={progress} color="green" size="md" glow />
          <p className="text-xs text-text-tertiary mt-2">{progress.toFixed(1)}% complete</p>
        </GlassCard>

        <GlassCard padding="lg">
          <h3 className="text-sm font-semibold text-text-secondary mb-3">Drawdown Used</h3>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="font-mono text-danger">{challenge.currentDrawdown.toFixed(2)}%</span>
            <span className="text-text-tertiary font-mono">Max: {(challenge.maxDrawdown ?? 0).toFixed(1)}%</span>
          </div>
          <ProgressBar value={drawdownUsed} color={drawdownUsed > 75 ? 'red' : drawdownUsed > 50 ? 'gold' : 'green'} size="md" />
          <p className="text-xs text-text-tertiary mt-2">{drawdownUsed.toFixed(1)}% used</p>
        </GlassCard>
      </div>

      {/* Daily Trade Log */}
      <GlassCard padding="lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-heading font-semibold flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-accent-primary" />
            Daily Trade Log
          </h3>
        </div>

        {dailyStats.length === 0 ? (
          <p className="text-text-tertiary text-sm text-center py-8">No trade data yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left py-3 px-2 text-text-tertiary font-medium">Date</th>
                  <th className="text-right py-3 px-2 text-text-tertiary font-medium">Profit</th>
                  <th className="text-right py-3 px-2 text-text-tertiary font-medium">Loss</th>
                  <th className="text-right py-3 px-2 text-text-tertiary font-medium">Net</th>
                  <th className="text-right py-3 px-2 text-text-tertiary font-medium">Trades</th>
                  <th className="text-right py-3 px-2 text-text-tertiary font-medium">W/L</th>
                </tr>
              </thead>
              <tbody>
                {dailyStats.map((stat) => (
                  <motion.tr
                    key={stat.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border-b border-white/[0.03] hover:bg-white/[0.02]"
                  >
                    <td className="py-3 px-2 font-mono text-xs">{formatDate(stat.date)}</td>
                    <td className="py-3 px-2 text-right font-mono text-success">{formatCurrency(stat.profit)}</td>
                    <td className="py-3 px-2 text-right font-mono text-danger">{formatCurrency(stat.loss)}</td>
                    <td className={`py-3 px-2 text-right font-mono font-semibold ${stat.profit - stat.loss >= 0 ? 'text-success' : 'text-danger'}`}>
                      {formatCurrency(stat.profit - stat.loss)}
                    </td>
                    <td className="py-3 px-2 text-right font-mono">{stat.tradesCount}</td>
                    <td className="py-3 px-2 text-right font-mono">
                      <span className="text-success">{stat.winCount}</span>
                      <span className="text-text-tertiary">/</span>
                      <span className="text-danger">{stat.lossCount}</span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
