import prisma from '@/lib/prisma';
import { requireAuth, handleApiError, successResponse } from '@/lib/api-helpers';

export async function GET() {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    const [activeChallenges, challenges, referralEarnings] = await Promise.all([
      prisma.challenge.count({
        where: { userId, status: { in: ['IN_PROGRESS', 'PHASE_1', 'PHASE_2'] } },
      }),
      prisma.challenge.findMany({
        where: { userId },
        select: { currentProfit: true, status: true },
      }),
      prisma.referral.aggregate({
        where: { referrerId: userId, paid: true },
        _sum: { commission: true },
      }),
    ]);

    const totalProfit = challenges.reduce((sum, c) => sum + c.currentProfit, 0);
    const completed = challenges.filter((c) => c.status === 'PASSED' || c.status === 'FUNDED').length;
    const successRate = challenges.length > 0 ? Math.round((completed / challenges.length) * 100) : 0;

    return successResponse({
      activeChallenges,
      totalProfit,
      successRate,
      referralEarnings: referralEarnings._sum.commission ?? 0,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
