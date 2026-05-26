export const dynamic = 'force-dynamic';
import prisma from '@/lib/prisma';
import { requireAdmin, handleApiError, successResponse, errorResponse } from '@/lib/api-helpers';

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();

    const ticket = await prisma.supportTicket.findUnique({
      where: { id: params.id },
      include: { user: { select: { id: true, email: true, name: true } } },
    });

    if (!ticket) return errorResponse('Ticket not found', 404);
    return successResponse(ticket);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const adminSession = await requireAdmin();

    const ticket = await prisma.supportTicket.findUnique({
      where: { id: params.id },
      select: { id: true, subject: true },
    });
    if (!ticket) return errorResponse('Ticket not found', 404);

    await prisma.supportTicket.delete({ where: { id: params.id } });

    await prisma.adminLog.create({
      data: {
        adminId: adminSession.user.id,
        action: 'DELETE_TICKET',
        details: JSON.parse(JSON.stringify({ ticketId: params.id, subject: ticket.subject })),
      },
    });

    return successResponse({ deleted: true });
  } catch (err) {
    return handleApiError(err);
  }
}
