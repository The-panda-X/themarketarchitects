export const dynamic = 'force-dynamic';

import { type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin, handleApiError, successResponse } from '@/lib/api-helpers';

export async function GET() {
  try {
    await requireAdmin();
    const stats = await prisma.trustStat.findMany({ orderBy: { sortOrder: 'asc' } });
    return successResponse(stats);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PUT(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json();
    const { stats } = body as { stats: Array<{ id: string; label: string; value: number; suffix?: string; prefix?: string; icon: string; sortOrder: number }> };

    for (const stat of stats) {
      await prisma.trustStat.upsert({
        where: { id: stat.id },
        update: { label: stat.label, value: stat.value, suffix: stat.suffix ?? null, prefix: stat.prefix ?? null, icon: stat.icon, sortOrder: stat.sortOrder },
        create: stat,
      });
    }

    const updated = await prisma.trustStat.findMany({ orderBy: { sortOrder: 'asc' } });
    return successResponse(updated);
  } catch (err) {
    return handleApiError(err);
  }
}
