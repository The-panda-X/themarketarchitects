import prisma from '@/lib/prisma';
import { requireAuth, handleApiError, successResponse } from '@/lib/api-helpers';

export async function POST() {
  try {
    const session = await requireAuth();

    await prisma.notification.updateMany({
      where: { userId: session.user.id, read: false },
      data: { read: true },
    });

    return successResponse({ success: true });
  } catch (err) {
    return handleApiError(err);
  }
}
