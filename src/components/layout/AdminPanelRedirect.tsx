'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useAuth from '@/hooks/useAuth';
import { getLastPanel } from '@/hooks/useLastPanel';

export default function AdminPanelRedirect() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user?.role === 'ADMIN' && getLastPanel() === 'admin') {
      router.replace('/admin');
    }
  }, [user, router]);

  return null;
}
