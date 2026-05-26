export const dynamic = 'force-dynamic';

import prisma from '@/lib/prisma';
import { requireModerator, handleApiError, successResponse } from '@/lib/api-helpers';

export async function GET() {
  try {
    await requireModerator();
    const result = await prisma.conversation.aggregate({
      _sum: { staffUnread: true },
    });
    return successResponse({ unread: result._sum.staffUnread ?? 0 });
  } catch (err) {
    return handleApiError(err);
  }
}
