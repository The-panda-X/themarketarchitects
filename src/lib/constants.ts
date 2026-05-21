import { ServiceType, type ServicePlan, type PropFirm, type FAQItem, type LiveNotification } from '@/types';

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

export const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Services', href: '/services' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'About', href: '/about' },
  { label: 'Blog', href: '/blog' },
  { label: 'Contact', href: '/contact' },
] as const;

export const CHALLENGE_PASSING_PLANS: ServicePlan[] = [
  {
    id: 'cp-starter',
    name: 'Starter Challenge Pass',
    tier: 'starter',
    serviceType: ServiceType.CHALLENGE_PASSING,
    price: 149,
    originalPrice: 199,
    description: 'Perfect entry point — pass your first prop firm challenge hassle-free.',
    features: [
      'Phase 1 + Phase 2',
      'FTMO / Apex / E8 supported',
      '14-day delivery',
      'Refund guarantee',
    ],
    accountSizes: ['$10,000'],
    successRate: 97,
    deliveryDays: 14,
  },
  {
    id: 'cp-professional',
    name: 'Pro Challenge Pass',
    tier: 'professional',
    serviceType: ServiceType.CHALLENGE_PASSING,
    price: 349,
    originalPrice: 499,
    description: 'Our most popular package. Trusted by 500+ clients.',
    features: [
      'Phase 1 + Phase 2',
      'All major firms',
      'Priority handling',
      'Refund guarantee',
      'Dedicated trader',
    ],
    popular: true,
    accountSizes: ['$50,000'],
    guarantee: '100% pass or money back',
    successRate: 97,
    deliveryDays: 14,
  },
  {
    id: 'cp-elite',
    name: 'Elite Challenge Pass',
    tier: 'elite',
    serviceType: ServiceType.CHALLENGE_PASSING,
    price: 699,
    originalPrice: 999,
    description: 'Large account specialist package for serious traders.',
    features: [
      'Phase 1 + Phase 2',
      'All major firms',
      'VIP support',
      'Refund guarantee',
      'Progress updates',
      'Senior trader',
    ],
    accountSizes: ['$100,000', '$200,000'],
    guarantee: 'Guaranteed pass or 100% refund',
    successRate: 95,
    deliveryDays: 21,
  },
];

export const ACCOUNT_MANAGEMENT_PLANS: ServicePlan[] = [
  {
    id: 'am-starter',
    name: 'Managed Account — Starter',
    tier: 'starter',
    serviceType: ServiceType.ACCOUNT_MANAGEMENT,
    priceLabel: 'Profit Split Only',
    description: 'Let our experts grow your funded account. Pay only from profits.',
    features: [
      '20% profit split',
      'Weekly reporting',
      'Low risk strategy',
      'Full transparency',
    ],
    accountSizes: ['Up to $50K'],
    successRate: 92,
    deliveryDays: 30,
  },
  {
    id: 'am-professional',
    name: 'Managed Account — Pro',
    tier: 'professional',
    serviceType: ServiceType.ACCOUNT_MANAGEMENT,
    priceLabel: 'Profit Split Only',
    description: 'Our premium management service for larger funded accounts.',
    features: [
      '15% profit split',
      'Daily reporting',
      'Dedicated manager',
      'Risk dashboard',
      'Monthly review call',
    ],
    popular: true,
    accountSizes: ['$50K–$200K'],
    successRate: 94,
    deliveryDays: 30,
  },
];

export const ACCOUNT_GROWTH_PLANS: ServicePlan[] = [
  {
    id: 'ag-standard',
    name: 'Account Growth Plan',
    tier: 'professional',
    serviceType: ServiceType.ACCOUNT_GROWTH,
    price: 249,
    originalPrice: 349,
    description: 'Systematic account growth to maximize your capital over time.',
    features: [
      'Structured scaling',
      'Compounding strategy',
      'Monthly targets',
      'Full reporting',
      'No drawdown risk',
    ],
    accountSizes: ['Any size'],
    successRate: 96,
    deliveryDays: 30,
  },
];

export const PROP_FIRMS: PropFirm[] = [
  { id: 'ftmo', name: 'FTMO', phases: 2, accountSizes: ['$25,000', '$50,000', '$100,000', '$200,000'] },
  { id: 'mff', name: 'MyForexFunds', phases: 2, accountSizes: ['$50,000', '$100,000', '$200,000'] },
  {
    id: 'fundednext',
    name: 'FundedNext',
    phases: 2,
    accountSizes: ['$25,000', '$50,000', '$100,000', '$200,000'],
  },
  { id: 'trueforex', name: 'True Forex Funds', phases: 2, accountSizes: ['$50,000', '$100,000', '$200,000'] },
  {
    id: 'thefundedtrader',
    name: 'The Funded Trader',
    phases: 2,
    accountSizes: ['$50,000', '$100,000', '$200,000', '$400,000'],
  },
  { id: 'e8funding', name: 'E8 Funding', phases: 1, accountSizes: ['$25,000', '$50,000', '$100,000', '$250,000'] },
  { id: 'topstep', name: 'TopStep', phases: 1, accountSizes: ['$50,000', '$100,000', '$150,000'] },
  { id: 'other', name: 'Other', phases: 2, accountSizes: ['Custom'] },
];

export const TRADING_PLATFORMS = ['MetaTrader 4', 'MetaTrader 5', 'cTrader', 'TradingView', 'Other'] as const;

export const TRUST_STATS = [
  { label: 'Challenges Passed', value: 2500, suffix: '+', icon: 'Trophy' as const },
  { label: 'Total Payouts', value: 12, suffix: 'M+', prefix: '$', icon: 'DollarSign' as const },
  { label: 'Success Rate', value: 94, suffix: '%', icon: 'TrendingUp' as const },
  { label: 'Active Clients', value: 500, suffix: '+', icon: 'Users' as const },
] as const;

export const HOMEPAGE_FAQ: FAQItem[] = [
  {
    question: 'How does the challenge passing service work?',
    answer:
      'Once you purchase a plan, you securely share your trading account credentials with us. Our team of professional traders will then trade on your behalf to meet all the challenge requirements, including profit targets and risk management rules. You get notified of progress throughout the process.',
  },
  {
    question: 'Is my trading account safe?',
    answer:
      'Absolutely. All credentials are encrypted with AES-256-GCM encryption and stored securely. Our traders follow strict risk management protocols, and we have a proven track record of handling thousands of accounts without incident. We also sign an NDA to protect your information.',
  },
  {
    question: 'What prop firms do you support?',
    answer:
      'We support all major prop firms including FTMO, FundedNext, MyForexFunds, The Funded Trader, E8 Funding, TopStep, and many more. If your firm is not listed, contact us and we can likely accommodate it.',
  },
  {
    question: 'How long does it take to pass a challenge?',
    answer:
      'Completion time varies by plan and account size. Starter plans typically complete in 7–14 days, Professional plans in 5–10 days, and Elite plans are fast-tracked for priority completion. Market conditions may affect timing.',
  },
  {
    question: 'What happens if the challenge fails?',
    answer:
      'If we fail to pass your challenge, you will receive a full retry at no additional cost. Elite plan customers receive a 100% money-back guarantee if we cannot pass the challenge within the agreed timeframe.',
  },
  {
    question: 'Do you offer refunds?',
    answer:
      'Yes. If work has not started on your challenge, you can receive a full refund. Once trading begins, our retry guarantee covers any failures. Elite plan customers are covered by our money-back guarantee.',
  },
  {
    question: 'How do profit splits work with account management?',
    answer:
      'After your account is funded, we trade it and split the profits according to your plan: 70/30 for Basic, 75/25 for Pro, and 80/20 for Elite (you keep the larger share). Payouts are processed monthly.',
  },
  {
    question: 'Can I track the progress of my challenge?',
    answer:
      'Yes! Your dashboard provides real-time progress tracking including current profit/loss, drawdown levels, win rate, daily trade logs, and phase completion status. Professional and Elite plans include proof screenshots.',
  },
  {
    question: 'Is this legal?',
    answer:
      'Yes. Trading on behalf of account holders is a legitimate service. We operate transparently, sign NDAs with all clients, and comply with all applicable regulations. Many professional traders and firms offer similar services.',
  },
  {
    question: 'How do I get started?',
    answer:
      'Simply create an account, choose your service plan and account size, submit your trading credentials through our encrypted form, and complete the payment. Our team will begin working on your challenge within 24 hours.',
  },
];

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
