'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import CandlestickBg from '@/components/effects/CandlestickBg';
import { PROP_FIRMS } from '@/lib/constants';

const container = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.2 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] } },
};

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-black">

      {/* ── Candlestick chart background ─────────────────────────── */}
      <div className="absolute inset-0">
        <CandlestickBg opacity={0.13} count={40} />
      </div>

      {/* ── Red radial glow — centred, matches reference ───────────── */}
      <div
        className="absolute left-1/2 top-[38%] -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        style={{
          width: 700,
          height: 700,
          background: 'radial-gradient(circle, rgba(230,57,70,0.22) 0%, rgba(230,57,70,0.08) 40%, transparent 70%)',
        }}
      />

      {/* ── Content ───────────────────────────────────────────────── */}
      <div className="relative z-10 flex flex-col items-center text-center px-4 pt-24 pb-12 w-full max-w-5xl mx-auto">
        <motion.div variants={container} initial="hidden" animate="visible" className="flex flex-col items-center">

          {/* Trust pill */}
          <motion.div variants={item} className="mb-10">
            <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-accent-primary/30 bg-black/60 text-xs font-semibold tracking-widest uppercase text-white/80">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-primary animate-pulse" />
              2,400+ Challenges Passed &bull; 97% Success Rate
            </span>
          </motion.div>

          {/* Floating logo */}
          <motion.div
            variants={item}
            className="mb-8"
          >
            <motion.div
              animate={{ y: [0, -14, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
              className="relative w-40 h-40 sm:w-52 sm:h-52 mx-auto"
              style={{ filter: 'drop-shadow(0 0 28px rgba(230, 57, 70, 0.55))' }}
            >
              <Image
                src="/assets/logos/logo.png"
                alt="The Market Architects"
                fill
                className="object-contain"
                priority
              />
            </motion.div>
          </motion.div>

          {/* Heading — tighter size to match reference */}
          <motion.h1
            variants={item}
            className="text-4xl sm:text-5xl md:text-6xl font-heading font-extrabold leading-[1.05] tracking-tight mb-5"
          >
            <span className="block text-white">THE MARKET</span>
            <span className="block text-accent-primary">ARCHITECTS</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p variants={item} className="text-sm sm:text-base text-white/55 max-w-md mx-auto mb-10 leading-relaxed">
            Elite prop firm challenge passing &amp; funded account management.
            We engineer your path to consistent trading profits.
          </motion.p>

          {/* CTAs */}
          <motion.div variants={item} className="flex flex-col sm:flex-row items-center gap-4 mb-16">
            <Link
              href="/dashboard/purchase"
              className="inline-flex items-center gap-2 bg-accent-primary hover:bg-accent-hover text-white font-semibold px-8 py-3 rounded-lg transition-colors duration-200 text-sm tracking-wide btn-glow-pulse"
            >
              Start Your Journey <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#services"
              className="inline-flex items-center gap-2 border border-white/20 hover:border-accent-primary/60 text-white/80 hover:text-white font-semibold px-8 py-3 rounded-lg transition-all duration-200 text-sm tracking-wide"
            >
              View Our Results
            </a>
          </motion.div>

          {/* Prop firm logos */}
          <motion.div variants={item} className="w-full">
            <p className="text-[10px] text-white/25 uppercase tracking-widest mb-3 font-medium">Supported Prop Firms</p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {PROP_FIRMS.filter(f => f.id !== 'other').map((firm) => (
                <span
                  key={firm.id}
                  className="text-[11px] font-semibold text-white/35 hover:text-white/65 transition-colors duration-200 border border-white/[0.08] hover:border-white/20 px-3 py-1.5 rounded-md"
                >
                  {firm.name}
                </span>
              ))}
            </div>
          </motion.div>

        </motion.div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-black to-transparent pointer-events-none" />
    </section>
  );
}
