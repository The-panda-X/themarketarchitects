import { cn } from '@/lib/utils';

interface SectionBadgeProps {
  children: React.ReactNode;
  className?: string;
}

export default function SectionBadge({ children, className }: SectionBadgeProps) {
  return (
    <span
      className={cn(
        'inline-block text-xs font-semibold tracking-[0.3em] text-accent-primary uppercase mb-3 px-3 py-1 rounded-full border border-[rgba(230,57,70,0.20)] bg-[rgba(230,57,70,0.05)]',
        className
      )}
    >
      {children}
    </span>
  );
}
