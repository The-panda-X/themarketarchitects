'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NAV_LINKS } from '@/lib/constants';
import Button from '@/components/ui/Button';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-40 lg:hidden"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={onClose} />

          {/* Menu content */}
          <nav className="relative z-10 flex flex-col items-center justify-center h-full px-6">
            <div className="flex flex-col items-center gap-2 w-full max-w-xs">
              {NAV_LINKS.map((link, i) => {
                const isActive =
                  pathname === link.href ||
                  (link.href !== '/' && pathname.startsWith(link.href));

                return (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ delay: i * 0.06, duration: 0.3 }}
                    className="w-full"
                  >
                    <Link
                      href={link.href}
                      onClick={onClose}
                      className={cn(
                        'block w-full text-center py-3 text-xl font-medium rounded-xl transition-all duration-200',
                        isActive
                          ? 'text-accent-primary bg-accent-primary/5'
                          : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
                      )}
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                );
              })}

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ delay: NAV_LINKS.length * 0.06, duration: 0.3 }}
                className="flex flex-col gap-3 w-full mt-6 pt-6 border-t border-white/[0.06]"
              >
                {session ? (
                  <>
                    <Link href="/dashboard" onClick={onClose}>
                      <Button variant="primary" fullWidth glow>
                        Dashboard
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      fullWidth
                      icon={<LogOut className="h-4 w-4" />}
                      onClick={() => { onClose(); signOut({ callbackUrl: '/login' }); }}
                      className="text-text-tertiary hover:text-danger hover:bg-danger/5"
                    >
                      Logout
                    </Button>
                  </>
                ) : (
                  <>
                    <Link href="/login" onClick={onClose}>
                      <Button variant="secondary" fullWidth>
                        Login
                      </Button>
                    </Link>
                    <Link href="/register" onClick={onClose}>
                      <Button variant="primary" fullWidth glow>
                        Get Started
                      </Button>
                    </Link>
                  </>
                )}
              </motion.div>
            </div>
          </nav>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
