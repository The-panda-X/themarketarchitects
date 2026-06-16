export const dynamic = 'force-dynamic';

import { type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin, handleApiError, successResponse, parsePagination } from '@/lib/api-helpers';

/**
 * GET — list every referral on the platform with both sides resolved
 * (who referred whom). Returns referrer + referred user details, the
 * tied order (if any), and commission/paid status.
 */
export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = req.nextUrl;
    const { page, limit, skip } = parsePagination(searchParams);
    const status = searchParams.get('status'); // 'paid' | 'pending' | null

    const where = status === 'paid'
      ? { paid: true }
      : status === 'pending'
      ? { paid: false }
      : {};

    const [referrals, total] = await Promise.all([
      prisma.referral.findMany({
        where,
        include: {
          referrer: { select: { id: true, email: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.referral.count({ where }),
    ]);

    // Resolve referred users (by email) and orders (by id) in batch
    const referredEmails = Array.from(new Set(referrals.map((r) => r.referredEmail)));
    const orderIds = Array.from(new Set(referrals.map((r) => r.orderId).filter((id): id is string => !!id)));

    const [referredUsers, orders] = await Promise.all([
      referredEmails.length > 0
        ? prisma.user.findMany({
            where: { email: { in: referredEmails } },
            select: { id: true, email: true, name: true, createdAt: true },
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

    const enriched = referrals.map((r) => ({
      id: r.id,
      referrer: r.referrer,
      referredEmail: r.referredEmail,
      referredUser: userByEmail.get(r.referredEmail) ?? null,
      order: r.orderId ? orderById.get(r.orderId) ?? null : null,
      commission: r.commission,
      paid: r.paid,
      createdAt: r.createdAt,
    }));

    // Top-level summary stats
    const [totalReferralsAll, totalCommissionPaid] = await Promise.all([
      prisma.referral.count(),
      prisma.referral.aggregate({ where: { paid: true }, _sum: { commission: true } }),
    ]);

    return successResponse({
      data: enriched,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      summary: {
        totalReferralsAll,
        totalCommissionPaid: totalCommissionPaid._sum.commission ?? 0,
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
