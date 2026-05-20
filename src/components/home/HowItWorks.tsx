'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { ClipboardList, KeyRound, LineChart, Trophy } from 'lucide-react';
import ScrollReveal from '@/components/effects/ScrollReveal';

const steps = [
  {
    number: 1,
    icon: ClipboardList,
    title: 'Choose Your Plan',
    description:
      'Select your prop firm, account size, and service tier. We support all major firms and account sizes from $25K to $400K+.',
  },
  {
    number: 2,
    icon: KeyRound,
    title: 'Submit Credentials',
    description:
      'Securely share your trading account details through our encrypted portal. Your credentials are protected with AES-256 encryption.',
  },
  {
    number: 3,
    icon: LineChart,
    title: 'We Trade & Pass',
    description:
      'Our professional traders handle everything — meeting profit targets, respecting drawdown limits, and following all challenge rules.',
  },
  {
    number: 4,
    icon: Trophy,
    title: 'Get Funded',
    description:
      'Receive your funded account and start earning. Track real-time progress on your dashboard with detailed analytics and proof.',
  },
];

export default function HowItWorks() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end center'],
  });
  const lineHeight = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);

  return (
    <section ref={sectionRef} className="py-20 md:py-28 gradient-mesh-bg">
      <div className="section-container section-padding">
        {/* Header */}
        <ScrollReveal>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
              How It Works
            </h2>
            <div className="w-16 h-1 bg-accent-primary rounded-full mx-auto mb-4" />
            <p className="text-text-secondary max-w-xl mx-auto">
              Four simple steps to your funded trading account.
            </p>
          </div>
        </ScrollReveal>

        {/* Timeline */}
        <div className="relative max-w-3xl mx-auto">
          {/* Vertical line (desktop) */}
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-white/[0.06] -translate-x-1/2">
            <motion.div
              className="w-full bg-accent-primary rounded-full origin-top"
              style={{ height: lineHeight }}
            />
          </div>

          {/* Mobile line */}
          <div className="md:hidden absolute left-6 top-0 bottom-0 w-px bg-white/[0.06]">
            <motion.div
              className="w-full bg-accent-primary rounded-full origin-top"
              style={{ height: lineHeight }}
            />
          </div>

          {/* Steps */}
          <div className="space-y-12 md:space-y-16">
            {steps.map((step, i) => (
              <ScrollReveal
                key={step.number}
                direction={i % 2 === 0 ? 'left' : 'right'}
                delay={i * 0.1}
              >
                <div
                  className={`relative flex items-start gap-6 md:gap-0 ${
                    i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                  }`}
                >
                  {/* Number circle */}
                  <div className="absolute left-6 md:left-1/2 -translate-x-1/2 z-10">
                    <div className="h-12 w-12 rounded-full bg-bg-primary border-2 border-accent-primary flex items-center justify-center shadow-glow-sm">
                      <span className="text-sm font-bold font-mono text-accent-primary">
                        {step.number}
                      </span>
                    </div>
                  </div>

                  {/* Content card */}
                  <div
                    className={`ml-16 md:ml-0 md:w-[calc(50%-40px)] ${
                      i % 2 === 0 ? 'md:pr-0' : 'md:pl-0'
                    }`}
                  >
                    <div className="glass-card p-6 hover:bg-white/[0.06] transition-colors duration-300">
                      <div className="flex items-center gap-3 mb-3">
                        <step.icon className="h-5 w-5 text-accent-primary shrink-0" />
                        <h3 className="text-lg font-semibold">{step.title}</h3>
                      </div>
                      <p className="text-sm text-text-secondary leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>

                  {/* Spacer for opposite side */}
                  <div className="hidden md:block md:w-[calc(50%-40px)]" />
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
