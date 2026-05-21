'use client';

import Link from 'next/link';
import Image from 'next/image';
import { MessageCircle, Send, Instagram, Twitter } from 'lucide-react';

const quickLinks = [
  { label: 'Services', href: '/services' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'About', href: '/about' },
  { label: 'Blog', href: '/blog' },
  { label: 'Contact', href: '/contact' },
];

const legalLinks = [
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms of Service', href: '/terms' },
  { label: 'Refund Policy', href: '/terms#refunds' },
  { label: 'NDA Agreement', href: '/nda' },
];

const socialLinks = [
  { label: 'WhatsApp', href: '#', icon: MessageCircle },
  { label: 'Discord', href: '#', icon: Send },
  { label: 'Instagram', href: '#', icon: Instagram },
  { label: 'Twitter', href: '#', icon: Twitter },
];

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.06] bg-bg-secondary">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">

        {/* Main row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">

          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-2">
              <Image src="/assets/logos/logo.png" alt="TMA" width={24} height={24} />
              <span className="text-xs font-heading font-bold tracking-wide leading-tight">
                THE MARKET <span className="text-accent-primary">ARCHITECTS</span>
              </span>
            </Link>
            <p className="text-xs text-text-tertiary leading-relaxed max-w-[200px]">
              Professional prop firm challenge passing and funded account management.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <p className="text-[10px] font-semibold text-text-primary uppercase tracking-widest mb-2">
              Links
            </p>
            <ul className="space-y-1.5">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-xs text-text-tertiary hover:text-text-primary transition-colors duration-200">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <p className="text-[10px] font-semibold text-text-primary uppercase tracking-widest mb-2">
              Legal
            </p>
            <ul className="space-y-1.5">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-xs text-text-tertiary hover:text-text-primary transition-colors duration-200">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Connect */}
          <div>
            <p className="text-[10px] font-semibold text-text-primary uppercase tracking-widest mb-2">
              Connect
            </p>
            <ul className="space-y-1.5">
              {socialLinks.map(({ label, href, icon: Icon }) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-xs text-text-tertiary hover:text-accent-primary transition-colors duration-200 group"
                  >
                    <Icon className="h-3.5 w-3.5 group-hover:drop-shadow-[0_0_6px_rgba(230,57,70,0.5)] transition-all" />
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-5 pt-4 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-[11px] text-text-tertiary">
            &copy; {new Date().getFullYear()} The Market Architects. All rights reserved.
          </p>
          <p className="text-[11px] text-text-tertiary">
            Built by <span className="text-accent-primary font-medium">The Market Architects</span>
          </p>
        </div>

      </div>
    </footer>
  );
}
