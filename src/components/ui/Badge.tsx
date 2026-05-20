'use client';

import { cn } from '@/lib/utils';

type BadgeVariant = 'default' | 'red' | 'green' | 'yellow' | 'blue' | 'purple' | 'gold' | 'outline';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  dot?: boolean;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-white/10 text-text-secondary border-white/10',
  red: 'bg-accent-primary/10 text-accent-primary border-accent-primary/20',
  green: 'bg-success/10 text-success border-success/20',
  yellow: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20',
  blue: 'bg-blue-400/10 text-blue-400 border-blue-400/20',
  purple: 'bg-purple-400/10 text-purple-400 border-purple-400/20',
  gold: 'bg-accent-gold/10 text-accent-gold border-accent-gold/30',
  outline: 'bg-transparent text-text-secondary border-white/20',
};

export default function Badge({
  children,
  variant = 'default',
  size = 'sm',
  dot = false,
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 border rounded-full font-medium',
        size === 'sm' ? 'px-2.5 py-0.5 text-[11px]' : 'px-3 py-1 text-xs',
        variantStyles[variant],
        className
      )}
    >
      {dot && (
        <span
          className={cn(
            'h-1.5 w-1.5 rounded-full',
            variant === 'red' && 'bg-accent-primary',
            variant === 'green' && 'bg-success',
            variant === 'yellow' && 'bg-yellow-400',
            variant === 'blue' && 'bg-blue-400',
            variant === 'purple' && 'bg-purple-400',
            variant === 'gold' && 'bg-accent-gold',
            (variant === 'default' || variant === 'outline') && 'bg-text-secondary'
          )}
        />
      )}
      {children}
    </span>
  );
}
