'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showValue?: boolean;
  color?: 'red' | 'green' | 'blue' | 'gold' | 'gradient';
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  glow?: boolean;
  className?: string;
}

const colorStyles = {
  red: 'bg-accent-primary',
  green: 'bg-success',
  blue: 'bg-blue-500',
  gold: 'bg-accent-gold',
  gradient: 'bg-gradient-to-r from-accent-primary to-accent-hover',
};

const glowStyles = {
  red: 'shadow-[0_0_12px_rgba(230,57,70,0.5)]',
  green: 'shadow-[0_0_12px_rgba(0,200,83,0.5)]',
  blue: 'shadow-[0_0_12px_rgba(59,130,246,0.5)]',
  gold: 'shadow-[0_0_12px_rgba(212,175,55,0.5)]',
  gradient: 'shadow-[0_0_12px_rgba(230,57,70,0.5)]',
};

const sizeStyles = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-4',
};

export default function ProgressBar({
  value,
  max = 100,
  label,
  showValue = false,
  color = 'red',
  size = 'md',
  animated = true,
  glow = false,
  className,
}: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className={cn('w-full', className)}>
      {(label || showValue) && (
        <div className="flex items-center justify-between mb-1.5">
          {label && <span className="text-xs text-text-secondary">{label}</span>}
          {showValue && (
            <span className="text-xs font-mono text-text-tertiary">
              {percentage.toFixed(0)}%
            </span>
          )}
        </div>
      )}
      <div
        className={cn(
          'w-full rounded-full overflow-hidden bg-white/[0.06]',
          sizeStyles[size]
        )}
      >
        <motion.div
          className={cn(
            'h-full rounded-full',
            colorStyles[color],
            glow && glowStyles[color]
          )}
          initial={animated ? { width: 0 } : undefined}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}
