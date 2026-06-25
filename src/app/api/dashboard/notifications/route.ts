export const dynamic = 'force-dynamic';
﻿import prisma from '@/lib/prisma';
import { requireAuth, handleApiError, successResponse, errorResponse } from '@/lib/api-helpers';

export async function GET() {
  try {
    const session = await requireAuth();

    const notifications = await prisma.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return successResponse(notifications);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await requireAuth();
    const { id } = await req.json();

    if (!id || typeof id !== 'string') {
      return errorResponse('Notification id is required', 400);
    }

    await prisma.notification.updateMany({
      where: { id, userId: session.user.id },
      data: { read: true },
    });

    return successResponse({ success: true });
  } catch (err) {
    return handleApiError(err);
  }
}
