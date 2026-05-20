'use client';

import type { ReactNode } from 'react';
import QueryProvider from './QueryProvider';
import SessionProvider from './SessionProvider';
import ToastProvider from './ToastProvider';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <QueryProvider>
        <ToastProvider>{children}</ToastProvider>
      </QueryProvider>
    </SessionProvider>
  );
}
