'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import ScrollReveal from '@/components/effects/ScrollReveal';

export default function CTABanner() {
  return (
    <section className="py-20 md:py-28 relative overflow-hidden">
      <div className="relative z-10 section-container section-padding">
        <ScrollReveal>
          {/* Glass card — matches reference */}
          <div className="rounded-2xl border border-[rgba(230,57,70,0.25)] bg-[#0d0303] backdrop-blur-xl glass-shine transition-all duration-300 hover:border-[rgba(230,57,70,0.40)] hover:shadow-[0_0_30px_rgba(230,57,70,0.08)] p-12 text-center relative overflow-hidden">

            {/* Radial red glow overlay */}
            <div
              className="absolute inset-0 pointer-events-none opacity-20"
              style={{
                background: 'radial-gradient(ellipse at 50% 0%, rgba(230,57,70,0.6) 0%, transparent 70%)',
              }}
            />

            <div className="relative z-10">
              {/* Floating logo */}
              <motion.div
                animate={{ y: [0, -14, 0] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                className="mx-auto mb-6 w-44 h-44"
                style={{ filter: 'drop-shadow(0 0 28px rgba(230,57,70,0.5))' }}
              >
                <Image
                  src="/assets/logos/logo.png"
                  alt="TMA"
                  width={176}
                  height={176}
                  className="object-contain w-full h-full"
                />
              </motion.div>

              {/* Heading */}
              <h2 className="font-heading font-normal text-4xl md:text-6xl text-white mb-4 leading-tight">
                Ready to Get{' '}
                <span className="text-gradient-red">Funded?</span>
              </h2>

              {/* Subtitle */}
              <p className="text-text-secondary text-lg mb-8 max-w-xl mx-auto">
                Join 1,200+ traders who trust The Market Architects to build their funded trading career.
              </p>

              {/* CTA button */}
              <Link href="/dashboard/purchase">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 px-10 py-5 text-xl font-semibold tracking-wide rounded-lg text-white transition-all duration-300 cursor-pointer btn-glow-pulse hover:scale-105 relative overflow-hidden"
                  style={{
                    background: 'linear-gradient(135deg, #e63946 0%, #c1121f 100%)',
                    boxShadow: '0 0 24px rgba(230,57,70,0.5)',
                  }}
                >
                  {/* Glossy shine */}
                  <span
                    className="absolute top-0 left-0 right-0 pointer-events-none"
                    style={{
                      height: '48%',
                      background: 'linear-gradient(to bottom, rgba(255,255,255,0.13) 0%, transparent 100%)',
                      borderRadius: 'inherit',
                    }}
                  />
                  <span className="relative z-10 flex items-center gap-2">
                    Get Started Today <ArrowRight className="h-5 w-5" />
                  </span>
                </button>
              </Link>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
