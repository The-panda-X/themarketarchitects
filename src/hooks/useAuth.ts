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

const ADMIN_ROLES: string[] = ['HEAD_ADMIN', 'ADMIN', 'MODERATOR', 'TRADER'];

export default function useAuth() {
  const { data: session, status } = useSession();

  const user = session?.user as AuthUser | undefined;
  const role = user?.role ?? 'USER';

  return {
    user: user ?? null,
    isAuthenticated: status === 'authenticated',
    isLoading: status === 'loading',
    role,
    isHeadAdmin: role === 'HEAD_ADMIN',
    isAdmin: role === 'ADMIN' || role === 'HEAD_ADMIN',
    isModerator: role === 'MODERATOR',
    isTrader: role === 'TRADER',
    isStaff: ADMIN_ROLES.includes(role),
    canDelete: role === 'HEAD_ADMIN',
    canViewSensitive: role === 'HEAD_ADMIN' || role === 'ADMIN',
    session,
    status,
  };
}
