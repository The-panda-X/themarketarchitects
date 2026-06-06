export const dynamic = 'force-dynamic';
import prisma from '@/lib/prisma';
import { requireModerator, handleApiError, successResponse } from '@/lib/api-helpers';

/**
 * GET /api/admin/orders/pending-count
 * Returns the count of orders needing admin attention
 * (PENDING_PAYMENT or PAID but no challenge created yet).
 */
export async function GET() {
  try {
    await requireModerator();

    const count = await prisma.order.count({
      where: {
        status: { in: ['PENDING_PAYMENT', 'PAID'] },
      },
    });

    return successResponse({ count });
  } catch (err) {
    return handleApiError(err);
  }
}
