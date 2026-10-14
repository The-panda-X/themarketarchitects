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
        OR: [
          { status: 'PENDING_PAYMENT', proofImage: { not: null } },
          { status: 'PAID' },
        ],
      },
    });

    return successResponse({ count });
  } catch (err) {
    return handleApiError(err);
  }
}
