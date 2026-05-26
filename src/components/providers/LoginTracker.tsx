'use client';

import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';

/**
 * Fires a single POST to /api/auth/track-login when a user is authenticated.
 * Runs once per session (not on every page nav).
 */
export default function LoginTracker() {
  const { status } = useSession();
  const tracked = useRef(false);

  useEffect(() => {
    if (status === 'authenticated' && !tracked.current) {
      tracked.current = true;
      fetch('/api/auth/track-login', { method: 'POST' }).catch(() => {});
    }
  }, [status]);

  return null;
}
