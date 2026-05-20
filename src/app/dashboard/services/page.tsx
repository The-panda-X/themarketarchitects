'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Target, Shield, Crown, Check, ArrowRight } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import GlowBorder from '@/components/ui/GlowBorder';
import Tabs from '@/components/ui/Tabs';
import { CHALLENGE_PASSING_PLANS, ACCOUNT_MANAGEMENT_PLANS } from '@/lib/constants';
import { formatCurrency } from '@/lib/utils';

const tierIcons = { starter: Target, professional: Shield, elite: Crown };

const tabItems = [
  { id: 'challenge', label: 'Challenge Passing' },
  { id: 'management', label: 'Account Management' },
];

export default function ServicesPage() {
  const [activeTab, setActiveTab] = useState('challenge');
  const plans = activeTab === 'management' ? ACCOUNT_MANAGEMENT_PLANS : CHALLENGE_PASSING_PLANS;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">Our Services</h1>
        <p className="text-text-secondary mt-1">Choose the perfect plan for your trading goals.</p>
      </div>

      <Tabs tabs={tabItems} activeTab={activeTab} onChange={setActiveTab} variant="pills" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((plan) => {
          const TierIcon = tierIcons[plan.tier] ?? Target;
          const content = (
            <GlassCard padding="lg" hover className="h-full flex flex-col">
              {plan.popular && <Badge variant="gold" className="mb-3 self-start">Most Popular</Badge>}
              <TierIcon className="h-8 w-8 text-accent-primary mb-3" />
              <h3 className="text-lg font-heading font-bold">{plan.name}</h3>
              <p className="text-sm text-text-secondary mt-1 flex-1">{plan.description}</p>
              <div className="mt-4 mb-4">
                {plan.originalPrice && (
                  <span className="text-sm text-text-tertiary line-through mr-2">{formatCurrency(plan.originalPrice)}</span>
                )}
                <span className="text-2xl font-heading font-bold">{formatCurrency(plan.price)}</span>
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
                <Button variant={plan.popular ? 'primary' : 'secondary'} fullWidth glow={plan.popular} icon={<ArrowRight className="h-4 w-4" />} iconPosition="right">
                  Get Started
                </Button>
              </Link>
              {plan.guarantee && (
                <p className="text-xs text-accent-gold text-center mt-3">{plan.guarantee}</p>
              )}
            </GlassCard>
          );

          return plan.popular ? (
            <GlowBorder key={plan.id} color="gold">{content}</GlowBorder>
          ) : (
            <div key={plan.id}>{content}</div>
          );
        })}
      </div>
    </div>
  );
}
