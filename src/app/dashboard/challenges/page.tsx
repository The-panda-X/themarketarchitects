'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Target,
  Clock,
  CheckCircle,
  AlertCircle,
  Activity,
  DollarSign,
  Eye,
  TrendingUp,
} from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import ProgressBar from '@/components/ui/ProgressBar';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Challenge } from '@/types';

const statusConfig: Record<string, { color: 'green' | 'yellow' | 'blue' | 'red' | 'purple'; icon: typeof Target; label: string }> = {
  PENDING: { color: 'purple', icon: Clock, label: 'Pending' },
  IN_PROGRESS: { color: 'blue', icon: Activity, label: 'In Progress' },
  PHASE_1: { color: 'yellow', icon: Target, label: 'Phase 1' },
  PHASE_2: { color: 'yellow', icon: Target, label: 'Phase 2' },
  PASSED: { color: 'green', icon: CheckCircle, label: 'Passed' },
  FAILED: { color: 'red', icon: AlertCircle, label: 'Failed' },
  FUNDED: { color: 'green', icon: DollarSign, label: 'Funded' },
};

export default function ChallengesPage() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchChallenges() {
      try {
        const res = await fetch('/api/dashboard/challenges');
        if (res.ok) {
          const data = await res.json();
          setChallenges(data.data ?? []);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    fetchChallenges();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">My Challenges</h1>
          <p className="text-text-secondary mt-1">Track your prop firm challenge progress.</p>
        </div>
        <Link href="/dashboard/purchase">
          <Button variant="primary" size="sm">New Challenge</Button>
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-48 w-full rounded-2xl" />
          ))}
        </div>
      ) : challenges.length === 0 ? (
        <GlassCard padding="lg">
          <div className="text-center py-16">
            <Target className="h-16 w-16 text-text-tertiary mx-auto mb-4" />
            <h3 className="text-lg font-heading font-semibold">No Challenges Yet</h3>
            <p className="text-text-secondary mt-2 max-w-md mx-auto">
              Purchase a challenge passing plan to get started. Our expert traders will handle the rest.
            </p>
            <Link href="/dashboard/purchase" className="mt-6 inline-block">
              <Button variant="primary" glow>Start a Challenge</Button>
            </Link>
          </div>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {challenges.map((challenge) => {
            const config = statusConfig[challenge.status] ?? statusConfig.PENDING;
            const StatusIcon = config.icon;
            const progress = challenge.targetProfit
              ? Math.min(100, (challenge.currentProfit / challenge.targetProfit) * 100)
              : 0;

            return (
              <motion.div key={challenge.id} whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
                <GlassCard hover padding="lg">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-accent-primary/10">
                        <StatusIcon className="h-5 w-5 text-accent-primary" />
                      </div>
                      <div>
                        <h3 className="font-heading font-semibold">{challenge.firmName}</h3>
                        <p className="text-sm text-text-tertiary">{challenge.accountSize}</p>
                      </div>
                    </div>
                    <Badge variant={config.color}>{config.label}</Badge>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-text-secondary">Profit Target</span>
                        <span className="font-mono text-text-primary">
                          {formatCurrency(challenge.currentProfit)} / {formatCurrency(challenge.targetProfit ?? 0)}
                        </span>
                      </div>
                      <ProgressBar value={progress} color="red" size="sm" />
                    </div>

                    <div className="grid grid-cols-3 gap-3 pt-2 border-t border-white/[0.04]">
                      <div className="text-center">
                        <p className="text-xs text-text-tertiary">Days</p>
                        <p className="text-sm font-mono font-semibold">{challenge.daysTraded}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-text-tertiary">Win Rate</p>
                        <p className="text-sm font-mono font-semibold">{challenge.winRate}%</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-text-tertiary">Drawdown</p>
                        <p className="text-sm font-mono font-semibold text-danger">
                          {formatCurrency(challenge.currentDrawdown)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-white/[0.04]">
                      <p className="text-xs text-text-tertiary">
                        Started {challenge.startDate ? formatDate(challenge.startDate) : 'Pending'}
                      </p>
                      <Link href={`/dashboard/challenges/${challenge.id}`}>
                        <Button variant="ghost" size="sm" icon={<Eye className="h-3.5 w-3.5" />}>
                          Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
