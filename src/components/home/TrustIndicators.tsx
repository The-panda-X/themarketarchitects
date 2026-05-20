'use client';

import { Trophy, DollarSign, TrendingUp, Users } from 'lucide-react';
import AnimatedCounter from '@/components/ui/AnimatedCounter';
import GlassCard from '@/components/ui/GlassCard';
import ScrollReveal from '@/components/effects/ScrollReveal';

const stats = [
  {
    label: 'Challenges Passed',
    value: 2500,
    suffix: '+',
    icon: Trophy,
  },
  {
    label: 'Total Payouts',
    value: 12,
    suffix: 'M+',
    prefix: '$',
    icon: DollarSign,
  },
  {
    label: 'Success Rate',
    value: 94,
    suffix: '%',
    icon: TrendingUp,
  },
  {
    label: 'Active Clients',
    value: 500,
    suffix: '+',
    icon: Users,
  },
];

export default function TrustIndicators() {
  return (
    <section className="relative z-10 section-container section-padding py-8">
      <ScrollReveal>
        <GlassCard variant="strong" padding="none" className="overflow-hidden">
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-white/[0.06]">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="flex flex-col items-center py-8 px-4 text-center"
              >
                <stat.icon className="h-6 w-6 text-accent-primary mb-3" />
                <span className="text-2xl md:text-3xl font-bold text-text-primary">
                  <AnimatedCounter
                    value={stat.value}
                    prefix={stat.prefix}
                    suffix={stat.suffix}
                  />
                </span>
                <span className="text-xs text-text-tertiary mt-1 uppercase tracking-wider">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </GlassCard>
      </ScrollReveal>
    </section>
  );
}
