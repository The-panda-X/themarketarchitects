import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'line' | 'circle' | 'card';
}

export default function Skeleton({ className, variant = 'line' }: SkeletonProps) {
  const base = 'animate-pulse bg-white/[0.06] rounded';

  if (variant === 'circle') {
    return <div className={cn(base, 'rounded-full h-10 w-10', className)} />;
  }

  if (variant === 'card') {
    return (
      <div className={cn('rounded-2xl border border-white/[0.06] p-6 space-y-4', className)}>
        <div className={cn(base, 'h-4 w-3/4 rounded-md')} />
        <div className={cn(base, 'h-3 w-full rounded-md')} />
        <div className={cn(base, 'h-3 w-5/6 rounded-md')} />
        <div className={cn(base, 'h-8 w-1/3 rounded-lg mt-4')} />
      </div>
    );
  }

  return <div className={cn(base, 'h-4 w-full rounded-md', className)} />;
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      <div className="flex gap-4 pb-3 border-b border-white/[0.06]">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-3 flex-1" />
        ))}
      </div>
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="flex gap-4 py-2">
          {[...Array(4)].map((_, j) => (
            <Skeleton key={j} className="h-3 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonStatCards({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(count)].map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6 space-y-3"
        >
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-7 w-24" />
          <Skeleton className="h-2 w-16" />
        </div>
      ))}
    </div>
  );
}
