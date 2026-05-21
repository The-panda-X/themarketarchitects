'use client';

import { useEffect, useState } from 'react';
import { Users, Copy, Check, DollarSign, UserPlus, Gift } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import StatCard from '@/components/ui/StatCard';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import useToast from '@/hooks/useToast';
import { formatCurrency, formatDate } from '@/lib/utils';
import useAuth from '@/hooks/useAuth';
import type { Referral } from '@/types';

export default function ReferralsPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const referralLink = typeof window !== 'undefined'
    ? `${window.location.origin}/register?ref=${(user as unknown as { referralCode?: string })?.referralCode ?? ''}`
    : '';

  useEffect(() => {
    async function fetchReferrals() {
      try {
        const res = await fetch('/api/dashboard/referrals');
        if (res.ok) {
          const data = await res.json();
          setReferrals(data.data ?? []);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    fetchReferrals();
  }, []);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      addToast('Referral link copied!', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      addToast('Failed to copy.', 'error');
    }
  };

  const totalEarnings = referrals.reduce((sum, r) => sum + r.commission, 0);
  const paidEarnings = referrals.filter((r) => r.paid).reduce((sum, r) => sum + r.commission, 0);
  const pendingEarnings = totalEarnings - paidEarnings;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">Referral Program</h1>
        <p className="text-text-secondary mt-1">Earn commissions by referring friends.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Total Referrals"
          value={String(referrals.length)}
          icon={<UserPlus className="h-5 w-5" />}
        />
        <StatCard
          label="Total Earnings"
          value={formatCurrency(totalEarnings)}
          icon={<DollarSign className="h-5 w-5" />}
        />
        <StatCard
          label="Pending Payout"
          value={formatCurrency(pendingEarnings)}
          icon={<Gift className="h-5 w-5" />}
        />
      </div>

      {/* Referral Link */}
      <GlassCard padding="lg">
        <h3 className="text-lg font-heading font-semibold mb-3">Your Referral Link</h3>
        <p className="text-sm text-text-secondary mb-4">
          Share this link with friends. When they purchase a plan, you earn a commission.
        </p>
        <div className="flex gap-2">
          <div className="flex-1 bg-white/[0.03] border border-white/[0.06] rounded-lg px-4 py-2.5 font-mono text-sm text-text-secondary truncate">
            {referralLink || 'Loading...'}
          </div>
          <Button
            variant={copied ? 'secondary' : 'primary'}
            size="sm"
            icon={copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            onClick={copyLink}
          >
            {copied ? 'Copied' : 'Copy'}
          </Button>
        </div>
      </GlassCard>

      {/* Referral History */}
      <GlassCard padding="lg">
        <h3 className="text-lg font-heading font-semibold mb-4">Referral History</h3>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 rounded-lg" />)}
          </div>
        ) : referrals.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-text-tertiary mx-auto mb-3" />
            <p className="text-text-secondary">No referrals yet. Share your link to get started!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {referrals.map((referral) => (
              <div
                key={referral.id}
                className="flex items-center gap-4 p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]"
              >
                <div className="p-2 rounded-lg bg-accent-primary/10">
                  <UserPlus className="h-4 w-4 text-accent-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{referral.referredEmail}</p>
                  <p className="text-xs text-text-tertiary">{formatDate(referral.createdAt)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-mono font-semibold">{formatCurrency(referral.commission)}</p>
                  <Badge variant={referral.paid ? 'green' : 'yellow'} size="sm">
                    {referral.paid ? 'Paid' : 'Pending'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}
