'use client';

import { useSession } from 'next-auth/react';
import type { Role } from '@/types';

interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  image: string | null;
}

export default function useAuth() {
  const { data: session, status } = useSession();

  const user = session?.user as AuthUser | undefined;

  return {
    user: user ?? null,
    isAuthenticated: status === 'authenticated',
    isLoading: status === 'loading',
    isAdmin: user?.role === 'ADMIN',
    session,
    status,
  };
}
