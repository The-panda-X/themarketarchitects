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
    <GlassCard hover className={cn('flex items-start justify-between', className)}>
      <div className="space-y-1">
        <p className="text-xs font-medium text-text-tertiary uppercase tracking-wider">
          {label}
        </p>
        <p className="text-2xl font-bold font-mono text-text-primary">
          {prefix}
          {value}
          {suffix}
        </p>
        {change && (
          <p
            className={cn(
              'text-xs font-medium',
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
        <div className="p-2.5 rounded-xl bg-accent-primary/10 text-accent-primary">
          {icon}
        </div>
      )}
    </GlassCard>
  );
}
