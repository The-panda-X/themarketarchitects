import type { Metadata } from 'next';
import { Inter, Space_Grotesk, JetBrains_Mono, Playfair_Display } from 'next/font/google';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/next';
import Providers from '@/components/providers/Providers';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  style: ['normal', 'italic'],
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
  title: {
    default: 'The Market Architects — Professional Prop Firm Challenge Passing',
    template: '%s | The Market Architects',
  },
  description:
    'Professional prop firm challenge passing and funded account management. 2,500+ challenges passed with a 94% success rate. Get funded without the stress.',
  keywords: [
    'prop firm challenge passing',
    'funded account',
    'FTMO challenge',
    'prop trading',
    'funded trader',
    'account management',
    'forex trading',
  ],
  authors: [{ name: 'The Market Architects' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'The Market Architects',
    title: 'The Market Architects — Professional Prop Firm Challenge Passing',
    description:
      'Professional prop firm challenge passing and funded account management. Get funded without the stress.',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The Market Architects',
    description:
      'Professional prop firm challenge passing and funded account management.',
    images: ['/og-image.png'],
  },
  icons: {
    icon: '/assets/logos/logo-icon.png',
    shortcut: '/assets/logos/logo-icon.png',
    apple: '/assets/logos/logo-icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} ${playfairDisplay.variable}`}
    >
      <body className="min-h-screen bg-bg-primary font-sans text-text-primary antialiased">
        <Providers>{children}</Providers>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
