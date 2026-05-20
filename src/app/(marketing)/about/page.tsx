import type { Metadata } from 'next';
import { Shield, TrendingUp, Users, Trophy, Target, CheckCircle } from 'lucide-react';
import { TRUST_STATS } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'About Us',
  description: 'Learn about The Market Architects — the team of professional traders behind 2,500+ successful prop firm challenges.',
};

const values = [
  {
    icon: Shield,
    title: 'Security First',
    description: 'All trading credentials are encrypted with AES-256-GCM. Your data is never shared or sold.',
  },
  {
    icon: TrendingUp,
    title: 'Proven Results',
    description: '94% challenge pass rate across all major prop firms. We only take on challenges we\'re confident we can pass.',
  },
  {
    icon: Users,
    title: 'Client-Centered',
    description: 'Every client gets a dedicated trader assigned to their challenge with direct communication throughout.',
  },
  {
    icon: Target,
    title: 'Precision Trading',
    description: 'We follow strict risk management protocols — every trade is calculated to meet challenge requirements exactly.',
  },
];

const teamMembers = [
  {
    name: 'Marcus A.',
    title: 'Head Trader & Founder',
    description: '8 years institutional FX experience. Personally oversees Elite challenge accounts.',
    initials: 'MA',
  },
  {
    name: 'James L.',
    title: 'Senior Prop Trader',
    description: 'Specialist in FTMO and FundedNext. 300+ challenges passed with a 97% success rate.',
    initials: 'JL',
  },
  {
    name: 'Sofia R.',
    title: 'Account Manager',
    description: 'Manages funded account clients and monthly payout reporting.',
    initials: 'SR',
  },
  {
    name: 'Daniel K.',
    title: 'Risk & Compliance',
    description: 'Ensures all trading activity stays within firm rules and drawdown limits.',
    initials: 'DK',
  },
];

export default function AboutPage() {
  return (
    <div className="pt-24 pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Hero */}
        <div className="text-center mb-20">
          <h1 className="text-4xl sm:text-5xl font-heading font-bold mb-6">
            Built by Traders, <span className="text-accent-primary">For Traders</span>
          </h1>
          <p className="text-text-secondary text-lg max-w-3xl mx-auto leading-relaxed">
            The Market Architects was founded by a team of professional traders frustrated by the barriers between talented traders and funded accounts.
            We built the service we wished existed — professional, transparent, and results-driven.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {TRUST_STATS.map((stat) => (
            <div key={stat.label} className="text-center p-6 rounded-2xl border border-white/[0.08] bg-white/[0.03]">
              <p className="text-3xl font-bold font-mono text-accent-primary">
                {('prefix' in stat ? stat.prefix : '')}{stat.value.toLocaleString()}{stat.suffix}
              </p>
              <p className="text-text-secondary text-sm mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Story */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20 items-center">
          <div>
            <h2 className="text-3xl font-heading font-bold mb-6">Our Story</h2>
            <div className="space-y-4 text-text-secondary">
              <p>
                We started in 2021 as a small group of institutional traders who had all been through the prop firm challenge process personally.
                We knew exactly what was required, and we saw how many skilled traders were failing due to discipline, psychology, or simply not having the time to trade consistently.
              </p>
              <p>
                Our first client was a referral from a friend. We passed their $100K FTMO challenge in 9 days.
                Word spread, and within six months we had helped over 50 traders get funded.
              </p>
              <p>
                Today, The Market Architects is trusted by traders in over 30 countries.
                Every challenge is personally overseen by a senior trader, and we maintain a strict policy of only accepting clients whose accounts we are confident we can pass.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Founded', value: '2021' },
              { label: 'Countries', value: '30+' },
              { label: 'Prop Firms', value: '20+' },
              { label: 'Avg. Completion', value: '8 Days' },
            ].map((item) => (
              <div key={item.label} className="p-6 rounded-2xl border border-white/[0.08] bg-white/[0.03] text-center">
                <p className="text-2xl font-bold font-mono text-accent-gold">{item.value}</p>
                <p className="text-text-tertiary text-sm mt-1">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Values */}
        <div className="mb-20">
          <h2 className="text-3xl font-heading font-bold text-center mb-10">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {values.map(({ icon: Icon, title, description }) => (
              <div key={title} className="flex gap-4 p-6 rounded-2xl border border-white/[0.08] bg-white/[0.03]">
                <div className="p-3 rounded-xl bg-accent-primary/10 h-fit">
                  <Icon className="h-5 w-5 text-accent-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{title}</h3>
                  <p className="text-text-secondary text-sm">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Team */}
        <div className="mb-20">
          <h2 className="text-3xl font-heading font-bold text-center mb-10">The Team</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {teamMembers.map((member) => (
              <div key={member.name} className="text-center p-6 rounded-2xl border border-white/[0.08] bg-white/[0.03]">
                <div className="w-16 h-16 rounded-full bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center mx-auto mb-4">
                  <span className="text-accent-primary font-bold">{member.initials}</span>
                </div>
                <h3 className="font-semibold">{member.name}</h3>
                <p className="text-accent-primary text-xs mt-0.5">{member.title}</p>
                <p className="text-text-secondary text-sm mt-3">{member.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Promise */}
        <div className="rounded-2xl border border-accent-primary/20 bg-accent-primary/5 p-10 text-center">
          <Trophy className="h-12 w-12 text-accent-gold mx-auto mb-4" />
          <h3 className="text-2xl font-heading font-bold mb-3">Our Promise to You</h3>
          <p className="text-text-secondary max-w-2xl mx-auto mb-6">
            We treat every client account as if it were our own. Your success is our reputation.
            That is why we have maintained a 94% pass rate and why over 60% of our clients return for additional services.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-text-secondary">
            {['No upfront hidden fees', 'Encrypted credentials', 'Daily progress updates', '100% transparency', 'Retry guarantee'].map((item) => (
              <span key={item} className="flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4 text-success" />{item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
