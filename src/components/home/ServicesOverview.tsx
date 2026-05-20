'use client';

import Link from 'next/link';
import { Target, BarChart3, TrendingUp, ArrowRight } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import ScrollReveal from '@/components/effects/ScrollReveal';
import { StaggerContainer, StaggerItem } from '@/components/effects/ScrollReveal';

const services = [
  {
    icon: Target,
    title: 'Challenge Passing',
    description:
      'Our expert traders pass your prop firm challenge — Phase 1, Phase 2, and verification. All major firms supported.',
    price: 'From $299',
    href: '/dashboard/purchase',
    features: ['All major prop firms', 'Phase 1 & 2 passing', '7–14 day completion'],
  },
  {
    icon: BarChart3,
    title: 'Account Management',
    description:
      'Hands-off funded account management with consistent returns. We trade, you earn your profit split.',
    price: 'From $499/mo',
    href: '/dashboard/purchase',
    features: ['Consistent monthly returns', 'Risk management included', 'Up to 80/20 profit split'],
  },
  {
    icon: TrendingUp,
    title: 'Account Growth',
    description:
      'Aggressive growth strategies for funded accounts. Maximize your earning potential with our senior traders.',
    price: 'Custom Pricing',
    href: '/contact',
    features: ['Aggressive growth strategy', 'Dedicated senior trader', 'Custom risk profiles'],
  },
];

export default function ServicesOverview() {
  return (
    <section id="services" className="py-20 md:py-28">
      <div className="section-container section-padding">
        {/* Header */}
        <ScrollReveal>
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
              Our Services
            </h2>
            <div className="w-16 h-1 bg-accent-primary rounded-full mx-auto mb-4" />
            <p className="text-text-secondary max-w-xl mx-auto">
              Professional trading services designed to get you funded and keep you profitable.
            </p>
          </div>
        </ScrollReveal>

        {/* Cards */}
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {services.map((service) => (
            <StaggerItem key={service.title}>
              <GlassCard
                hover
                glow="red"
                padding="none"
                className="h-full flex flex-col group"
              >
                <div className="p-6 pb-0 flex-1">
                  <div className="h-12 w-12 rounded-xl bg-accent-primary/10 flex items-center justify-center mb-5 group-hover:bg-accent-primary/15 transition-colors">
                    <service.icon className="h-6 w-6 text-accent-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{service.title}</h3>
                  <p className="text-sm text-text-secondary leading-relaxed mb-5">
                    {service.description}
                  </p>
                  <ul className="space-y-2 mb-5">
                    {service.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-center gap-2 text-sm text-text-secondary"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-accent-primary shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="p-6 pt-0 mt-auto">
                  <div className="flex items-center justify-between pt-5 border-t border-white/[0.06]">
                    <span className="text-lg font-bold font-mono text-accent-primary">
                      {service.price}
                    </span>
                    <Link href={service.href}>
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<ArrowRight className="h-4 w-4" />}
                        iconPosition="right"
                      >
                        Learn More
                      </Button>
                    </Link>
                  </div>
                </div>
              </GlassCard>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
