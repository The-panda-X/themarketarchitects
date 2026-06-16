export const dynamic = 'force-dynamic';
import { type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireModerator, handleApiError, successResponse, errorResponse } from '@/lib/api-helpers';
import { resolveStaffDisplay } from '@/lib/staff-display';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminSession = await requireModerator();
    const { message, status } = await req.json();

    if (!message?.trim()) return errorResponse('Message is required', 400);

    const ticket = await prisma.supportTicket.findUnique({ where: { id: params.id } });
    if (!ticket) return errorResponse('Ticket not found', 404);

    // Use the staff nickname shown to clients — never the real name
    const { displayName } = await resolveStaffDisplay(adminSession.user.id);

    const newResponse = {
      sender: 'admin',
      senderName: displayName,
      senderId: adminSession.user.id, // kept internally so admins can audit who replied
      message: message.trim(),
      timestamp: new Date().toISOString(),
    };

    const updated = await prisma.supportTicket.update({
      where: { id: params.id },
      data: {
        responses: JSON.parse(JSON.stringify([...(Array.isArray(ticket.responses) ? ticket.responses : []), newResponse])),
        status: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].includes(status) ? status : 'IN_PROGRESS',
      },
    });

    // Notify the user
    await prisma.notification.create({
      data: {
        userId: ticket.userId,
        title: 'Support Reply',
        message: `Your ticket "${ticket.subject}" has a new reply.`,
        type: 'info',
        link: `/dashboard/support/${ticket.id}`,
      },
    });

    return successResponse(updated);
  } catch (err) {
    return handleApiError(err);
  }
}
