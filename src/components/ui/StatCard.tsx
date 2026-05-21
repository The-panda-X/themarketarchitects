'use client';

import { cn } from '@/lib/utils';
import GlassCard from './GlassCard';

interface StatCardProps {
  label: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon?: React.ReactNode;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export default function StatCard({
  label,
  value,
  change,
  changeType = 'neutral',
  icon,
  prefix,
  suffix,
  className,
}: StatCardProps) {
  return (
    <GlassCard hover padding="none" className={cn('flex items-start justify-between p-3 sm:p-5', className)}>
      <div className="space-y-0.5 sm:space-y-1 min-w-0">
        <p className="text-[10px] sm:text-xs font-medium text-text-tertiary uppercase tracking-wider truncate">
          {label}
        </p>
        <p className="text-lg sm:text-2xl font-bold font-mono text-text-primary leading-tight">
          {prefix}
          {value}
          {suffix}
        </p>
        {change && (
          <p
            className={cn(
              'text-[10px] sm:text-xs font-medium',
              changeType === 'positive' && 'text-success',
              changeType === 'negative' && 'text-danger',
              changeType === 'neutral' && 'text-text-tertiary'
            )}
          >
            {change}
          </p>
        )}
      </div>
      {icon && (
        <div className="p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl bg-accent-primary/10 text-accent-primary shrink-0 ml-2">
          <span className="block [&>svg]:h-4 [&>svg]:w-4 sm:[&>svg]:h-5 sm:[&>svg]:w-5">{icon}</span>
        </div>
      )}
    </GlassCard>
  );
}
