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
