export const dynamic = 'force-dynamic';
import prisma from '@/lib/prisma';
import { requireModerator, handleApiError, successResponse } from '@/lib/api-helpers';

export async function GET() {
  try {
    await requireModerator();

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 7);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      payments,
      newUsersToday,
      totalUsers,
      pendingOrders,
      openTickets,
      activeChallenges,
      challengesByStatus,
    ] = await Promise.all([
      // Single query gets all payments — filter in JS instead of 4 separate aggregate calls
      prisma.payment.findMany({
        where: { status: 'succeeded' },
        select: { amount: true, createdAt: true },
      }),
      prisma.user.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.user.count({ where: { role: 'USER' } }),
      prisma.order.count({ where: { status: 'PENDING_PAYMENT' } }),
      prisma.supportTicket.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
      prisma.challenge.count({ where: { status: { in: ['IN_PROGRESS', 'PHASE_1', 'PHASE_2'] } } }),
      prisma.challenge.groupBy({ by: ['status'], _count: { id: true } }),
    ]);

    // Compute revenue buckets in JS (1 query vs 4)
    let revenueToday = 0, revenueWeek = 0, revenueMonth = 0, revenueTotal = 0;
    for (const p of payments) {
      const amt = p.amount ?? 0;
      revenueTotal += amt;
      const t = p.createdAt.getTime();
      if (t >= monthStart.getTime()) revenueMonth += amt;
      if (t >= weekStart.getTime()) revenueWeek += amt;
      if (t >= todayStart.getTime()) revenueToday += amt;
    }

    const challengeMap = Object.fromEntries(
      challengesByStatus.map((c) => [c.status, c._count.id])
    );

    return successResponse({
      revenueToday,
      revenueWeek,
      revenueMonth,
      revenueTotal,
      newUsersToday,
      totalUsers,
      pendingOrders,
      openTickets,
      activeChallenges,
      challengesByStatus: challengeMap,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
