'use client';

import { motion } from 'framer-motion';
import ScrollReveal from '@/components/effects/ScrollReveal';

const steps = [
  {
    number: '01',
    title: 'Choose Your Service',
    description: 'Select the prop firm challenge or management plan that fits your needs.',
  },
  {
    number: '02',
    title: 'Secure Checkout',
    description: 'Complete payment securely and submit your challenge/account credentials.',
  },
  {
    number: '03',
    title: 'We Execute',
    description: 'Our expert traders work on your account with strict risk parameters.',
  },
  {
    number: '04',
    title: 'You Get Paid',
    description: 'Receive your funded account or profit split directly to your wallet.',
  },
];

export default function HowItWorks() {
  return (
    <section className="py-24 md:py-32 bg-black">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">

        {/* Header */}
        <ScrollReveal>
          <div className="text-center mb-20">
            <span className="inline-block px-4 py-1.5 rounded-full border border-accent-primary/30 bg-accent-primary/10 text-[10px] font-bold tracking-widest uppercase text-accent-primary mb-6">
              How It Works
            </span>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-heading font-extrabold leading-tight">
              <span className="block text-white">Simple Process,</span>
              <span className="block font-display italic text-accent-primary">Proven Results</span>
            </h2>
            <p className="text-white/50 mt-4 text-sm max-w-md mx-auto">
              Get funded in 4 simple steps. We handle the hard part.
            </p>
          </div>
        </ScrollReveal>

        {/* Steps */}
        <div className="relative">
          {/* Connecting line — desktop */}
          <div className="hidden md:block absolute top-10 left-0 right-0 h-px bg-white/[0.07] z-0" />

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10 md:gap-6 relative z-10">
            {steps.map((step, i) => (
              <ScrollReveal key={step.number} delay={i * 0.12}>
                <motion.div
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col items-center text-center"
                >
                  {/* Number circle */}
                  <div className="relative mb-6">
                    <div className="w-20 h-20 rounded-full border border-accent-primary/25 bg-accent-primary/5 flex items-center justify-center">
                      <span className="text-lg font-bold font-mono text-accent-primary/70">
                        {step.number}
                      </span>
                    </div>
                    {/* Glow ring on hover */}
                    <div className="absolute inset-0 rounded-full bg-accent-primary/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>

                  {/* Title */}
                  <h3 className="text-sm font-bold text-accent-primary mb-2 tracking-wide">
                    {step.title}
                  </h3>

                  {/* Description */}
                  <p className="text-xs text-white/45 leading-relaxed max-w-[180px]">
                    {step.description}
                  </p>
                </motion.div>
              </ScrollReveal>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
