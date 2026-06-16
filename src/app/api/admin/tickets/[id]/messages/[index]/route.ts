/**
 * Head Admin endpoints to edit or delete an individual reply on a
 * support ticket. The reply is identified by its index in the
 * `responses` JSON array (0-based, in chronological order).
 *
 * Original ticket body is editable separately via the parent
 * /api/admin/tickets/[id] PATCH (not implemented here).
 */
export const dynamic = 'force-dynamic';

import { type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireHeadAdmin, handleApiError, successResponse, errorResponse } from '@/lib/api-helpers';

interface TicketResponseItem {
  sender: string;
  senderName: string;
  senderId?: string;
  message: string;
  timestamp: string;
  edited?: boolean;
  editedAt?: string;
}

function parseIndex(raw: string): number | null {
  const n = parseInt(raw, 10);
  if (Number.isNaN(n) || n < 0) return null;
  return n;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; index: string } }
) {
  try {
    const session = await requireHeadAdmin();
    const idx = parseIndex(params.index);
    if (idx === null) return errorResponse('Invalid message index', 400);

    const { message } = await req.json();
    if (typeof message !== 'string' || !message.trim()) {
      return errorResponse('Message body is required', 400);
    }

    const ticket = await prisma.supportTicket.findUnique({ where: { id: params.id } });
    if (!ticket) return errorResponse('Ticket not found', 404);

    const responses: TicketResponseItem[] = Array.isArray(ticket.responses)
      ? (ticket.responses as unknown as TicketResponseItem[])
      : [];

    if (idx >= responses.length) {
      return errorResponse('Message not found at that index', 404);
    }

    const before = responses[idx];
    const updatedItem: TicketResponseItem = {
      ...before,
      message: message.trim(),
      edited: true,
      editedAt: new Date().toISOString(),
    };
    const updatedResponses = [...responses];
    updatedResponses[idx] = updatedItem;

    const updated = await prisma.supportTicket.update({
      where: { id: params.id },
      data: { responses: JSON.parse(JSON.stringify(updatedResponses)) },
    });

    await prisma.adminLog.create({
      data: {
        adminId: session.user.id,
        action: 'EDIT_TICKET_REPLY',
        details: JSON.parse(JSON.stringify({
          ticketId: params.id,
          index: idx,
          before: before.message,
          after: updatedItem.message,
        })),
      },
    });

    return successResponse(updated);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; index: string } }
) {
  try {
    const session = await requireHeadAdmin();
    const idx = parseIndex(params.index);
    if (idx === null) return errorResponse('Invalid message index', 400);

    const ticket = await prisma.supportTicket.findUnique({ where: { id: params.id } });
    if (!ticket) return errorResponse('Ticket not found', 404);

    const responses: TicketResponseItem[] = Array.isArray(ticket.responses)
      ? (ticket.responses as unknown as TicketResponseItem[])
      : [];

    if (idx >= responses.length) {
      return errorResponse('Message not found at that index', 404);
    }

    const removed = responses[idx];
    const updatedResponses = responses.filter((_, i) => i !== idx);

    const updated = await prisma.supportTicket.update({
      where: { id: params.id },
      data: { responses: JSON.parse(JSON.stringify(updatedResponses)) },
    });

    await prisma.adminLog.create({
      data: {
        adminId: session.user.id,
        action: 'DELETE_TICKET_REPLY',
        details: JSON.parse(JSON.stringify({
          ticketId: params.id,
          index: idx,
          removed,
        })),
      },
    });

    return successResponse(updated);
  } catch (err) {
    return handleApiError(err);
  }
}
