export const revalidate = 60;

import prisma from '@/lib/prisma';
import { successResponse, handleApiError } from '@/lib/api-helpers';

export async function GET() {
  try {
    const items = await prisma.fAQItem.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
    return successResponse(items);
  } catch (err) {
    return handleApiError(err);
  }
}
