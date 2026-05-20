'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  MessageCircle,
  Send,
  Instagram,
  Twitter,
} from 'lucide-react';

const quickLinks = [
  { label: 'Services', href: '/#services' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'About Us', href: '/about' },
  { label: 'Blog', href: '/blog' },
  { label: 'FAQ', href: '/faq' },
  { label: 'Contact', href: '/contact' },
];

const legalLinks = [
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms of Service', href: '/terms' },
  { label: 'NDA Agreement', href: '/nda' },
  { label: 'Refund Policy', href: '/terms#refunds' },
];

const socialLinks = [
  { label: 'WhatsApp', href: '#', icon: MessageCircle },
  { label: 'Discord', href: '#', icon: Send },
  { label: 'Telegram', href: '#', icon: Send },
  { label: 'Instagram', href: '#', icon: Instagram },
  { label: 'Twitter / X', href: '#', icon: Twitter },
];

export default function Footer() {
  return (
    <footer className="relative border-t border-white/[0.06] bg-bg-secondary">
      <div className="section-container section-padding py-12 md:py-16">
        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <Image
                src="/assets/logos/logo.png"
                alt="The Market Architects"
                width={32}
                height={32}
              />
              <span className="text-sm font-heading font-bold tracking-wide">
                THE MARKET <span className="text-accent-primary">ARCHITECTS</span>
              </span>
            </Link>
            <p className="text-sm text-text-tertiary leading-relaxed max-w-xs">
              Professional prop firm challenge passing and funded account management.
              Get funded without the stress.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-4">
              Quick Links
            </h4>
            <ul className="space-y-2.5">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-text-tertiary hover:text-text-primary transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-4">
              Legal
            </h4>
            <ul className="space-y-2.5">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-text-tertiary hover:text-text-primary transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-4">
              Connect
            </h4>
            <ul className="space-y-2.5">
              {socialLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2.5 text-sm text-text-tertiary hover:text-accent-primary transition-colors duration-200 group"
                  >
                    <link.icon className="h-4 w-4 group-hover:drop-shadow-[0_0_6px_rgba(230,57,70,0.5)] transition-all" />
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-text-tertiary">
            &copy; {new Date().getFullYear()} The Market Architects. All rights reserved.
          </p>
          <p className="text-xs text-text-tertiary">
            Built by{' '}
            <span className="text-accent-primary font-medium">
              The Market Architects
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
}
