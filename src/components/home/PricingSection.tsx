'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CircleCheck, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ScrollReveal from '@/components/effects/ScrollReveal';
import SectionBadge from '@/components/ui/SectionBadge';

export const PLANS = [
  {
    id: 1,
    category: 'Challenge Passing',
    name: 'Starter Challenge Pass',
    description: 'Perfect entry point — pass your first prop firm challenge hassle-free.',
    accountSize: '$10K',
    successRate: 97,
    features: ['Phase 1 + Phase 2', 'FTMO / Apex / E8 supported', '14-day delivery', 'Refund guarantee'],
    price: 149,
    originalPrice: 199,
    delivery: '14 days',
    popular: false,
  },
  {
    id: 2,
    category: 'Challenge Passing',
    name: 'Pro Challenge Pass',
    description: 'Our most popular package. Trusted by 500+ clients.',
    accountSize: '$50K',
    successRate: 97,
    features: ['Phase 1 + Phase 2', 'All major firms', 'Priority handling', 'Refund guarantee', 'Dedicated trader'],
    price: 349,
    originalPrice: 499,
    delivery: '14 days',
    popular: true,
  },
  {
    id: 3,
    category: 'Challenge Passing',
    name: 'Elite Challenge Pass',
    description: 'Large account specialist package for serious traders.',
    accountSize: '$100K–$200K',
    successRate: 95,
    features: ['Phase 1 + Phase 2', 'All major firms', 'VIP support', 'Refund guarantee', 'Progress updates', 'Senior trader'],
    price: 699,
    originalPrice: 999,
    delivery: '21 days',
    popular: false,
  },
  {
    id: 4,
    category: 'Account Management',
    name: 'Managed Account – Starter',
    description: 'Let our experts grow your funded account. Pay only from profits.',
    accountSize: 'Up to $50K',
    successRate: 92,
    features: ['20% profit split', 'Weekly reporting', 'Low risk strategy', 'Full transparency'],
    priceLabel: 'Profit Split Only',
    delivery: '30 days',
    popular: false,
  },
  {
    id: 5,
    category: 'Account Management',
    name: 'Managed Account – Pro',
    description: 'Our premium management service for larger funded accounts.',
    accountSize: '$50K–$200K',
    successRate: 94,
    features: ['15% profit split', 'Daily reporting', 'Dedicated manager', 'Risk dashboard', 'Monthly review call'],
    priceLabel: 'Profit Split Only',
    delivery: '30 days',
    popular: true,
  },
  {
    id: 6,
    category: 'Account Growth',
    name: 'Account Growth Plan',
    description: 'Systematic account growth to maximize your capital over time.',
    accountSize: 'Any size',
    successRate: 96,
    features: ['Structured scaling', 'Compounding strategy', 'Monthly targets', 'Full reporting', 'No drawdown risk'],
    price: 249,
    originalPrice: 349,
    delivery: '30 days',
    popular: false,
  },
];

const TABS = ['All Services', 'Challenge Passing', 'Account Management', 'Account Growth'];

function PlanCard({ plan }: { plan: typeof PLANS[0] }) {
  const isPopular = plan.popular;

  return (
    <div className={`rounded-xl border p-7 flex flex-col relative transition-all duration-300 group
      ${isPopular
        ? 'border-[rgba(230,57,70,0.50)] bg-[#120404] shadow-[0_0_30px_rgba(230,57,70,0.10)] hover:border-[rgba(230,57,70,0.70)] hover:shadow-[0_0_40px_rgba(230,57,70,0.15)]'
        : 'border-[rgba(230,57,70,0.25)] bg-[#0d0303] hover:border-[rgba(230,57,70,0.45)] hover:shadow-[0_0_30px_rgba(230,57,70,0.08)]'
      } glass-shine hover:scale-[1.01]`}
    >
      {/* Most Popular badge */}
      {isPopular && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <span
            className="text-white text-xs font-semibold px-4 py-1 rounded-full"
            style={{ background: 'linear-gradient(135deg, #e63946 0%, #c1121f 100%)', boxShadow: '0 0 14px rgba(230,57,70,0.5)' }}
          >
            ★ MOST POPULAR
          </span>
        </div>
      )}

      {/* Category + Title */}
      <div className="mb-4">
        <span className="text-xs text-accent-primary font-semibold tracking-widest uppercase">{plan.category}</span>
        <h3 className="font-heading text-2xl text-white mt-1">{plan.name}</h3>
        <p className="text-text-tertiary text-sm mt-2">{plan.description}</p>
      </div>

      {/* Account size + success rate */}
      <div className="flex items-center gap-3 mb-5 py-3 border-y border-white/[0.06]">
        <span className="text-text-tertiary text-xs">Account Size:</span>
        <span className="text-white text-sm font-medium">{plan.accountSize}</span>
        <span className="ml-auto text-xs text-success">{plan.successRate}% success</span>
      </div>

      {/* Features */}
      <ul className="space-y-2.5 mb-6 flex-1">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-text-secondary">
            <CircleCheck className="h-[14px] w-[14px] text-accent-primary mt-0.5 shrink-0" />
            {f}
          </li>
        ))}
      </ul>

      {/* Price */}
      <div className="flex items-center justify-between mb-5">
        <div>
          {'price' in plan && plan.price ? (
            <>
              <span className="font-heading text-3xl font-bold text-white">${plan.price}</span>
              {plan.originalPrice && (
                <span className="text-text-tertiary line-through text-sm ml-2">${plan.originalPrice}</span>
              )}
            </>
          ) : (
            <span className="font-semibold text-xl text-accent-primary">{(plan as any).priceLabel}</span>
          )}
        </div>
        <span className="text-xs text-text-tertiary">{plan.delivery}</span>
      </div>

      {/* CTA */}
      <Link href="/dashboard/purchase">
        {isPopular ? (
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 w-full px-6 py-3 text-base font-semibold rounded-lg text-white transition-all duration-300 hover:scale-105 cursor-pointer"
            style={{
              background: 'linear-gradient(135deg, #e63946 0%, #c1121f 100%)',
              boxShadow: '0 0 20px rgba(230,57,70,0.4)',
            }}
          >
            Get Started <ArrowRight className="h-[15px] w-[15px]" />
          </button>
        ) : (
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 w-full px-6 py-3 text-base font-semibold rounded-lg bg-transparent border border-[rgba(230,57,70,0.50)] text-accent-primary transition-all duration-300 hover:bg-[rgba(230,57,70,0.10)] hover:border-[rgba(230,57,70,0.80)] hover:text-red-300 hover:shadow-[0_0_20px_rgba(230,57,70,0.2)] cursor-pointer"
          >
            Get Started <ArrowRight className="h-[15px] w-[15px]" />
          </button>
        )}
      </Link>
    </div>
  );
}

export default function PricingSection() {
  const [activeTab, setActiveTab] = useState('All Services');

  const filtered = activeTab === 'All Services'
    ? PLANS
    : PLANS.filter((p) => p.category === activeTab);

  return (
    <section id="pricing" className="py-24 px-4 sm:px-6 max-w-7xl mx-auto">
      {/* Header */}
      <ScrollReveal>
        <div className="mb-12 text-center">
          <SectionBadge>Pricing</SectionBadge>
          <h2 className="font-heading font-normal text-4xl md:text-5xl lg:text-6xl text-white leading-tight">
            Choose Your <span className="text-gradient-red">Path to Funding</span>
          </h2>
          <p className="mt-4 text-text-secondary text-lg max-w-2xl mx-auto leading-relaxed">
            Professional prop firm services backed by a 97% success rate and a results guarantee.
          </p>
        </div>
      </ScrollReveal>

      {/* Filter tabs */}
      <ScrollReveal>
        <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 border
                ${activeTab === tab
                  ? 'text-white border-transparent'
                  : 'bg-transparent text-text-tertiary border-[rgba(230,57,70,0.25)] hover:border-[rgba(230,57,70,0.50)] hover:text-white'
                }`}
              style={activeTab === tab ? {
                background: 'linear-gradient(135deg, #e63946 0%, #c1121f 100%)',
                boxShadow: '0 0 14px rgba(230,57,70,0.4)',
              } : {}}
            >
              {tab}
            </button>
          ))}
        </div>
      </ScrollReveal>

      {/* Cards */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filtered.map((plan) => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
        </motion.div>
      </AnimatePresence>

      {/* Custom note */}
      <p className="text-center text-sm text-text-tertiary mt-10">
        Need a custom plan?{' '}
        <Link href="/contact" className="text-accent-primary hover:underline">
          Contact us
        </Link>{' '}
        for tailored pricing.
      </p>
    </section>
  );
}
