'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CircleCheck, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ScrollReveal from '@/components/effects/ScrollReveal';
import SectionBadge from '@/components/ui/SectionBadge';

interface PlanData {
  id: string;
  name: string;
  serviceType: string;
  description: string;
  accountSizes: string[];
  successRate: number | null;
  features: string[];
  price: number | null;
  originalPrice: number | null;
  priceLabel: string | null;
  deliveryDays: number | null;
  popular: boolean;
}

function serviceLabel(type: string) {
  if (type === 'CHALLENGE_PASSING') return 'Challenge Passing';
  if (type === 'ACCOUNT_MANAGEMENT') return 'Account Management';
  if (type === 'ACCOUNT_GROWTH') return 'Account Growth';
  return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function PlanCard({ plan }: { plan: PlanData }) {
  const isPopular = plan.popular;

  return (
    /* Outer wrapper — relative + pt so badge floats above without being clipped */
    <div className="relative pt-5 h-full">

      {/* Most Popular badge — on the WRAPPER, never inside overflow:hidden card */}
      {isPopular && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10 whitespace-nowrap">
          <span
            className="text-white text-xs font-semibold px-4 py-1.5 rounded-full"
            style={{ background: 'linear-gradient(135deg, #e63946 0%, #c1121f 100%)', boxShadow: '0 0 14px rgba(230,57,70,0.5)' }}
          >
            ★ MOST POPULAR
          </span>
        </div>
      )}

    <div className={`rounded-xl border p-7 flex flex-col transition-all duration-300 group h-full
      ${isPopular
        ? 'border-[rgba(230,57,70,0.50)] bg-[#120404] shadow-[0_0_30px_rgba(230,57,70,0.10)] hover:border-[rgba(230,57,70,0.70)] hover:shadow-[0_0_40px_rgba(230,57,70,0.15)]'
        : 'border-[rgba(230,57,70,0.25)] bg-[#0d0303] hover:border-[rgba(230,57,70,0.45)] hover:shadow-[0_0_30px_rgba(230,57,70,0.08)]'
      } glass-shine hover:scale-[1.01]`}
    >

      {/* Category + Title */}
      <div className="mb-4">
        <span className="text-xs text-accent-primary font-semibold tracking-widest uppercase">{serviceLabel(plan.serviceType)}</span>
        <h3 className="font-heading font-semibold text-2xl text-white mt-1">{plan.name}</h3>
        <p className="text-text-tertiary text-sm mt-2">{plan.description}</p>
      </div>

      {/* Account size + success rate */}
      <div className="flex items-center gap-3 mb-5 py-3 border-y border-white/[0.06]">
        <span className="text-text-tertiary text-xs">Account Size:</span>
        <span className="text-white text-sm font-medium">{plan.accountSizes.join(' / ')}</span>
        {plan.successRate && <span className="ml-auto text-xs text-success">{plan.successRate}% success</span>}
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
          {plan.price ? (
            <>
              <span className="font-heading text-3xl font-bold text-white">${plan.price}</span>
              {plan.originalPrice && (
                <span className="text-text-tertiary line-through text-sm ml-2">${plan.originalPrice}</span>
              )}
            </>
          ) : (
            <span className="font-semibold text-xl text-accent-primary">{plan.priceLabel ?? 'Contact Us'}</span>
          )}
        </div>
        {plan.deliveryDays && <span className="text-xs text-text-tertiary">{plan.deliveryDays} days</span>}
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
    </div>
  );
}

export default function PricingSection({ plans = [] }: { plans?: PlanData[] }) {
  const [activeTab, setActiveTab] = useState('All Services');

  // Derive tabs from actual plan data
  const uniqueTypes = [...new Set(plans.map((p) => p.serviceType))];
  const TABS = ['All Services', ...uniqueTypes.map(serviceLabel)];

  const filtered = activeTab === 'All Services'
    ? plans
    : plans.filter((p) => serviceLabel(p.serviceType) === activeTab);

  return (
    <section id="pricing" className="py-20 px-4 sm:px-6 max-w-6xl mx-auto">
      {/* Header */}
      <ScrollReveal>
        <div className="mb-12 text-center">
          <SectionBadge>Pricing</SectionBadge>
          <h2 className="font-heading font-bold text-4xl md:text-5xl lg:text-6xl text-white leading-tight">
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
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 items-start"
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
