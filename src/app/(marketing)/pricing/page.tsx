import type { Metadata } from 'next';
import Link from 'next/link';
import { Check, ArrowRight, Shield, Zap } from 'lucide-react';
import { CHALLENGE_PASSING_PLANS, ACCOUNT_MANAGEMENT_PLANS, HOMEPAGE_FAQ } from '@/lib/constants';
import { ServiceType } from '@/types';

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Transparent pricing for prop firm challenge passing and funded account management. No hidden fees.',
};

function PlanCard({ plan, featured }: { plan: (typeof CHALLENGE_PASSING_PLANS)[0]; featured?: boolean }) {
  return (
    <div className={`relative flex flex-col rounded-2xl border p-8 ${
      featured
        ? 'border-accent-primary bg-accent-primary/5 shadow-[0_0_40px_-10px] shadow-accent-primary/20'
        : 'border-[rgba(230,57,70,0.28)] bg-white/[0.03]'
    }`}>
      {featured && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <span className="bg-accent-primary text-white text-xs font-semibold px-4 py-1 rounded-full">
            Most Popular
          </span>
        </div>
      )}
      <div className="mb-6">
        <h3 className="text-xl font-heading font-bold">{plan.name}</h3>
        <p className="text-text-secondary text-sm mt-1">{plan.description}</p>
      </div>
      <div className="mb-6">
        {plan.originalPrice && (
          <p className="text-text-tertiary line-through text-sm">${plan.originalPrice}</p>
        )}
        <div className="flex items-end gap-1">
          <span className="text-4xl font-bold font-mono">${plan.price}</span>
          <span className="text-text-tertiary mb-1">one-time</span>
        </div>
        {plan.guarantee && (
          <p className="text-success text-xs mt-1 flex items-center gap-1">
            <Shield className="h-3 w-3" />{plan.guarantee}
          </p>
        )}
      </div>
      <ul className="space-y-2.5 mb-8 flex-1">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-text-secondary">
            <Check className="h-4 w-4 text-success shrink-0 mt-0.5" />{f}
          </li>
        ))}
      </ul>
      <Link
        href="/register"
        className={`w-full py-3 rounded-xl text-sm font-semibold text-center transition-all ${
          featured
            ? 'bg-accent-primary text-white hover:bg-accent-primary/90'
            : 'border border-white/[0.12] text-text-primary hover:bg-white/[0.06]'
        }`}
      >
        Get Started <ArrowRight className="inline h-4 w-4 ml-1" />
      </Link>
    </div>
  );
}

export default function PricingPage() {
  return (
    <div className="pt-24 pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Hero */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent-primary/10 border border-[rgba(230,57,70,0.20)] text-accent-primary text-sm font-medium mb-6">
            <Zap className="h-4 w-4" /> Transparent Pricing
          </div>
          <h1 className="text-4xl sm:text-5xl font-heading font-bold mb-4">
            Simple, Clear Pricing
          </h1>
          <p className="text-text-secondary text-lg max-w-2xl mx-auto">
            Choose the plan that fits your trading goals. No hidden fees, no surprises — just results.
          </p>
        </div>

        {/* Challenge Passing */}
        <div className="mb-20">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-heading font-bold">Challenge Passing</h2>
            <p className="text-text-secondary mt-2">We pass your prop firm challenge, you keep the profits.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {CHALLENGE_PASSING_PLANS.map((plan) => (
              <PlanCard key={plan.id} plan={plan} featured={plan.popular} />
            ))}
          </div>
        </div>

        {/* Account Management */}
        <div className="mb-20">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-heading font-bold">Account Management</h2>
            <p className="text-text-secondary mt-2">We manage your funded account and share the profits.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {ACCOUNT_MANAGEMENT_PLANS.map((plan) => (
              <PlanCard key={plan.id} plan={plan} featured={plan.popular} />
            ))}
          </div>
        </div>

        {/* Guarantee */}
        <div className="rounded-2xl border border-success/20 bg-success/5 p-8 text-center mb-20">
          <Shield className="h-12 w-12 text-success mx-auto mb-4" />
          <h3 className="text-xl font-heading font-bold mb-2">Our Guarantee</h3>
          <p className="text-text-secondary max-w-2xl mx-auto">
            If we fail to pass your challenge, we will retry at no extra cost. Elite plan customers receive a 100% money-back guarantee.
            We have a 94% success rate across 2,500+ completed challenges.
          </p>
        </div>

        {/* FAQ */}
        <div>
          <h2 className="text-2xl font-heading font-bold text-center mb-10">Frequently Asked Questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {HOMEPAGE_FAQ.slice(0, 6).map((faq) => (
              <div key={faq.question} className="p-6 rounded-2xl border border-[rgba(230,57,70,0.28)] bg-white/[0.03]">
                <h4 className="font-semibold text-sm mb-2">{faq.question}</h4>
                <p className="text-text-secondary text-sm">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
