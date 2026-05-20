'use client';

import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'strong' | 'subtle';
  hover?: boolean;
  glow?: 'red' | 'gold' | 'none';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const variantStyles = {
  default: 'bg-[#0d0303] backdrop-blur-xl border border-accent-primary/25 glass-shine',
  strong:  'bg-[#120404] backdrop-blur-2xl border border-accent-primary/30 glass-shine',
  subtle:  'bg-[#0a0202] backdrop-blur-lg  border border-accent-primary/15 glass-shine',
};

const paddingStyles = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  (
    {
      className,
      variant = 'default',
      hover = false,
      glow = 'none',
      padding = 'md',
      children,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-2xl transition-all duration-300 relative overflow-hidden',
          variantStyles[variant],
          paddingStyles[padding],
          hover &&
            'hover:border-accent-primary/50 hover:shadow-[0_0_30px_rgba(230,57,70,0.08)] hover:scale-[1.01] hover:-translate-y-0.5',
          glow === 'red' && hover && 'hover:shadow-glow-sm',
          glow === 'gold' && hover && 'hover:shadow-glow-gold',
          className
        )}
        {...props}
      >
        {/* Radial red glow overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 50% 0%, rgba(230,57,70,0.07) 0%, transparent 70%)',
          }}
        />
        <div className="relative z-10">{children}</div>
      </div>
    );
  }
);

GlassCard.displayName = 'GlassCard';
export default GlassCard;
