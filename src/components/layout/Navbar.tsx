'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import MobileNav from './MobileNav';

const NAV_LINKS = [
  { label: 'Home',     href: '/' },
  { label: 'Services', href: '/services' },
  { label: 'Pricing',  href: '/pricing' },
  { label: 'About',    href: '/about' },
  { label: 'Blog',     href: '/blog' },
  { label: 'Contact',  href: '/contact' },
];

export default function Navbar() {
  const [scrolled, setScrolled]     = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname  = usePathname();
  const { data: session } = useSession();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  return (
    <>
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0,   opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-500',
          scrolled
            ? 'bg-black/85 backdrop-blur-xl border-b border-white/[0.06] py-3'
            : 'bg-transparent py-5'
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">

          {/* ── Logo ── */}
          <Link href="/" className="flex items-center gap-3 group shrink-0">
            <div className="transition-all duration-300 group-hover:drop-shadow-[0_0_14px_rgba(230,57,70,0.8)] group-hover:scale-105">
              <Image
                src="/assets/logos/logo.png"
                alt="The Market Architects"
                width={40}
                height={40}
                className="h-10 w-10 object-contain rounded-[10px]"
                priority
              />
            </div>
            <div className="hidden sm:block leading-none">
              <span className="font-heading font-bold text-lg text-white block leading-none">
                THE
              </span>
              <span className="font-heading font-bold text-lg leading-none">
                <span className="text-white">MARKET </span>
                <span className="text-accent-primary">ARCHITECTS</span>
              </span>
            </div>
          </Link>

          {/* ── Desktop nav links ── */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => {
              const isActive =
                pathname === link.href ||
                (link.href !== '/' && pathname.startsWith(link.href));

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                    isActive
                      ? 'text-accent-primary bg-accent-primary/10'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* ── Desktop CTA ── */}
          <div className="hidden md:flex items-center gap-3">
            {session ? (
              <Link href="/dashboard">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg border border-[rgba(230,57,70,0.50)] text-accent-primary bg-transparent transition-all duration-300 hover:bg-[rgba(230,57,70,0.10)] hover:border-[rgba(230,57,70,0.80)] hover:text-red-300 hover:shadow-[0_0_20px_rgba(230,57,70,0.2)] cursor-pointer"
                >
                  Dashboard
                </button>
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors duration-200"
                >
                  Sign In
                </Link>
                <Link href="/dashboard/purchase">
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg text-white transition-all duration-300 cursor-pointer btn-glow-pulse"
                    style={{ background: 'linear-gradient(135deg, #e63946 0%, #c1121f 100%)' }}
                  >
                    Get Started
                  </button>
                </Link>
              </>
            )}
          </div>

          {/* ── Mobile hamburger ── */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-zinc-400 hover:text-white transition-colors"
            aria-label="Toggle menu"
          >
            <motion.div
              key={mobileOpen ? 'open' : 'closed'}
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0,   opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </motion.div>
          </button>

        </div>
      </motion.nav>

      <MobileNav isOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  );
}
