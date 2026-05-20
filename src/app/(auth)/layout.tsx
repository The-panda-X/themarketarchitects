import { Suspense } from 'react';
import type { Metadata } from 'next';
import Skeleton from '@/components/ui/Skeleton';

export const metadata: Metadata = {
  title: 'Account',
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen flex items-center justify-center p-4">
      {/* Background */}
      <div className="absolute inset-0 bg-bg-primary" />
      <div className="absolute inset-0 grid-pattern" />
      <div className="absolute inset-0 bg-gradient-to-br from-accent-muted/10 via-transparent to-transparent" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-md">
        <Suspense
          fallback={
            <div className="glass-strong rounded-2xl p-8 space-y-4">
              <Skeleton className="h-12 w-12 rounded-full mx-auto" />
              <Skeleton className="h-5 w-40 mx-auto" />
              <Skeleton className="h-4 w-56 mx-auto" />
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          }
        >
          {children}
        </Suspense>
      </div>
    </div>
  );
}
