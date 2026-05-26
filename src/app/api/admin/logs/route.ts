export const dynamic = 'force-dynamic';
import { type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin, requireHeadAdmin, handleApiError, successResponse, errorResponse, parsePagination } from '@/lib/api-helpers';

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

/** DELETE – Head Admin can delete logs */
export async function DELETE(req: NextRequest) {
  try {
    await requireHeadAdmin();
    const { searchParams } = req.nextUrl;
    const id = searchParams.get('id');
    const all = searchParams.get('all');

    if (all === 'true') {
      const { count } = await prisma.adminLog.deleteMany();
      return successResponse({ deleted: count });
    }

    if (!id) return errorResponse('id or all=true is required', 400);

    await prisma.adminLog.delete({ where: { id } });
    return successResponse({ deleted: true });
  } catch (err) {
    return handleApiError(err);
  }
}
