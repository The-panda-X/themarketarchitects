'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { NAV_LINKS } from '@/lib/constants';
import Button from '@/components/ui/Button';
import MobileNav from './MobileNav';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 20);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
          scrolled
            ? 'bg-black/80 backdrop-blur-xl border-b border-white/[0.06]'
            : 'bg-transparent'
        )}
      >
        <div className="section-container">
          <nav className="flex items-center justify-between h-16 md:h-20 section-padding">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
              <div className="relative transition-all duration-300 group-hover:drop-shadow-[0_0_12px_rgba(230,57,70,0.9)] group-hover:scale-110">
                <Image
                  src="/assets/logos/logo.png"
                  alt="The Market Architects"
                  width={36}
                  height={36}
                  className="w-8 h-8 md:w-9 md:h-9"
                />
              </div>
              <span className="hidden sm:block text-sm md:text-base font-heading font-normal tracking-wide text-text-primary">
                THE MARKET{' '}
                <span className="text-accent-primary">ARCHITECTS</span>
              </span>
            </Link>

            {/* Desktop nav */}
            <div className="hidden lg:flex items-center gap-1">
              {NAV_LINKS.map((link) => {
                const isActive =
                  pathname === link.href ||
                  (link.href !== '/' && pathname.startsWith(link.href));

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      'relative px-3.5 py-2 text-sm font-medium transition-colors duration-200 rounded-lg',
                      isActive
                        ? 'text-text-primary'
                        : 'text-text-secondary hover:text-text-primary'
                    )}
                  >
                    {link.label}
                    {isActive && (
                      <motion.div
                        layoutId="nav-active"
                        className="absolute bottom-0 left-3 right-3 h-0.5 bg-accent-primary rounded-full shadow-glow-sm"
                        transition={{
                          type: 'spring',
                          bounce: 0.15,
                          duration: 0.5,
                        }}
                      />
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Desktop CTA */}
            <div className="hidden lg:flex items-center gap-3">
              {session ? (
                <Link href="/dashboard">
                  <Button variant="secondary" size="sm">
                    Dashboard
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="ghost" size="sm">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/dashboard/purchase">
                    <Button variant="primary" size="sm" className="btn-glow-pulse">
                      Get Started
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden relative z-50 p-2 text-text-primary"
              aria-label="Toggle menu"
            >
              <div className="w-5 h-4 flex flex-col justify-between">
                <span
                  className={cn(
                    'block h-0.5 w-5 bg-current transition-all duration-300 origin-center',
                    mobileOpen && 'rotate-45 translate-y-[7px]'
                  )}
                />
                <span
                  className={cn(
                    'block h-0.5 w-5 bg-current transition-all duration-300',
                    mobileOpen && 'opacity-0 scale-0'
                  )}
                />
                <span
                  className={cn(
                    'block h-0.5 w-5 bg-current transition-all duration-300 origin-center',
                    mobileOpen && '-rotate-45 -translate-y-[7px]'
                  )}
                />
              </div>
            </button>
          </nav>
        </div>
      </motion.header>

      <MobileNav isOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  );
}
