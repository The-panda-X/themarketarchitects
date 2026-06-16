export const dynamic = 'force-dynamic';

import { type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin, handleApiError, successResponse, parsePagination } from '@/lib/api-helpers';

/** GET — list all referral payout requests for admins */
export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = req.nextUrl;
    const { page, limit, skip } = parsePagination(searchParams);
    const status = searchParams.get('status');

    const where = status && ['PENDING', 'PAID', 'REJECTED'].includes(status)
      ? { status: status as 'PENDING' | 'PAID' | 'REJECTED' }
      : {};

    const [payouts, total, totals] = await Promise.all([
      prisma.referralPayout.findMany({
        where,
        include: {
          user: { select: { id: true, email: true, name: true, referralBalance: true } },
        },
        orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      prisma.referralPayout.count({ where }),
      prisma.referralPayout.groupBy({
        by: ['status'],
        _sum: { amount: true },
        _count: { id: true },
      }),
    ]);

    const summary = {
      pendingAmount: totals.find((t) => t.status === 'PENDING')?._sum.amount ?? 0,
      pendingCount: totals.find((t) => t.status === 'PENDING')?._count.id ?? 0,
      paidAmount: totals.find((t) => t.status === 'PAID')?._sum.amount ?? 0,
      paidCount: totals.find((t) => t.status === 'PAID')?._count.id ?? 0,
      rejectedCount: totals.find((t) => t.status === 'REJECTED')?._count.id ?? 0,
    };

    return successResponse({ data: payouts, total, page, limit, totalPages: Math.ceil(total / limit), summary });
  } catch (err) {
    return handleApiError(err);
  }
}
