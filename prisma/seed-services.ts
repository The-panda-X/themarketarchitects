/**
 * Seed script to migrate hardcoded constants into the database.
 * Run: npx tsx prisma/seed-services.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding service plans...');

  // ── Service Plans ──
  const plans = [
    {
      id: 'cp-starter',
      name: 'Starter Challenge Pass',
      tier: 'starter',
      serviceType: 'CHALLENGE_PASSING',
      price: 149,
      originalPrice: 199,
      description: 'Perfect entry point — pass your first prop firm challenge hassle-free.',
      features: ['Phase 1 + Phase 2', 'FTMO / Apex / E8 supported', '14-day delivery', 'Refund guarantee'],
      accountSizes: ['$10,000'],
      successRate: 97,
      deliveryDays: 14,
      sortOrder: 1,
    },
    {
      id: 'cp-professional',
      name: 'Pro Challenge Pass',
      tier: 'professional',
      serviceType: 'CHALLENGE_PASSING',
      price: 349,
      originalPrice: 499,
      description: 'Our most popular package. Trusted by 500+ clients.',
      features: ['Phase 1 + Phase 2', 'All major firms', 'Priority handling', 'Refund guarantee', 'Dedicated trader'],
      popular: true,
      accountSizes: ['$50,000'],
      guarantee: '100% pass or money back',
      successRate: 97,
      deliveryDays: 14,
      sortOrder: 2,
    },
    {
      id: 'cp-elite',
      name: 'Elite Challenge Pass',
      tier: 'elite',
      serviceType: 'CHALLENGE_PASSING',
      price: 699,
      originalPrice: 999,
      description: 'Large account specialist package for serious traders.',
      features: ['Phase 1 + Phase 2', 'All major firms', 'VIP support', 'Refund guarantee', 'Progress updates', 'Senior trader'],
      accountSizes: ['$100,000', '$200,000'],
      guarantee: 'Guaranteed pass or 100% refund',
      successRate: 95,
      deliveryDays: 21,
      sortOrder: 3,
    },
    {
      id: 'am-starter',
      name: 'Managed Account — Starter',
      tier: 'starter',
      serviceType: 'ACCOUNT_MANAGEMENT',
      priceLabel: 'Profit Split Only',
      description: 'Let our experts grow your funded account. Pay only from profits.',
      features: ['20% profit split', 'Weekly reporting', 'Low risk strategy', 'Full transparency'],
      accountSizes: ['Up to $50K'],
      successRate: 92,
      deliveryDays: 30,
      sortOrder: 4,
    },
    {
      id: 'am-professional',
      name: 'Managed Account — Pro',
      tier: 'professional',
      serviceType: 'ACCOUNT_MANAGEMENT',
      priceLabel: 'Profit Split Only',
      description: 'Our premium management service for larger funded accounts.',
      features: ['15% profit split', 'Daily reporting', 'Dedicated manager', 'Risk dashboard', 'Monthly review call'],
      popular: true,
      accountSizes: ['$50K–$200K'],
      successRate: 94,
      deliveryDays: 30,
      sortOrder: 5,
    },
    {
      id: 'ag-standard',
      name: 'Account Growth Plan',
      tier: 'professional',
      serviceType: 'ACCOUNT_GROWTH',
      price: 249,
      originalPrice: 349,
      description: 'Systematic account growth to maximize your capital over time.',
      features: ['Structured scaling', 'Compounding strategy', 'Monthly targets', 'Full reporting', 'No drawdown risk'],
      accountSizes: ['Any size'],
      successRate: 96,
      deliveryDays: 30,
      sortOrder: 6,
    },
  ];

  for (const plan of plans) {
    await prisma.servicePlan.upsert({
      where: { id: plan.id },
      update: plan,
      create: { ...plan, isActive: true },
    });
  }
  console.log(`  ✓ ${plans.length} plans seeded`);

  // ── Prop Firms ──
  const firms = [
    { id: 'ftmo', name: 'FTMO', phases: 2, accountSizes: ['$10,000', '$25,000', '$50,000', '$100,000', '$200,000'], sortOrder: 1 },
    { id: 'fundednext', name: 'FundedNext', phases: 2, accountSizes: ['$6,000', '$25,000', '$50,000', '$100,000', '$200,000'], sortOrder: 2 },
    { id: 'thefundedtrader', name: 'The Funded Trader', phases: 2, accountSizes: ['$5,000', '$10,000', '$25,000', '$50,000', '$100,000', '$200,000'], sortOrder: 3 },
    { id: 'e8markets', name: 'E8 Markets', phases: 2, accountSizes: ['$5,000', '$10,000', '$25,000', '$50,000', '$100,000', '$200,000', '$250,000'], sortOrder: 4 },
    { id: 'fundingpips', name: 'Funding Pips', phases: 2, accountSizes: ['$5,000', '$10,000', '$25,000', '$50,000', '$100,000', '$200,000'], sortOrder: 5 },
    { id: 'alphacapital', name: 'Alpha Capital', phases: 2, accountSizes: ['$5,000', '$10,000', '$25,000', '$50,000', '$100,000', '$200,000'], sortOrder: 6 },
    { id: 'apextrader', name: 'Apex Trader Funding', phases: 1, accountSizes: ['$25,000', '$50,000', '$100,000', '$150,000'], sortOrder: 7 },
    { id: 'other', name: 'Other', phases: 2, accountSizes: ['$5,000', '$10,000', '$25,000', '$50,000', '$100,000', '$200,000', '$300,000', '$400,000', 'Custom'], sortOrder: 8 },
  ];

  for (const firm of firms) {
    await prisma.propFirm.upsert({
      where: { id: firm.id },
      update: firm,
      create: { ...firm, isActive: true },
    });
  }
  console.log(`  ✓ ${firms.length} firms seeded`);

  // ── FAQ Items ──
  const faqs = [
    { id: 'faq-1', question: 'How does the challenge passing service work?', answer: 'Once you purchase a plan, you securely share your trading account credentials with us. Our team of professional traders will then trade on your behalf to meet all the challenge requirements, including profit targets and risk management rules. You get notified of progress throughout the process.', sortOrder: 1 },
    { id: 'faq-2', question: 'Is my trading account safe?', answer: 'Absolutely. All credentials are encrypted with AES-256-GCM encryption and stored securely. Our traders follow strict risk management protocols, and we have a proven track record of handling thousands of accounts without incident. We also sign an NDA to protect your information.', sortOrder: 2 },
    { id: 'faq-3', question: 'What prop firms do you support?', answer: 'We support all major prop firms including FTMO, FundedNext, The Funded Trader, E8 Markets, Funding Pips, Alpha Capital, Apex Trader Funding, and many more. If your firm is not listed, select "Other" during checkout and contact us — we can likely accommodate it.', sortOrder: 3 },
    { id: 'faq-4', question: 'How long does it take to pass a challenge?', answer: 'Completion time varies by plan and account size. Starter plans typically complete in 7–14 days, Professional plans in 5–10 days, and Elite plans are fast-tracked for priority completion. Market conditions may affect timing.', sortOrder: 4 },
    { id: 'faq-5', question: 'What happens if the challenge fails?', answer: 'If we fail to pass your challenge, you will receive a full retry at no additional cost. Elite plan customers receive a 100% money-back guarantee if we cannot pass the challenge within the agreed timeframe.', sortOrder: 5 },
    { id: 'faq-6', question: 'Do you offer refunds?', answer: 'Yes. If work has not started on your challenge, you can receive a full refund. Once trading begins, our retry guarantee covers any failures. Elite plan customers are covered by our money-back guarantee.', sortOrder: 6 },
    { id: 'faq-7', question: 'How do profit splits work with account management?', answer: 'After your account is funded, we trade it and split the profits according to your plan: 70/30 for Basic, 75/25 for Pro, and 80/20 for Elite (you keep the larger share). Payouts are processed monthly.', sortOrder: 7 },
    { id: 'faq-8', question: 'Can I track the progress of my challenge?', answer: 'Yes! Your dashboard provides real-time progress tracking including current profit/loss, drawdown levels, win rate, daily trade logs, and phase completion status. Professional and Elite plans include proof screenshots.', sortOrder: 8 },
    { id: 'faq-9', question: 'Is this legal?', answer: 'Yes. Trading on behalf of account holders is a legitimate service. We operate transparently, sign NDAs with all clients, and comply with all applicable regulations. Many professional traders and firms offer similar services.', sortOrder: 9 },
    { id: 'faq-10', question: 'How do I get started?', answer: 'Simply create an account, choose your service plan and account size, submit your trading credentials through our encrypted form, and complete the payment. Our team will begin working on your challenge within 24 hours.', sortOrder: 10 },
  ];

  for (const faq of faqs) {
    await prisma.fAQItem.upsert({
      where: { id: faq.id },
      update: faq,
      create: { ...faq, isActive: true },
    });
  }
  console.log(`  ✓ ${faqs.length} FAQ items seeded`);

  // ── Trust Stats ──
  const stats = [
    { id: 'stat-1', label: 'Challenges Passed', value: 2500, suffix: '+', icon: 'Trophy', sortOrder: 1 },
    { id: 'stat-2', label: 'Total Payouts', value: 12, suffix: 'M+', prefix: '$', icon: 'DollarSign', sortOrder: 2 },
    { id: 'stat-3', label: 'Success Rate', value: 94, suffix: '%', icon: 'TrendingUp', sortOrder: 3 },
    { id: 'stat-4', label: 'Active Clients', value: 500, suffix: '+', icon: 'Users', sortOrder: 4 },
  ];

  for (const stat of stats) {
    await prisma.trustStat.upsert({
      where: { id: stat.id },
      update: stat,
      create: stat,
    });
  }
  console.log(`  ✓ ${stats.length} trust stats seeded`);

  console.log('Done!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
