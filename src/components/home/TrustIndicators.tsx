'use client';

import { Trophy, DollarSign, TrendingUp, Users, Target, Shield, Star, type LucideIcon } from 'lucide-react';
import AnimatedCounter from '@/components/ui/AnimatedCounter';
import GlassCard from '@/components/ui/GlassCard';
import ScrollReveal from '@/components/effects/ScrollReveal';

const ICON_MAP: Record<string, LucideIcon> = {
  Trophy, DollarSign, TrendingUp, Users, Target, Shield, Star,
};

interface StatItem {
  id: string;
  label: string;
  value: number;
  suffix?: string | null;
  prefix?: string | null;
  icon: string;
  sortOrder: number;
}

const DEFAULT_STATS: StatItem[] = [
  { id: '1', label: 'Challenges Passed', value: 2500, suffix: '+', icon: 'Trophy', sortOrder: 1 },
  { id: '2', label: 'Total Payouts', value: 12, suffix: 'M+', prefix: '$', icon: 'DollarSign', sortOrder: 2 },
  { id: '3', label: 'Success Rate', value: 94, suffix: '%', icon: 'TrendingUp', sortOrder: 3 },
  { id: '4', label: 'Active Clients', value: 500, suffix: '+', icon: 'Users', sortOrder: 4 },
];

export default function TrustIndicators({ stats }: { stats?: StatItem[] }) {
  const data = stats && stats.length > 0 ? stats : DEFAULT_STATS;
  return (
    <section className="relative z-10 section-container section-padding py-8">
      <ScrollReveal>
        <GlassCard variant="strong" padding="none" className="overflow-hidden">
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-white/[0.06]">
            {data.map((stat) => {
              const Icon = ICON_MAP[stat.icon] ?? Trophy;
              return (
              <div
                key={stat.label}
                className="flex flex-col items-center py-8 px-4 text-center"
              >
                <Icon className="h-6 w-6 text-accent-primary mb-3" />
                <span className="text-2xl md:text-3xl font-bold text-text-primary">
                  <AnimatedCounter
                    value={stat.value}
                    prefix={stat.prefix ?? undefined}
                    suffix={stat.suffix ?? undefined}
                  />
                </span>
                <span className="text-xs text-text-tertiary mt-1 uppercase tracking-wider">
                  {stat.label}
                </span>
              </div>
              );
            })}
          </div>
        </GlassCard>
      </ScrollReveal>
    </section>
  );
}
