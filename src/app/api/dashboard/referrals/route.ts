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
        select: { referralCode: true, referralBalance: true },
      }),
      prisma.referral.findMany({
        where: { referrerId: userId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
    ]);

    // Enrich each referral with the referred user's name (if they registered)
    // and the order status (if commission was tied to a specific order).
    const referredEmails = referrals.map((r) => r.referredEmail);
    const orderIds = referrals.map((r) => r.orderId).filter((id): id is string => !!id);

    const [referredUsers, orders] = await Promise.all([
      referredEmails.length > 0
        ? prisma.user.findMany({
            where: { email: { in: referredEmails } },
            select: { email: true, name: true, createdAt: true },
          })
        : Promise.resolve([]),
      orderIds.length > 0
        ? prisma.order.findMany({
            where: { id: { in: orderIds } },
            select: { id: true, planName: true, status: true, totalAmount: true },
          })
        : Promise.resolve([]),
    ]);

    const userByEmail = new Map(referredUsers.map((u) => [u.email, u]));
    const orderById = new Map(orders.map((o) => [o.id, o]));

    const enrichedReferrals = referrals.map((r) => ({
      id: r.id,
      referredEmail: r.referredEmail,
      referredName: userByEmail.get(r.referredEmail)?.name ?? null,
      signedUpAt: userByEmail.get(r.referredEmail)?.createdAt ?? r.createdAt,
      commission: r.commission,
      paid: r.paid,
      orderId: r.orderId,
      orderPlanName: r.orderId ? orderById.get(r.orderId)?.planName ?? null : null,
      orderStatus: r.orderId ? orderById.get(r.orderId)?.status ?? null : null,
      createdAt: r.createdAt,
    }));

    const totalEarned = referrals.reduce((sum, r) => sum + (r.paid ? r.commission : 0), 0);
    const pendingCount = referrals.filter((r) => !r.paid).length;

    return successResponse({
      referralCode: user?.referralCode ?? '',
      referralBalance: user?.referralBalance ?? 0,
      commissionRate: 20, // percent
      totalReferrals: referrals.length,
      paidReferrals: referrals.filter((r) => r.paid).length,
      pendingReferrals: pendingCount,
      totalEarned,
      referrals: enrichedReferrals,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
