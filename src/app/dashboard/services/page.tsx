'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CircleCheck, Clock, ArrowRight, Loader2 } from 'lucide-react';
import GlowBorder from '@/components/ui/GlowBorder';
import Tabs from '@/components/ui/Tabs';

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
  guarantee: string | null;
}

function serviceLabel(type: string) {
  if (type === 'CHALLENGE_PASSING') return 'Challenge Passing';
  if (type === 'ACCOUNT_MANAGEMENT') return 'Account Management';
  if (type === 'ACCOUNT_GROWTH') return 'Account Growth';
  return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function PlanCard({ plan }: { plan: PlanData }) {
  const isPopular = !!plan.popular;
  const isProfitSplit = !plan.price && !!plan.priceLabel;

  const card = (
    <div className="relative pt-5 h-full">
      {isPopular && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10 whitespace-nowrap">
          <span
            className="text-white text-xs font-semibold px-4 py-1.5 rounded-full"
            style={{ background: 'linear-gradient(135deg,#e63946 0%,#c1121f 100%)', boxShadow: '0 0 14px rgba(230,57,70,0.5)' }}
          >
            ★ MOST POPULAR
          </span>
        </div>
      )}

      <div className={`rounded-xl border p-7 flex flex-col h-full transition-all duration-300 glass-shine
        ${isPopular
          ? 'border-[rgba(230,57,70,0.50)] bg-[#120404] shadow-[0_0_30px_rgba(230,57,70,0.10)] hover:border-[rgba(230,57,70,0.70)]'
          : 'border-[rgba(230,57,70,0.25)] bg-[#0d0303] hover:border-[rgba(230,57,70,0.45)] hover:shadow-[0_0_30px_rgba(230,57,70,0.08)]'
        } hover:scale-[1.01]`}
      >
        <h3 className="font-heading font-semibold text-xl text-white mb-1">{plan.name}</h3>
        <p className="text-text-tertiary text-sm mt-1 mb-4 leading-relaxed">{plan.description}</p>

        <div className="flex items-center gap-3 mb-5 py-3 border-y border-white/[0.06] text-xs">
          <span className="text-text-tertiary">Account:</span>
          <span className="text-white font-medium">{plan.accountSizes.join(' / ')}</span>
          {plan.successRate && (
            <span className="ml-auto text-green-400">{plan.successRate}% success</span>
          )}
        </div>

        <ul className="space-y-2.5 mb-6 flex-1">
          {plan.features.map((f) => (
            <li key={f} className="flex items-start gap-2 text-sm text-text-secondary">
              <CircleCheck className="h-[14px] w-[14px] text-accent-primary mt-0.5 shrink-0" />
              {f}
            </li>
          ))}
        </ul>

        <div className="flex items-center justify-between mb-5">
          <div>
            {isProfitSplit ? (
              <span className="text-xl font-semibold text-accent-primary">{plan.priceLabel}</span>
            ) : (
              <>
                <span className="font-heading text-3xl font-bold text-white">${plan.price}</span>
                {plan.originalPrice && (
                  <span className="text-text-tertiary line-through text-sm ml-2">${plan.originalPrice}</span>
                )}
              </>
            )}
          </div>
          {plan.deliveryDays && (
            <span className="flex items-center gap-1 text-xs text-text-tertiary">
              <Clock className="h-3 w-3" /> {plan.deliveryDays} days
            </span>
          )}
        </div>

        {plan.guarantee && (
          <p className="text-xs text-yellow-400 mb-4">{plan.guarantee}</p>
        )}

        <Link href="/dashboard/purchase">
          <button
            type="button"
            className={`inline-flex items-center justify-center gap-2 w-full px-6 py-3 text-sm font-semibold rounded-lg transition-all duration-300 cursor-pointer ${
              isPopular
                ? 'text-white hover:scale-105'
                : 'bg-transparent border border-[rgba(230,57,70,0.50)] text-accent-primary hover:bg-[rgba(230,57,70,0.10)] hover:border-[rgba(230,57,70,0.80)]'
            }`}
            style={isPopular ? { background: 'linear-gradient(135deg,#e63946 0%,#c1121f 100%)', boxShadow: '0 0 20px rgba(230,57,70,0.4)' } : {}}
          >
            {isProfitSplit ? 'Get Started — No Upfront Fee' : 'Get Started'} <ArrowRight className="h-4 w-4" />
          </button>
        </Link>
      </div>
    </div>
  );

  return isPopular ? <GlowBorder color="gold">{card}</GlowBorder> : card;
}

export default function ServicesPage() {
  const [plans, setPlans] = useState<PlanData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetch('/api/public/plans')
      .then((r) => r.json())
      .then((res) => { setPlans(res.data ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // Derive tabs from fetched plans
  const uniqueTypes = [...new Set(plans.map((p) => p.serviceType))];
  const tabItems = [
    { id: 'all', label: 'All Services' },
    ...uniqueTypes.map((t) => ({ id: t, label: serviceLabel(t) })),
  ];

  const filtered = activeTab === 'all' ? plans : plans.filter((p) => p.serviceType === activeTab);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-accent-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">Our Services</h1>
        <p className="text-text-secondary mt-1">Choose the perfect plan for your trading goals.</p>
      </div>

      <Tabs tabs={tabItems} activeTab={activeTab} onChange={setActiveTab} variant="pills" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
        {filtered.map((plan) => (
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
