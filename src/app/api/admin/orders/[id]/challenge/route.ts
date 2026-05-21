export const dynamic = 'force-dynamic';
import prisma from '@/lib/prisma';
import { requireAdmin, handleApiError, successResponse, errorResponse } from '@/lib/api-helpers';

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();

    const challenge = await prisma.challenge.findUnique({
      where: { orderId: params.id },
      select: { id: true, status: true, firmName: true, accountSize: true },
    });

    if (!challenge) return errorResponse('No challenge for this order', 404);
    return successResponse(challenge);
  } catch (err) {
    return handleApiError(err);
  }
}
