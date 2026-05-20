'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PartyPopper } from 'lucide-react';
import { LIVE_NOTIFICATIONS } from '@/lib/constants';

export default function LiveNotifications() {
  const [current, setCurrent] = useState<number | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let showTimeout: ReturnType<typeof setTimeout>;
    let hideTimeout: ReturnType<typeof setTimeout>;
    let index = 0;

    function showNext() {
      setCurrent(index);
      setVisible(true);

      hideTimeout = setTimeout(() => {
        setVisible(false);

        showTimeout = setTimeout(() => {
          index = (index + 1) % LIVE_NOTIFICATIONS.length;
          showNext();
        }, 2000);
      }, 4000);
    }

    const initialDelay = setTimeout(() => showNext(), 3000);

    return () => {
      clearTimeout(initialDelay);
      clearTimeout(showTimeout);
      clearTimeout(hideTimeout);
    };
  }, []);

  const notification = current !== null ? LIVE_NOTIFICATIONS[current] : null;

  return (
    <div className="fixed bottom-4 left-4 z-40 max-w-xs">
      <AnimatePresence>
        {visible && notification && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="glass-card p-4 border-success/20 shadow-lg"
          >
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-success/10 flex items-center justify-center shrink-0">
                <PartyPopper className="h-4 w-4 text-success" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-text-primary font-medium">
                  {notification.name}{' '}
                  <span className="text-text-secondary font-normal">
                    {notification.action}
                  </span>
                </p>
                <p className="text-xs text-text-tertiary mt-0.5">
                  {notification.timestamp}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
