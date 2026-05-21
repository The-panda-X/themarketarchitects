import prisma from '@/lib/prisma';
import { requireAuth, handleApiError, successResponse } from '@/lib/api-helpers';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    const [user, referrals] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { referralCode: true },
      }),
      prisma.referral.findMany({
        where: { referrerId: userId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
    ]);

    const totalEarnings = referrals.reduce((sum, r) => sum + r.commission, 0);
    const paidEarnings = referrals.filter((r) => r.paid).reduce((sum, r) => sum + r.commission, 0);

    return successResponse({
      referralCode: user?.referralCode ?? '',
      totalReferrals: referrals.length,
      totalEarnings,
      paidEarnings,
      referrals,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
