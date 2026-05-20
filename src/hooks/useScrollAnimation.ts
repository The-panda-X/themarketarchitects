'use client';

import { useRef } from 'react';
import { useInView, useScroll, useTransform, type MotionValue } from 'framer-motion';

export function useScrollReveal(margin = '-100px') {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: margin as `${number}px` });
  return { ref, isInView };
}

export function useParallax(distance = 50): {
  ref: React.RefObject<HTMLDivElement>;
  y: MotionValue<number>;
} {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  const y = useTransform(scrollYProgress, [0, 1], [distance, -distance]);
  return { ref, y };
}

export function useScrollProgress(): {
  ref: React.RefObject<HTMLDivElement>;
  progress: MotionValue<number>;
} {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  return { ref, progress: scrollYProgress };
}
