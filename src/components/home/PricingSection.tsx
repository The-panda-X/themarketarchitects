'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, Zap } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import GlowBorder from '@/components/ui/GlowBorder';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Tabs from '@/components/ui/Tabs';
import ScrollReveal from '@/components/effects/ScrollReveal';
import { StaggerContainer, StaggerItem } from '@/components/effects/ScrollReveal';
import { CHALLENGE_PASSING_PLANS, ACCOUNT_MANAGEMENT_PLANS } from '@/lib/constants';
import { cn } from '@/lib/utils';

export default function PricingSection() {
  const [tab, setTab] = useState('challenge');

  const plans =
    tab === 'challenge' ? CHALLENGE_PASSING_PLANS : ACCOUNT_MANAGEMENT_PLANS;

  return (
    <section id="pricing" className="py-20 md:py-28">
      <div className="section-container section-padding">
        {/* Header */}
        <ScrollReveal>
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
              Simple, Transparent Pricing
            </h2>
            <div className="w-16 h-1 bg-accent-primary rounded-full mx-auto mb-4" />
            <p className="text-text-secondary max-w-xl mx-auto mb-8">
              Choose the plan that fits your goals. No hidden fees.
            </p>

            {/* Toggle */}
            <div className="flex justify-center">
              <Tabs
                variant="pills"
                tabs={[
                  { id: 'challenge', label: 'Challenge Passing' },
                  { id: 'management', label: 'Account Management' },
                ]}
                activeTab={tab}
                onChange={setTab}
              />
            </div>
          </div>
        </ScrollReveal>

        {/* Plans */}
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan) => {
            const isPopular = plan.popular;
            const CardWrapper = isPopular ? GlowBorder : 'div' as React.ElementType;
            const wrapperProps = isPopular
              ? { color: 'gold' as const, innerClassName: 'h-full' }
              : { className: 'h-full' };

            return (
              <StaggerItem key={plan.id}>
                <CardWrapper {...wrapperProps}>
                  <GlassCard
                    variant={isPopular ? 'strong' : 'default'}
                    padding="none"
                    className={cn('h-full flex flex-col', isPopular && 'border-0')}
                  >
                    {/* Popular badge */}
                    {isPopular && (
                      <div className="px-6 pt-5">
                        <Badge variant="gold" size="md">
                          <Zap className="h-3 w-3" /> MOST POPULAR
                        </Badge>
                      </div>
                    )}

                    <div className="p-6 flex-1 flex flex-col">
                      {/* Plan name */}
                      <h3 className="text-lg font-semibold mb-1">{plan.name}</h3>
                      <p className="text-sm text-text-tertiary mb-5">
                        {plan.description}
                      </p>

                      {/* Price */}
                      <div className="flex items-baseline gap-2 mb-6">
                        <span className="text-4xl font-bold font-mono">
                          ${plan.price}
                        </span>
                        {plan.originalPrice && (
                          <span className="text-lg text-text-tertiary line-through font-mono">
                            ${plan.originalPrice}
                          </span>
                        )}
                      </div>

                      {/* Features */}
                      <ul className="space-y-3 mb-8 flex-1">
                        {plan.features.map((feature) => (
                          <li
                            key={feature}
                            className="flex items-start gap-2.5 text-sm text-text-secondary"
                          >
                            <Check className="h-4 w-4 text-accent-primary shrink-0 mt-0.5" />
                            {feature}
                          </li>
                        ))}
                      </ul>

                      {/* Guarantee */}
                      {plan.guarantee && (
                        <p className="text-xs text-success font-medium mb-4 flex items-center gap-1.5">
                          <Check className="h-3.5 w-3.5" />
                          {plan.guarantee}
                        </p>
                      )}

                      {/* CTA */}
                      <Link href="/dashboard/purchase" className="block">
                        <Button
                          variant={isPopular ? 'primary' : 'secondary'}
                          fullWidth
                          glow={isPopular}
                          size="lg"
                        >
                          Get Started
                        </Button>
                      </Link>
                    </div>
                  </GlassCard>
                </CardWrapper>
              </StaggerItem>
            );
          })}
        </StaggerContainer>

        {/* Custom note */}
        <ScrollReveal delay={0.3}>
          <p className="text-center text-sm text-text-tertiary mt-8">
            Need a custom plan?{' '}
            <Link href="/contact" className="text-accent-primary hover:underline">
              Contact us
            </Link>{' '}
            for tailored pricing.
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}
