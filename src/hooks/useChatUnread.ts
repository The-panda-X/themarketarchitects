'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

/** Polls /api/dashboard/chat/unread every 15s and returns the count. */
export default function useChatUnread() {
  const { status } = useSession();
  const [count, setCount] = useState(0);

  const fetch_ = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard/chat/unread');
      if (res.ok) {
        const d = await res.json();
        setCount(d.data?.unread ?? 0);
      }
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    if (status !== 'authenticated') return;
    fetch_();
    const id = setInterval(fetch_, 15_000);
    return () => clearInterval(id);
  }, [status, fetch_]);

  return count;
}
