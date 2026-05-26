export const revalidate = 60;

import prisma from '@/lib/prisma';
import { successResponse, handleApiError } from '@/lib/api-helpers';

export async function GET() {
  try {
    const firms = await prisma.propFirm.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
    return successResponse(firms);
  } catch (err) {
    return handleApiError(err);
  }
}
