export const dynamic = 'force-dynamic';
﻿import prisma from '@/lib/prisma';
import { requireAuth, handleApiError, successResponse, errorResponse } from '@/lib/api-helpers';

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth();

    const ticket = await prisma.supportTicket.findFirst({
      where: { id: params.id, userId: session.user.id },
    });

    if (!ticket) return errorResponse('Ticket not found', 404);

    return successResponse(ticket);
  } catch (err) {
    return handleApiError(err);
  }
}
