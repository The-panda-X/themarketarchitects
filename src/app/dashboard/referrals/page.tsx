'use client';

import { Users, Clock } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';

export default function ReferralsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">Referral Program</h1>
        <p className="text-text-secondary mt-1">Earn commissions by referring friends.</p>
      </div>

      <GlassCard padding="lg">
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-accent-primary/10 border border-accent-primary/20 mb-6">
            <Users className="h-10 w-10 text-accent-primary" />
          </div>
          <h2 className="text-xl font-heading font-bold mb-2">Coming Soon</h2>
          <p className="text-text-secondary max-w-md mx-auto mb-6">
            Our referral program is under development. Soon you&apos;ll be able to earn
            commissions by sharing your unique referral link with friends.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent-gold/10 border border-accent-gold/20 text-accent-gold text-sm font-medium">
            <Clock className="h-4 w-4" />
            Launching Soon
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
