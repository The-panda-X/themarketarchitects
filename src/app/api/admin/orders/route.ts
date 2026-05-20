export const dynamic = 'force-dynamic';
import { type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin, handleApiError, successResponse, parsePagination } from '@/lib/api-helpers';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = req.nextUrl;
    const { page, limit, skip } = parsePagination(searchParams);
    const status = searchParams.get('status') ?? '';
    const search = searchParams.get('search') ?? '';

    const where = {
      ...(status && { status: status as never }),
      ...(search && {
        OR: [
          { planName: { contains: search, mode: 'insensitive' as const } },
          { user: { email: { contains: search, mode: 'insensitive' as const } } },
        ],
      }),
    };

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: { user: { select: { id: true, email: true, name: true } } },
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
