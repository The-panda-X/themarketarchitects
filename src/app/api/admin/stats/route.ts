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
      revenueToday,
      revenueWeek,
      revenueMonth,
      revenueTotal,
      newUsersToday,
      totalUsers,
      pendingOrders,
      openTickets,
      activeChallenges,
      challengesByStatus,
    ] = await Promise.all([
      prisma.payment.aggregate({ where: { createdAt: { gte: todayStart }, status: 'succeeded' }, _sum: { amount: true } }),
      prisma.payment.aggregate({ where: { createdAt: { gte: weekStart }, status: 'succeeded' }, _sum: { amount: true } }),
      prisma.payment.aggregate({ where: { createdAt: { gte: monthStart }, status: 'succeeded' }, _sum: { amount: true } }),
      prisma.payment.aggregate({ where: { status: 'succeeded' }, _sum: { amount: true } }),
      prisma.user.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.user.count({ where: { role: 'USER' } }),
      prisma.order.count({ where: { status: 'PENDING_PAYMENT' } }),
      prisma.supportTicket.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
      prisma.challenge.count({ where: { status: { in: ['IN_PROGRESS', 'PHASE_1', 'PHASE_2'] } } }),
      prisma.challenge.groupBy({ by: ['status'], _count: { id: true } }),
    ]);

    const challengeMap = Object.fromEntries(
      challengesByStatus.map((c) => [c.status, c._count.id])
    );

    return successResponse({
      revenueToday: revenueToday._sum.amount ?? 0,
      revenueWeek: revenueWeek._sum.amount ?? 0,
      revenueMonth: revenueMonth._sum.amount ?? 0,
      revenueTotal: revenueTotal._sum.amount ?? 0,
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
