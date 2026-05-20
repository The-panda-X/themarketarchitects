export const dynamic = 'force-dynamic';
﻿import prisma from '@/lib/prisma';
import { requireAuth, handleApiError, successResponse, errorResponse } from '@/lib/api-helpers';

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth();

    const challenge = await prisma.challenge.findFirst({
      where: { id: params.id, userId: session.user.id },
      include: {
        order: { select: { planName: true, serviceType: true, totalAmount: true } },
        dailyStats: { orderBy: { date: 'desc' }, take: 30 },
      },
    });

    if (!challenge) return errorResponse('Challenge not found', 404);

    return successResponse(challenge);
  } catch (err) {
    return handleApiError(err);
  }
}
