'use client';

import { DollarSign, CheckCircle2, ExternalLink } from 'lucide-react';
import SectionBadge from '@/components/ui/SectionBadge';
import GlassCard from '@/components/ui/GlassCard';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import ScrollReveal from '@/components/effects/ScrollReveal';
import { StaggerContainer, StaggerItem } from '@/components/effects/ScrollReveal';

const proofItems = [
  { firm: 'FTMO', amount: '$12,400', account: '$200K', date: 'May 2026', status: 'Funded' },
  { firm: 'FundedNext', amount: '$8,200', account: '$100K', date: 'May 2026', status: 'Passed' },
  { firm: 'The Funded Trader', amount: '$18,600', account: '$400K', date: 'Apr 2026', status: 'Funded' },
  { firm: 'E8 Funding', amount: '$5,100', account: '$100K', date: 'Apr 2026', status: 'Passed' },
  { firm: 'FTMO', amount: '$24,800', account: '$200K', date: 'Apr 2026', status: 'Funded' },
  { firm: 'FundedNext', amount: '$6,750', account: '$50K', date: 'Mar 2026', status: 'Passed' },
  { firm: 'TopStep', amount: '$9,300', account: '$150K', date: 'Mar 2026', status: 'Funded' },
  { firm: 'FTMO', amount: '$15,200', account: '$200K', date: 'Mar 2026', status: 'Funded' },
];

export default function PayoutProof() {
  return (
    <section id="proof" className="py-20 md:py-28">
      <div className="section-container section-padding">
        {/* Header */}
        <ScrollReveal>
          <div className="text-center mb-14">
            <SectionBadge>Verified Results</SectionBadge>
            <div className="flex items-center justify-center gap-3 mb-4">
              <h2 className="text-3xl md:text-4xl font-heading font-bold">
                Verified Results
              </h2>
              <Badge variant="green" size="md">
                <CheckCircle2 className="h-3 w-3" /> PROOF
              </Badge>
            </div>
            <div className="w-16 h-1 bg-accent-primary rounded-full mx-auto mb-4" />
            <p className="text-text-secondary max-w-xl mx-auto">
              Real results from real clients. Every payout verified and documented.
            </p>
          </div>
        </ScrollReveal>

        {/* Marquee row */}
        <ScrollReveal>
          <div className="overflow-hidden mb-10 -mx-4">
            <div className="flex animate-ticker gap-4 w-max">
              {[...proofItems, ...proofItems].map((item, i) => (
                <div
                  key={i}
                  className="shrink-0 glass-card px-5 py-3 flex items-center gap-3"
                >
                  <DollarSign className="h-4 w-4 text-success" />
                  <span className="text-sm font-mono text-success font-semibold">
                    {item.amount}
                  </span>
                  <span className="text-xs text-text-tertiary">{item.firm}</span>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>

        {/* Proof grid */}
        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {proofItems.map((item, i) => (
            <StaggerItem key={i}>
              <GlassCard hover padding="none" className="group">
                {/* Gradient top bar */}
                <div className="h-1 bg-gradient-to-r from-accent-primary to-success" />
                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-text-primary">
                      {item.firm}
                    </span>
                    <Badge variant={item.status === 'Funded' ? 'green' : 'blue'} size="sm">
                      {item.status}
                    </Badge>
                  </div>
                  <p className="text-2xl font-bold font-mono text-success mb-1">
                    {item.amount}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-tertiary">
                      {item.account} Account
                    </span>
                    <span className="text-xs text-text-tertiary">{item.date}</span>
                  </div>
                </div>
              </GlassCard>
            </StaggerItem>
          ))}
        </StaggerContainer>

        {/* View all */}
        <ScrollReveal delay={0.3}>
          <div className="text-center mt-10">
            <Button
              variant="secondary"
              icon={<ExternalLink className="h-4 w-4" />}
              iconPosition="right"
            >
              View All Proof
            </Button>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
