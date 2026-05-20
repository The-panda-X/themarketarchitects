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
  default: 'bg-white/[0.05] backdrop-blur-xl border border-white/[0.08]',
  strong: 'bg-white/[0.08] backdrop-blur-2xl border border-white/[0.12]',
  subtle: 'bg-white/[0.03] backdrop-blur-lg border border-white/[0.05]',
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
          'rounded-2xl transition-all duration-300',
          variantStyles[variant],
          paddingStyles[padding],
          hover &&
            'hover:bg-white/[0.08] hover:border-white/[0.15] hover:scale-[1.01] hover:-translate-y-0.5',
          glow === 'red' && hover && 'hover:shadow-glow-sm',
          glow === 'gold' && hover && 'hover:shadow-glow-gold',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

GlassCard.displayName = 'GlassCard';
export default GlassCard;
