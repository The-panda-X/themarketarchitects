export const dynamic = 'force-dynamic';
import { type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireModerator, handleApiError, successResponse, parsePagination } from '@/lib/api-helpers';

export async function GET(req: NextRequest) {
  try {
    await requireModerator();
    const { searchParams } = req.nextUrl;
    const { page, limit, skip } = parsePagination(searchParams);
    const filter = searchParams.get('filter') ?? 'pending';
    const search = searchParams.get('search') ?? '';

    const where: Record<string, unknown> = {
      proofImage: { not: null },
      ...(filter === 'pending' && { status: 'PENDING_PAYMENT' }),
      ...(filter === 'approved' && { status: { in: ['PAID', 'IN_PROGRESS', 'COMPLETED'] } }),
      ...(filter === 'rejected' && { status: 'CANCELLED' }),
      ...(search && {
        OR: [
          { planName: { contains: search, mode: 'insensitive' as const } },
          { user: { email: { contains: search, mode: 'insensitive' as const } } },
          { cryptoTxId: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        select: {
          id: true,
          planName: true,
          serviceType: true,
          totalAmount: true,
          status: true,
          proofImage: true,
          paymentNetwork: true,
          cryptoTxId: true,
          createdAt: true,
          user: { select: { id: true, email: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    return successResponse({ data: orders, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    return handleApiError(err);
  }
}
