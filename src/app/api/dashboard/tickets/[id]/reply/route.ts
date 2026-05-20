export const dynamic = 'force-dynamic';
﻿import { type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth, handleApiError, successResponse, errorResponse } from '@/lib/api-helpers';
import { ticketReplySchema } from '@/lib/validations';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth();
    const body = await req.json();
    const parsed = ticketReplySchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0].message, 400);
    }

    const ticket = await prisma.supportTicket.findFirst({
      where: { id: params.id, userId: session.user.id },
    });
    if (!ticket) return errorResponse('Ticket not found', 404);
    if (ticket.status === 'CLOSED') return errorResponse('Ticket is closed', 400);

    const newResponse = {
      sender: 'user',
      senderName: session.user.name ?? 'User',
      message: parsed.data.message,
      timestamp: new Date().toISOString(),
    };

    const updated = await prisma.supportTicket.update({
      where: { id: params.id },
      data: {
        responses: JSON.parse(JSON.stringify([...(Array.isArray(ticket.responses) ? ticket.responses : []), newResponse])),
        status: ticket.status === 'RESOLVED' ? 'IN_PROGRESS' : ticket.status,
      },
    });

    return successResponse(updated);
  } catch (err) {
    return handleApiError(err);
  }
}
