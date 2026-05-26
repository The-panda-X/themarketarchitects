'use client';

import type { ReactNode } from 'react';
import QueryProvider from './QueryProvider';
import SessionProvider from './SessionProvider';
import ToastProvider from './ToastProvider';
import LoginTracker from './LoginTracker';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <QueryProvider>
        <ToastProvider>
          <LoginTracker />
          {children}
        </ToastProvider>
      </QueryProvider>
    </SessionProvider>
  );
}
