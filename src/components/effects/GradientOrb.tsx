'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GradientOrbProps {
  color?: string;
  size?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'center';
  blur?: number;
  className?: string;
}

const positionStyles = {
  'top-right': '-top-1/4 -right-1/4',
  'top-left': '-top-1/4 -left-1/4',
  'bottom-right': '-bottom-1/4 -right-1/4',
  'bottom-left': '-bottom-1/4 -left-1/4',
  center: 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
};

export default function GradientOrb({
  color = 'rgba(230, 57, 70, 0.15)',
  size = 600,
  position = 'top-right',
  blur = 120,
  className,
}: GradientOrbProps) {
  return (
    <motion.div
      className={cn(
        'absolute rounded-full pointer-events-none',
        positionStyles[position],
        className
      )}
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        filter: `blur(${blur}px)`,
      }}
      animate={{
        scale: [1, 1.05, 1],
        opacity: [0.5, 0.8, 0.5],
      }}
      transition={{
        duration: 8,
        ease: 'easeInOut',
        repeat: Infinity,
      }}
    />
  );
}
