export const revalidate = 60;

import prisma from '@/lib/prisma';
import { successResponse, handleApiError } from '@/lib/api-helpers';

export async function GET() {
  try {
    const stats = await prisma.trustStat.findMany({
      orderBy: { sortOrder: 'asc' },
    });
    return successResponse(stats);
  } catch (err) {
    return handleApiError(err);
  }
}
