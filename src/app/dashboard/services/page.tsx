'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Target, Shield, Zap, Check, ArrowRight } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import GlowBorder from '@/components/ui/GlowBorder';
import Tabs from '@/components/ui/Tabs';
import { CHALLENGE_PASSING_PLANS, ACCOUNT_MANAGEMENT_PLANS, ACCOUNT_GROWTH_PLANS } from '@/lib/constants';
import { formatCurrency } from '@/lib/utils';
import type { ServicePlan } from '@/types';

const tierIcons = { starter: Target, professional: Shield, elite: Zap };

const tabItems = [
  { id: 'challenge', label: 'Challenge Passing' },
  { id: 'management', label: 'Account Management' },
  { id: 'growth', label: 'Account Growth' },
];

function PlanCard({ plan }: { plan: ServicePlan }) {
  const TierIcon = tierIcons[plan.tier] ?? Target;
  const content = (
    <GlassCard padding="lg" hover className="h-full flex flex-col">
      {plan.popular && <Badge variant="gold" className="mb-3 self-start">Most Popular</Badge>}
      <TierIcon className="h-8 w-8 text-accent-primary mb-3" />
      <h3 className="text-lg font-heading font-bold">{plan.name}</h3>
      <p className="text-sm text-text-secondary mt-1 flex-1">{plan.description}</p>

      {/* Price */}
      <div className="mt-4 mb-4">
        {plan.price != null ? (
          <>
            {plan.originalPrice && (
              <span className="text-sm text-text-tertiary line-through mr-2">
                {formatCurrency(plan.originalPrice)}
              </span>
            )}
            <span className="text-2xl font-heading font-bold">{formatCurrency(plan.price)}</span>
          </>
        ) : (
          <span className="text-xl font-semibold text-accent-primary">{plan.priceLabel}</span>
        )}
      </div>

      {/* Account size + success */}
      <div className="flex items-center gap-3 mb-4 py-2 border-y border-white/[0.06] text-xs">
        <span className="text-text-tertiary">Account:</span>
        <span className="text-white">{plan.accountSizes.join(', ')}</span>
        {plan.successRate && (
          <span className="ml-auto text-green-400">{plan.successRate}% success</span>
        )}
      </div>

      <ul className="space-y-2 mb-6">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-text-secondary">
            <Check className="h-4 w-4 text-success shrink-0 mt-0.5" />
            {f}
          </li>
        ))}
      </ul>

      <Link href="/dashboard/purchase" className="mt-auto">
        <Button
          variant={plan.popular ? 'primary' : 'secondary'}
          fullWidth
          glow={plan.popular}
          icon={<ArrowRight className="h-4 w-4" />}
          iconPosition="right"
        >
          Get Started
        </Button>
      </Link>
      {plan.guarantee && (
        <p className="text-xs text-accent-gold text-center mt-3">{plan.guarantee}</p>
      )}
    </GlassCard>
  );

  return plan.popular ? (
    <GlowBorder color="gold">{content}</GlowBorder>
  ) : (
    <div>{content}</div>
  );
}

export default function ServicesPage() {
  const [activeTab, setActiveTab] = useState('challenge');

  const plans =
    activeTab === 'management'
      ? ACCOUNT_MANAGEMENT_PLANS
      : activeTab === 'growth'
      ? ACCOUNT_GROWTH_PLANS
      : CHALLENGE_PASSING_PLANS;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">Our Services</h1>
        <p className="text-text-secondary mt-1">Choose the perfect plan for your trading goals.</p>
      </div>

      <Tabs tabs={tabItems} activeTab={activeTab} onChange={setActiveTab} variant="pills" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((plan) => (
          <PlanCard key={plan.id} plan={plan} />
        ))}
      </div>

      <p className="text-center text-sm text-text-tertiary pt-2">
        Need a custom plan?{' '}
        <Link href="/dashboard/support" className="text-accent-primary hover:underline">
          Contact support
        </Link>{' '}
        for tailored pricing.
      </p>
    </div>
  );
}
