import type { LiveNotification } from '@/types';

export const SITE_CONFIG = {
  name: 'The Market Architects',
  description:
    'Professional prop firm challenge passing and funded account management. Get funded without the stress.',
  url: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
  ogImage: '/og-image.png',
  email: 'support@themarketarchitects.com',
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '',
  discord: process.env.NEXT_PUBLIC_DISCORD_INVITE ?? '',
} as const;

export const CRYPTO_WALLETS = [
  {
    id: 'usdt_bsc',
    name: 'USDT',
    network: 'BEP-20 (BSC)',
    symbol: 'USDT',
    address: '0x10420285208e762fa7aedbcd8d6e642c810e6fd9',
    icon: '₮',
    note: 'Send only USDT on BEP-20 (Binance Smart Chain) network',
  },
  {
    id: 'usdt_trc20',
    name: 'USDT',
    network: 'TRC-20 (Tron)',
    symbol: 'USDT',
    address: 'TRZX7U9gjYQDeQubsX3T3c89bn3MdUqkCd',
    icon: '₮',
    note: 'Send only USDT on TRC-20 (Tron) network',
  },
  {
    id: 'usdt_erc20',
    name: 'USDT',
    network: 'ERC-20 (Ethereum)',
    symbol: 'USDT',
    address: '0x10420285208e762fa7aedbcd8d6e642c810e6fd9',
    icon: '₮',
    note: 'Send only USDT on ERC-20 (Ethereum) network',
  },
] as const;

export const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Services', href: '/services' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'About', href: '/about' },
  { label: 'Blog', href: '/blog' },
  { label: 'Contact', href: '/contact' },
] as const;

export const TRADING_PLATFORMS = ['MetaTrader 4', 'MetaTrader 5', 'cTrader', 'TradingView', 'Other'] as const;

export const LIVE_NOTIFICATIONS: LiveNotification[] = [
  { id: '1', name: 'John D.', action: 'passed a $200K FTMO challenge', amount: '$200,000', timestamp: '2 min ago' },
  { id: '2', name: 'Sarah M.', action: 'received funded account', amount: '$100,000', timestamp: '5 min ago' },
  { id: '3', name: 'Alex K.', action: 'passed Phase 1', amount: '$50,000', timestamp: '8 min ago' },
  { id: '4', name: 'Michael R.', action: 'started Elite challenge', amount: '$300,000', timestamp: '12 min ago' },
  { id: '5', name: 'Emma L.', action: 'passed a $100K FundedNext challenge', amount: '$100,000', timestamp: '15 min ago' },
  { id: '6', name: 'David W.', action: 'received $4,200 payout', amount: '$4,200', timestamp: '18 min ago' },
  { id: '7', name: 'Lisa T.', action: 'passed Phase 2', amount: '$200,000', timestamp: '22 min ago' },
  { id: '8', name: 'James P.', action: 'started Pro challenge', amount: '$100,000', timestamp: '25 min ago' },
];

export const TICKET_PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;
export type TicketPriority = (typeof TICKET_PRIORITIES)[number];
