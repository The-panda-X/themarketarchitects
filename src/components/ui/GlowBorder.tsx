'use client';

import { cn } from '@/lib/utils';

interface GlowBorderProps {
  children: React.ReactNode;
  color?: 'red' | 'gold' | 'blue';
  animated?: boolean;
  className?: string;
  innerClassName?: string;
}

export default function GlowBorder({
  children,
  color = 'red',
  animated = true,
  className,
  innerClassName,
}: GlowBorderProps) {
  const gradientColors = {
    red: 'from-accent-primary via-transparent to-accent-primary',
    gold: 'from-accent-gold via-transparent to-accent-gold',
    blue: 'from-blue-500 via-transparent to-blue-500',
  };

  return (
    <div className={cn('relative rounded-2xl p-[1px]', className)}>
      <div
        className={cn(
          'absolute inset-0 rounded-2xl bg-gradient-to-r opacity-50',
          gradientColors[color],
          animated && 'animate-pulse-glow'
        )}
      />
      <div
        className={cn(
          'relative rounded-2xl bg-bg-card/90 backdrop-blur-xl',
          innerClassName
        )}
      >
        {children}
      </div>
    </div>
  );
}
