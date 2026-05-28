'use client';

import { useEffect, useRef, useState } from 'react';
import { Star, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import ScrollReveal from '@/components/effects/ScrollReveal';
import { cn } from '@/lib/utils';
import SectionBadge from '@/components/ui/SectionBadge';

const testimonials = [
  {
    name: 'John D.',
    avatar: null,
    title: 'Passed $200K FTMO Challenge',
    content:
      'Absolutely incredible service. They passed my FTMO challenge in just 8 days with zero drawdown issues. The dashboard tracking was a nice touch — I could see every trade in real time.',
    rating: 5,
  },
  {
    name: 'Sarah M.',
    avatar: null,
    title: 'Funded $100K FundedNext Account',
    content:
      'I was skeptical at first, but the results speak for themselves. Professional communication throughout, and they handled both phases flawlessly. Already on my second account with them.',
    rating: 5,
  },
  {
    name: 'Alex K.',
    avatar: null,
    title: 'Passed $50K E8 Challenge',
    content:
      'Fast, reliable, and professional. The encrypted credential submission made me feel secure. Got my funded account within 10 days. Highly recommend the Professional plan.',
    rating: 5,
  },
  {
    name: 'Michael R.',
    avatar: null,
    title: 'Passed $300K FTMO Challenge',
    content:
      'Elite plan was worth every penny. VIP support was responsive within minutes, and they fast-tracked my challenge completion. The proof screenshots were impressive.',
    rating: 5,
  },
  {
    name: 'Emma L.',
    avatar: null,
    title: 'Account Management — $100K',
    content:
      'Been using their account management for 3 months now. Consistent 4-6% monthly returns with minimal drawdown. The profit split system helped me plan my earnings perfectly.',
    rating: 5,
  },
  {
    name: 'David W.',
    avatar: null,
    title: 'Passed $200K The Funded Trader',
    content:
      'Third challenge they have passed for me. Every time — on time, professional, and within the rules. The referral program is a great bonus too.',
    rating: 4,
  },
];

export default function Testimonials() {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const visibleCount = 3;
  const maxIndex = Math.max(0, testimonials.length - visibleCount);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
    }, 5000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [maxIndex]);

  function navigate(dir: 'prev' | 'next') {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setActiveIndex((prev) =>
      dir === 'next'
        ? prev >= maxIndex ? 0 : prev + 1
        : prev <= 0 ? maxIndex : prev - 1
    );
  }

  return (
    <section className="py-20 md:py-28 gradient-mesh-bg">
      <div className="section-container section-padding">
        {/* Header */}
        <ScrollReveal>
          <div className="text-center mb-14">
            <SectionBadge>Testimonials</SectionBadge>
            <h2 className="font-heading font-bold text-4xl md:text-5xl lg:text-6xl text-white leading-tight">
              What Our <span className="text-gradient-red">Clients Say</span>
            </h2>
            <p className="mt-4 text-text-secondary text-lg max-w-2xl mx-auto leading-relaxed">
              Trusted by thousands of traders worldwide.
            </p>
          </div>
        </ScrollReveal>

        {/* Carousel */}
        <ScrollReveal>
          <div className="relative">
            <div ref={scrollRef} className="overflow-hidden">
              <div
                className="flex transition-transform duration-500 ease-out"
                style={{
                  transform: `translateX(-${activeIndex * (100 / visibleCount)}%)`,
                }}
              >
                {testimonials.map((t, i) => (
                  <div
                    key={i}
                    className="w-full md:w-1/3 shrink-0 px-2"
                  >
                    <GlassCard padding="lg" className="h-full flex flex-col">
                      {/* Stars */}
                      <div className="flex items-center gap-0.5 mb-4">
                        {Array.from({ length: 5 }).map((_, s) => (
                          <Star
                            key={s}
                            className={cn(
                              'h-4 w-4',
                              s < t.rating
                                ? 'fill-accent-gold text-accent-gold'
                                : 'text-text-tertiary'
                            )}
                          />
                        ))}
                      </div>

                      {/* Quote */}
                      <p className="text-sm text-text-secondary leading-relaxed flex-1 mb-6">
                        &ldquo;{t.content}&rdquo;
                      </p>

                      {/* Author */}
                      <div className="flex items-center gap-3 pt-4 border-t border-white/[0.06]">
                        <Avatar name={t.name} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-text-primary">
                            {t.name}
                          </p>
                          <p className="text-xs text-text-tertiary truncate">
                            {t.title}
                          </p>
                        </div>
                        <Badge variant="green" size="sm">
                          <CheckCircle2 className="h-2.5 w-2.5" /> Verified
                        </Badge>
                      </div>
                    </GlassCard>
                  </div>
                ))}
              </div>
            </div>

            {/* Nav buttons */}
            <button
              onClick={() => navigate('prev')}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 p-2 rounded-full glass hover:bg-white/10 transition-colors hidden md:block"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => navigate('next')}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 p-2 rounded-full glass hover:bg-white/10 transition-colors hidden md:block"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            {/* Dots */}
            <div className="flex items-center justify-center gap-2 mt-8">
              {Array.from({ length: maxIndex + 1 }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    if (intervalRef.current) clearInterval(intervalRef.current);
                    setActiveIndex(i);
                  }}
                  className={cn(
                    'h-1.5 rounded-full transition-all duration-300',
                    i === activeIndex
                      ? 'w-6 bg-accent-primary'
                      : 'w-1.5 bg-white/20 hover:bg-white/30'
                  )}
                />
              ))}
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
