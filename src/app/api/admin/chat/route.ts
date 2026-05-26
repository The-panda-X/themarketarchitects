export const dynamic = 'force-dynamic';

import prisma from '@/lib/prisma';
import { requireModerator, handleApiError, successResponse } from '@/lib/api-helpers';

/** GET – list all conversations for staff */
export async function GET() {
  try {
    await requireModerator();
    const conversations = await prisma.conversation.findMany({
      orderBy: { lastAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
      },
    });
    return successResponse(conversations);
  } catch (err) {
    return handleApiError(err);
  }
}
