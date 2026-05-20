export const dynamic = 'force-dynamic';
import { type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin, handleApiError, successResponse, errorResponse } from '@/lib/api-helpers';

export async function POST(req: NextRequest) {
  try {
    const adminSession = await requireAdmin();
    const { userId, title, message, type, link } = await req.json();

    if (!userId || !title || !message) {
      return errorResponse('userId, title, and message are required', 400);
    }

    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type: type ?? 'info',
        link: link ?? null,
      },
    });

    await prisma.adminLog.create({
      data: {
        adminId: adminSession.user.id,
        action: 'SEND_NOTIFICATION',
        details: { userId, title },
      },
    });

    return successResponse(notification, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
