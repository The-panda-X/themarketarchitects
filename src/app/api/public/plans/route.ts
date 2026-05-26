export const revalidate = 60;

import prisma from '@/lib/prisma';
import { successResponse, handleApiError } from '@/lib/api-helpers';

export async function GET() {
  try {
    const plans = await prisma.servicePlan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
    return successResponse(plans);
  } catch (err) {
    return handleApiError(err);
  }
}
