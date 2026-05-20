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
