'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, ArrowRight, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CHALLENGE_PASSING_PLANS, ACCOUNT_MANAGEMENT_PLANS } from '@/lib/constants';
import { ServiceType, type ServicePlan } from '@/types';

const TABS = [
  { id: 'all', label: 'All Services' },
  { id: ServiceType.CHALLENGE_PASSING, label: 'Challenge Passing' },
  { id: ServiceType.ACCOUNT_MANAGEMENT, label: 'Account Management' },
  { id: ServiceType.ACCOUNT_GROWTH, label: 'Account Growth' },
] as const;

const GROWTH_PLAN: ServicePlan = {
  id: 'growth',
  name: 'Account Growth Plan',
  tier: 'elite',
  serviceType: ServiceType.ACCOUNT_GROWTH,
  price: 0,
  description: 'Systematic account growth strategy to compound your funded capital over time.',
  features: [
    'Structured scaling plan',
    'Compounding strategy',
    'Senior trader dedicated',
    'Custom risk profiles',
    'Weekly performance reports',
    'VIP 24/7 support',
  ],
  accountSizes: ['Any size'],
  successRate: 96,
};

const ALL_PLANS = [...CHALLENGE_PASSING_PLANS, ...ACCOUNT_MANAGEMENT_PLANS, GROWTH_PLAN];

function categoryLabel(type: ServiceType) {
  if (type === ServiceType.CHALLENGE_PASSING) return 'Challenge Passing';
  if (type === ServiceType.ACCOUNT_MANAGEMENT) return 'Account Management';
  return 'Growth';
}

function PlanCard({ plan }: { plan: ServicePlan }) {
  const isFeatured = !!plan.popular;

  return (
    <div
      className={`relative flex flex-col rounded-xl border p-6 transition-all duration-300 group
        ${isFeatured
          ? 'border-accent-primary/50 bg-accent-primary/5 shadow-[0_0_40px_-8px_rgba(230,57,70,0.25)]'
          : 'border-white/[0.08] bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]'
        }`}
    >
      {/* Most Popular badge */}
      {isFeatured && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1 bg-accent-primary text-white text-[10px] font-bold px-3 py-1 rounded-full tracking-widest uppercase">
            ★ Most Popular
          </span>
        </div>
      )}

      {/* Category label */}
      <p className="text-[10px] font-bold tracking-widest uppercase text-accent-primary mb-3">
        {categoryLabel(plan.serviceType)}
      </p>

      {/* Name & description */}
      <h3 className="text-base font-bold text-white mb-1">{plan.name}</h3>
      <p className="text-xs text-white/50 mb-4 leading-relaxed">{plan.description}</p>

      {/* Account size + success rate */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/[0.06]">
        <div>
          <p className="text-[10px] text-white/40 uppercase tracking-wider mb-0.5">Account Size</p>
          <p className="text-sm font-bold text-white">{plan.accountSizes.join(' / ')}</p>
        </div>
        {plan.successRate && (
          <div className="text-right">
            <p className="text-[10px] text-white/40 uppercase tracking-wider mb-0.5">Success Rate</p>
            <p className="text-sm font-bold text-accent-primary">{plan.successRate}%</p>
          </div>
        )}
      </div>

      {/* Features */}
      <ul className="space-y-2 mb-6 flex-1">
        {plan.features.map((f) => (
          <li key={f} className="flex items-center gap-2 text-xs text-white/60">
            <Check className="h-3.5 w-3.5 text-accent-primary shrink-0" />
            {f}
          </li>
        ))}
      </ul>

      {/* Price + delivery */}
      <div className="flex items-end justify-between mb-5">
        <div>
          {plan.originalPrice && (
            <p className="text-xs text-white/30 line-through">${plan.originalPrice}</p>
          )}
          <p className="text-2xl font-bold font-mono text-white">
            {plan.price === 0 ? 'Custom' : `$${plan.price}`}
          </p>
        </div>
        {plan.deliveryDays && (
          <span className="inline-flex items-center gap-1 text-xs text-white/40">
            <Clock className="h-3 w-3" /> {plan.deliveryDays} days
          </span>
        )}
      </div>

      {/* CTA */}
      <Link
        href={plan.price === 0 ? '/contact' : '/dashboard/purchase'}
        className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-sm font-semibold transition-all duration-200
          ${isFeatured
            ? 'bg-accent-primary hover:bg-accent-hover text-white shadow-glow hover:shadow-glow-lg'
            : 'border border-white/15 hover:border-accent-primary/50 text-white/80 hover:text-white hover:bg-white/[0.04]'
          }`}
      >
        {plan.price === 0 ? 'Contact Us' : 'Get Started'} <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

export default function ServicesOverview() {
  const [activeTab, setActiveTab] = useState<string>('all');

  const filtered = activeTab === 'all'
    ? ALL_PLANS
    : ALL_PLANS.filter((p) => p.serviceType === activeTab);

  return (
    <section id="services" className="py-24 bg-black">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">

        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-xs font-bold tracking-widest uppercase text-accent-primary mb-3">Our Services</p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-heading font-extrabold text-white mb-4">
            Choose Your Path <span className="text-accent-primary">to Funding</span>
          </h2>
          <p className="text-white/50 max-w-lg mx-auto text-sm leading-relaxed">
            Professional prop firm services backed by a 97% success rate and a results guarantee.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all duration-200
                ${activeTab === tab.id
                  ? 'bg-accent-primary text-white shadow-glow-sm'
                  : 'border border-white/10 text-white/50 hover:border-white/25 hover:text-white/80'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Cards grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {filtered.map((plan) => (
              <PlanCard key={plan.id} plan={plan} />
            ))}
          </motion.div>
        </AnimatePresence>

      </div>
    </section>
  );
}
