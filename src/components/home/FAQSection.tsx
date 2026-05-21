'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { HOMEPAGE_FAQ } from '@/lib/constants';
import ScrollReveal from '@/components/effects/ScrollReveal';
import { cn } from '@/lib/utils';
import SectionBadge from '@/components/ui/SectionBadge';

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="py-20 md:py-28 gradient-mesh-bg">
      <div className="section-container section-padding">
        <ScrollReveal>
          <div className="text-center mb-14">
            <SectionBadge>FAQ</SectionBadge>
            <h2 className="font-heading font-bold text-4xl md:text-5xl lg:text-6xl text-white leading-tight">
              Frequently <span className="text-gradient-red">Asked Questions</span>
            </h2>
            <p className="mt-4 text-text-secondary text-lg max-w-2xl mx-auto leading-relaxed">
              Everything you need to know about our services.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal>
          <div className="max-w-3xl mx-auto space-y-3">
            {HOMEPAGE_FAQ.map((faq, i) => {
              const isOpen = openIndex === i;

              return (
                <div
                  key={i}
                  className={cn(
                    'glass-card overflow-hidden transition-colors duration-200',
                    isOpen && 'border-[rgba(230,57,70,0.20)]'
                  )}
                >
                  <button
                    onClick={() => setOpenIndex(isOpen ? null : i)}
                    className="w-full flex items-center justify-between gap-4 px-6 py-4 text-left"
                  >
                    <span
                      className={cn(
                        'text-sm font-medium transition-colors',
                        isOpen ? 'text-text-primary' : 'text-text-secondary'
                      )}
                    >
                      {faq.question}
                    </span>
                    <motion.div
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="shrink-0"
                    >
                      <ChevronDown
                        className={cn(
                          'h-4 w-4 transition-colors',
                          isOpen ? 'text-accent-primary' : 'text-text-tertiary'
                        )}
                      />
                    </motion.div>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                      >
                        <div className="px-6 pb-4">
                          <p className="text-sm text-text-tertiary leading-relaxed">
                            {faq.answer}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
