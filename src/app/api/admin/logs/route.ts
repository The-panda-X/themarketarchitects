export const dynamic = 'force-dynamic';
import { type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin, handleApiError, successResponse, parsePagination } from '@/lib/api-helpers';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = req.nextUrl;
    const { page, limit, skip } = parsePagination(searchParams);

    const [logs, total] = await Promise.all([
      prisma.adminLog.findMany({
        include: { admin: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.adminLog.count(),
    ]);

    return successResponse({ data: logs, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    return handleApiError(err);
  }
}
