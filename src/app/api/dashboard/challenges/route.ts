export const dynamic = 'force-dynamic';
﻿import prisma from '@/lib/prisma';
import { requireAuth, handleApiError, successResponse } from '@/lib/api-helpers';

export async function GET() {
  try {
    const session = await requireAuth();

    const challenges = await prisma.challenge.findMany({
      where: { userId: session.user.id },
      include: { order: { select: { planName: true, serviceType: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return successResponse(challenges);
  } catch (err) {
    return handleApiError(err);
  }
}
