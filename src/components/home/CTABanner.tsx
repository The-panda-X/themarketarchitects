'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import Button from '@/components/ui/Button';
import ScrollReveal from '@/components/effects/ScrollReveal';
import ParticleField from '@/components/effects/ParticleField';

export default function CTABanner() {
  return (
    <section className="py-20 md:py-28 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent-muted/30 via-bg-primary to-bg-primary" />
      <ParticleField
        particleCount={20}
        color="230, 57, 70"
        maxSize={2}
        speed={0.2}
        className="opacity-40"
      />

      {/* Faint phoenix watermark */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/4 opacity-[0.04] pointer-events-none">
        <Image
          src="/assets/logos/logo.png"
          alt=""
          width={500}
          height={500}
          className="w-[500px] h-[500px]"
        />
      </div>

      <div className="relative z-10 section-container section-padding">
        <ScrollReveal>
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl md:text-5xl font-heading font-bold mb-5 leading-tight">
              Ready to Get{' '}
              <span className="text-gradient-red">Funded?</span>
            </h2>
            <p className="text-lg text-text-secondary mb-10 max-w-lg mx-auto">
              Join thousands of traders who trust us to pass their prop firm
              challenges. Start today and get funded within days.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
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
              <Link href="/contact">
                <Button variant="secondary" size="xl">
                  Contact Us
                </Button>
              </Link>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
