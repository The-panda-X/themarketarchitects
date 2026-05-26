export const dynamic = 'force-dynamic';

import prisma from '@/lib/prisma';
import { requireAuth, handleApiError, successResponse } from '@/lib/api-helpers';

export async function GET() {
  try {
    const session = await requireAuth();
    const result = await prisma.conversation.aggregate({
      where: { userId: session.user.id },
      _sum: { userUnread: true },
    });
    return successResponse({ unread: result._sum.userUnread ?? 0 });
  } catch (err) {
    return handleApiError(err);
  }
}
