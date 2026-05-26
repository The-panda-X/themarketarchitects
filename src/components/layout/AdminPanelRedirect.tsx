'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useAuth from '@/hooks/useAuth';
import { getLastPanel } from '@/hooks/useLastPanel';

export default function AdminPanelRedirect() {
  const { isStaff } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isStaff && getLastPanel() === 'admin') {
      router.replace('/admin');
    }
  }, [isStaff, router]);

  return null;
}
