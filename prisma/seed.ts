import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const adminPassword = await bcrypt.hash('Admin@123456', 12);
  const userPassword = await bcrypt.hash('User@123456', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@themarketarchitects.com' },
    update: {},
    create: {
      email: 'admin@themarketarchitects.com',
      name: 'Admin',
      passwordHash: adminPassword,
      role: Role.ADMIN,
      emailVerified: new Date(),
      referralCode: 'ADMIN-REF',
    },
  });

  const user = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      email: 'user@example.com',
      name: 'John Trader',
      passwordHash: userPassword,
      role: Role.USER,
      emailVerified: new Date(),
      referralCode: 'USER-DEMO',
    },
  });

  await prisma.siteStats.upsert({
    where: { id: 'global' },
    update: {},
    create: {
      id: 'global',
      totalClients: 2500,
      totalPayouts: 12000000,
      challengesPassed: 2500,
      successRate: 94.2,
      totalFundedAmount: 50000000,
    },
  });

  const order = await prisma.order.create({
    data: {
      userId: user.id,
      serviceType: 'CHALLENGE_PASSING',
      planName: 'Professional',
      planDetails: {
        tier: 'professional',
        features: [
          '$100K – $200K challenge accounts',
          'Senior trader assigned',
          'Phase 1 & Phase 2 passing',
          'Daily progress updates',
          'Priority support',
        ],
        accountSize: '$100,000',
        firm: 'FTMO',
        phases: 2,
      },
      accountSize: '$100,000',
      firmName: 'FTMO',
      status: 'IN_PROGRESS',
      totalAmount: 599,
      discountAmount: 0,
    },
  });

  const challenge = await prisma.challenge.create({
    data: {
      orderId: order.id,
      userId: user.id,
      firmName: 'FTMO',
      accountSize: '$100,000',
      status: 'PHASE_1',
      currentPhase: 1,
      startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      targetProfit: 10000,
      currentProfit: 6250,
      maxDrawdown: 10000,
      currentDrawdown: 1200,
      daysTraded: 5,
      winRate: 72.5,
    },
  });

  const dailyStatsData = [
    { profit: 1500, loss: 300, tradesCount: 8, winCount: 6, lossCount: 2 },
    { profit: 800, loss: 500, tradesCount: 6, winCount: 4, lossCount: 2 },
    { profit: 2100, loss: 200, tradesCount: 10, winCount: 8, lossCount: 2 },
    { profit: 950, loss: 600, tradesCount: 7, winCount: 4, lossCount: 3 },
    { profit: 1400, loss: 400, tradesCount: 9, winCount: 7, lossCount: 2 },
  ];

  await prisma.dailyStat.createMany({
    data: dailyStatsData.map((stat, i) => ({
      challengeId: challenge.id,
      date: new Date(Date.now() - (4 - i) * 24 * 60 * 60 * 1000),
      ...stat,
    })),
  });

  await prisma.payment.create({
    data: {
      orderId: order.id,
      userId: user.id,
      amount: 599,
      currency: 'USD',
      method: 'STRIPE',
      status: 'succeeded',
      stripePaymentId: 'pi_demo_123456',
    },
  });

  const testimonials = [
    {
      name: 'Marcus J.',
      title: 'Passed $200K FTMO Challenge',
      content: 'Incredible service. They passed my FTMO challenge in just 8 days with perfect risk management. The daily updates kept me informed throughout. Highly recommended!',
      rating: 5,
      verified: true,
      featured: true,
    },
    {
      name: 'Sarah K.',
      title: 'Funded Account Management',
      content: 'Been using their account management service for 3 months. Consistent profits every month and great communication. Worth every penny.',
      rating: 5,
      verified: true,
      featured: true,
    },
    {
      name: 'David L.',
      title: 'Passed $100K FundedNext',
      content: 'Was skeptical at first but they delivered. Both phases passed within the timeline. Professional team that knows what they are doing.',
      rating: 4,
      verified: true,
      featured: true,
    },
    {
      name: 'Elena R.',
      title: 'Elite Plan — $300K Challenge',
      content: 'The Elite plan is worth it. Fast-tracked completion, VIP support, and detailed analytics. They passed my $300K challenge in 6 days.',
      rating: 5,
      verified: true,
      featured: false,
    },
    {
      name: 'James W.',
      title: 'Multiple Challenges Passed',
      content: 'Third time using their service. Every time they deliver on time with excellent results. They are my go-to for all prop firm challenges.',
      rating: 5,
      verified: true,
      featured: false,
    },
  ];

  await prisma.testimonial.createMany({ data: testimonials });

  await prisma.coupon.create({
    data: {
      code: 'WELCOME20',
      discountPercent: 20,
      maxUses: 100,
      isActive: true,
      validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.notification.create({
    data: {
      userId: user.id,
      title: 'Welcome to The Market Architects!',
      message: 'Your account has been created. Get started by choosing a service plan.',
      type: 'info',
    },
  });

  await prisma.notification.create({
    data: {
      userId: user.id,
      title: 'Challenge Started',
      message: 'Your FTMO $100K challenge has begun. Track progress from your dashboard.',
      type: 'challenge',
      link: '/dashboard/challenges',
    },
  });

  // ── Seed service plans, prop firms, FAQs, trust stats ──
  console.log('🌱 Seeding service data...');

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
  console.log(`   ✓ ${plans.length} plans seeded`);

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
  console.log(`   ✓ ${firms.length} firms seeded`);

  const faqs = [
    { id: 'faq-1', question: 'How does the challenge passing service work?', answer: 'Once you purchase a plan, you securely share your trading account credentials with us. Our team of professional traders will then trade on your behalf to meet all the challenge requirements, including profit targets and risk management rules.', sortOrder: 1 },
    { id: 'faq-2', question: 'Is my trading account safe?', answer: 'Absolutely. All credentials are encrypted with AES-256-GCM encryption and stored securely. Our traders follow strict risk management protocols, and we have a proven track record.', sortOrder: 2 },
    { id: 'faq-3', question: 'What prop firms do you support?', answer: 'We support all major prop firms including FTMO, FundedNext, The Funded Trader, E8 Markets, Funding Pips, Alpha Capital, Apex Trader Funding, and many more.', sortOrder: 3 },
    { id: 'faq-4', question: 'How long does it take to pass a challenge?', answer: 'Completion time varies by plan and account size. Starter plans typically complete in 7-14 days, Professional plans in 5-10 days, and Elite plans are fast-tracked for priority completion.', sortOrder: 4 },
    { id: 'faq-5', question: 'What happens if the challenge fails?', answer: 'If we fail to pass your challenge, you will receive a full retry at no additional cost. Elite plan customers receive a 100% money-back guarantee.', sortOrder: 5 },
    { id: 'faq-6', question: 'Do you offer refunds?', answer: 'Yes. If work has not started on your challenge, you can receive a full refund. Once trading begins, our retry guarantee covers any failures.', sortOrder: 6 },
    { id: 'faq-7', question: 'How do profit splits work with account management?', answer: 'After your account is funded, we trade it and split the profits according to your plan. Payouts are processed monthly.', sortOrder: 7 },
    { id: 'faq-8', question: 'Can I track the progress of my challenge?', answer: 'Yes! Your dashboard provides real-time progress tracking including current profit/loss, drawdown levels, win rate, and daily trade logs.', sortOrder: 8 },
    { id: 'faq-9', question: 'Is this legal?', answer: 'Yes. Trading on behalf of account holders is a legitimate service. We operate transparently and sign NDAs with all clients.', sortOrder: 9 },
    { id: 'faq-10', question: 'How do I get started?', answer: 'Simply create an account, choose your service plan and account size, submit your trading credentials through our encrypted form, and complete the payment.', sortOrder: 10 },
  ];

  for (const faq of faqs) {
    await prisma.fAQItem.upsert({
      where: { id: faq.id },
      update: faq,
      create: { ...faq, isActive: true },
    });
  }
  console.log(`   ✓ ${faqs.length} FAQ items seeded`);

  const trustStats = [
    { id: 'stat-1', label: 'Challenges Passed', value: 2500, suffix: '+', icon: 'Trophy', sortOrder: 1 },
    { id: 'stat-2', label: 'Total Payouts', value: 12, suffix: 'M+', prefix: '$', icon: 'DollarSign', sortOrder: 2 },
    { id: 'stat-3', label: 'Success Rate', value: 94, suffix: '%', icon: 'TrendingUp', sortOrder: 3 },
    { id: 'stat-4', label: 'Active Clients', value: 500, suffix: '+', icon: 'Users', sortOrder: 4 },
  ];

  for (const stat of trustStats) {
    await prisma.trustStat.upsert({
      where: { id: stat.id },
      update: stat,
      create: stat,
    });
  }
  console.log(`   ✓ ${trustStats.length} trust stats seeded`);

  console.log('✅ Seed complete');
  console.log(`   Admin: admin@themarketarchitects.com / Admin@123456`);
  console.log(`   User:  user@example.com / User@123456`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
