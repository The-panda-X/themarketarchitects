'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle } from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import CandlestickBg from '@/components/effects/CandlestickBg';
import GradientOrb from '@/components/effects/GradientOrb';
import ParticleField from '@/components/effects/ParticleField';

const container = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.3 },
  },
};

const item = {
  hidden: { opacity: 0, y: 25 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] } },
};

const trustPoints = [
  '2,500+ Challenges Passed',
  '$12M+ in Payouts',
  '94% Success Rate',
];

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background layers */}
      <div className="absolute inset-0">
        <CandlestickBg opacity={0.06} count={35} />
        <ParticleField particleCount={25} color="255, 255, 255" maxSize={1.5} speed={0.15} />
        <GradientOrb
          color="rgba(230, 57, 70, 0.12)"
          size={800}
          position="top-right"
          blur={150}
        />
        <GradientOrb
          color="rgba(230, 57, 70, 0.06)"
          size={500}
          position="bottom-left"
          blur={120}
        />
        <div className="absolute inset-0 grid-pattern" />
      </div>

      {/* Content */}
      <div className="relative z-10 section-container section-padding pt-28 pb-20">
        <motion.div
          variants={container}
          initial="hidden"
          animate="visible"
          className="max-w-4xl mx-auto text-center"
        >
          {/* Badge */}
          <motion.div variants={item} className="flex justify-center mb-6">
            <Badge variant="gold" size="md" className="px-4 py-1.5">
              <span className="mr-1">&#127942;</span> #1 Prop Firm Challenge Passing Service
            </Badge>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={item}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-heading font-bold leading-[1.1] tracking-tight mb-6"
          >
            We Pass Your Prop Firm{' '}
            <span className="text-gradient-red">Challenges.</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            variants={item}
            className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Professional traders. Guaranteed results. Get funded without the stress.
          </motion.p>

          {/* CTAs */}
          <motion.div
            variants={item}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
          >
            <Link href="/dashboard/purchase">
              <Button
                variant="primary"
                size="xl"
                glow
                icon={<ArrowRight className="h-5 w-5" />}
                iconPosition="right"
              >
                Start Your Challenge
              </Button>
            </Link>
            <a href="#proof">
              <Button variant="secondary" size="xl">
                View Our Results
              </Button>
            </a>
          </motion.div>

          {/* Trust micro-indicators */}
          <motion.div
            variants={item}
            className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2"
          >
            {trustPoints.map((point) => (
              <span
                key={point}
                className="inline-flex items-center gap-1.5 text-sm text-text-secondary"
              >
                <CheckCircle className="h-4 w-4 text-success shrink-0" />
                {point}
              </span>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-bg-primary to-transparent" />
    </section>
  );
}
