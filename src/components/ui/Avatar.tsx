'use client';

import Image from 'next/image';
import { cn, getInitials } from '@/lib/utils';

interface AvatarProps {
  src?: string | null;
  name?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeStyles = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-xl',
};

const imageSizes = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 48,
  xl: 64,
};

export default function Avatar({ src, name, size = 'md', className }: AvatarProps) {
  const initials = getInitials(name ?? null);

  if (src) {
    return (
      <div
        className={cn(
          'relative shrink-0 rounded-full overflow-hidden border border-[rgba(230,57,70,0.30)]',
          sizeStyles[size],
          className
        )}
      >
        <Image
          src={src}
          alt={name || 'Avatar'}
          width={imageSizes[size]}
          height={imageSizes[size]}
          className="object-cover w-full h-full"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'shrink-0 rounded-full flex items-center justify-center font-semibold',
        'bg-accent-primary/20 text-accent-primary border border-[rgba(230,57,70,0.20)]',
        sizeStyles[size],
        className
      )}
    >
      {initials}
    </div>
  );
}
