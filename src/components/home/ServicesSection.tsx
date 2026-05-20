'use client';

import Link from 'next/link';
import { Target, TrendingUp, Zap, CircleCheck } from 'lucide-react';
import ScrollReveal, { StaggerContainer, StaggerItem } from '@/components/effects/ScrollReveal';
import SectionBadge from '@/components/ui/SectionBadge';

const services = [
  {
    icon: Target,
    title: 'Challenge Passing',
    description:
      'We pass your prop firm challenge with precision. Phase 1, Phase 2, or full funded — we handle it all.',
    features: ['FTMO, MyFxBook, MFF & more', 'Phase 1 & 2 coverage', 'Results within 7–14 days'],
    price: 'From $149',
  },
  {
    icon: TrendingUp,
    title: 'Account Management',
    description:
      'Hand over your funded account and let our expert traders grow it with disciplined risk management.',
    features: ['Profit split model', 'Daily reporting', 'Full transparency'],
    price: '20% profit split',
  },
  {
    icon: Zap,
    title: 'Account Growth',
    description:
      'Consistent, structured trading to scale your account and maximize your capital.',
    features: ['Low drawdown strategy', 'Compounding growth', 'Weekly updates'],
    price: 'Custom plans',
  },
];

export default function ServicesSection() {
  return (
    <section id="services" className="py-24 px-4 sm:px-6 max-w-7xl mx-auto">
      {/* Header */}
      <ScrollReveal>
        <div className="mb-12 text-center">
          <SectionBadge>Our Services</SectionBadge>
          <h2 className="font-heading font-normal text-4xl md:text-5xl lg:text-6xl text-white leading-tight">
            Everything You Need to
            <br />
            <span className="text-gradient-red">Dominate Prop Firms</span>
          </h2>
          <p className="mt-4 text-text-secondary text-lg max-w-2xl mx-auto leading-relaxed">
            From challenge passing to funded account management, we have the expertise to elevate your trading career.
          </p>
        </div>
      </ScrollReveal>

      {/* Cards */}
      <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {services.map((service) => {
          const Icon = service.icon;
          return (
            <StaggerItem key={service.title}>
              <div className="rounded-xl border border-[rgba(230,57,70,0.25)] bg-[#0d0303] backdrop-blur-xl glass-shine p-7 group hover:scale-[1.02] hover:border-[rgba(230,57,70,0.45)] hover:shadow-[0_0_30px_rgba(230,57,70,0.08)] transition-all duration-300 flex flex-col h-full">

                {/* Icon box */}
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 shrink-0"
                  style={{
                    background: 'linear-gradient(135deg, #e63946 0%, #c1121f 100%)',
                    boxShadow: '0 0 18px rgba(230,57,70,0.45)',
                  }}
                >
                  <Icon className="h-[22px] w-[22px] text-white" strokeWidth={2} />
                </div>

                {/* Title */}
                <h3 className="font-heading text-2xl text-white mb-3">{service.title}</h3>

                {/* Description */}
                <p className="text-text-tertiary text-sm leading-relaxed mb-5">{service.description}</p>

                {/* Features */}
                <ul className="space-y-2 mb-6 flex-1">
                  {service.features.map((feat) => (
                    <li key={feat} className="flex items-center gap-2 text-xs text-text-secondary">
                      <CircleCheck className="h-[13px] w-[13px] text-accent-primary shrink-0" />
                      {feat}
                    </li>
                  ))}
                </ul>

                {/* Footer */}
                <div className="flex items-center justify-between mt-auto">
                  <span className="text-accent-primary font-semibold text-lg">{service.price}</span>
                  <Link href="#pricing">
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-lg border border-[rgba(230,57,70,0.50)] text-accent-primary bg-transparent transition-all duration-300 hover:bg-[rgba(230,57,70,0.10)] hover:border-[rgba(230,57,70,0.80)] hover:text-red-300 hover:shadow-[0_0_20px_rgba(230,57,70,0.2)] cursor-pointer"
                    >
                      View Plans
                    </button>
                  </Link>
                </div>
              </div>
            </StaggerItem>
          );
        })}
      </StaggerContainer>
    </section>
  );
}
