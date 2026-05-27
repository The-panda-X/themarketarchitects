/**
 * GET /api/admin/signals/vps
 * ─────────────────────────────────────────────────────────────────────
 * Lists VPS signals (Signal model) for the admin Signal Hub.
 * Supports pagination and status filtering.
 */
export const dynamic = 'force-dynamic';

import { type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin, handleApiError, successResponse, parsePagination } from '@/lib/api-helpers';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = req.nextUrl;
    const { page, limit, skip } = parsePagination(searchParams);
    const status = searchParams.get('status'); // optional filter

    const where = status ? { status } : {};

    const [signals, total] = await Promise.all([
      prisma.signal.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.signal.count({ where }),
    ]);

    return successResponse({
      data: signals,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    return handleApiError(err);
  }
}

/**
 * DELETE /api/admin/signals/vps?id=xxx
 * Deletes a single VPS signal by id.
 */
export async function DELETE(req: NextRequest) {
  try {
    await requireAdmin();
    const id = req.nextUrl.searchParams.get('id');
    if (!id) return successResponse({ error: 'id required' });

    await prisma.signal.delete({ where: { id } });
    return successResponse({ deleted: true });
  } catch (err) {
    return handleApiError(err);
  }
}
