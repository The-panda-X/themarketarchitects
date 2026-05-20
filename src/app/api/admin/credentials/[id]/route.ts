export const dynamic = 'force-dynamic';
import prisma from '@/lib/prisma';
import { requireAdmin, handleApiError, successResponse, errorResponse } from '@/lib/api-helpers';
import { decrypt } from '@/lib/encrypt';

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const adminSession = await requireAdmin();

    const credential = await prisma.credential.findUnique({
      where: { id: params.id },
      include: { order: { select: { userId: true, planName: true } } },
    });

    if (!credential) return errorResponse('Credential not found', 404);

    // Log credential access
    await prisma.adminLog.create({
      data: {
        adminId: adminSession.user.id,
        action: 'VIEW_CREDENTIAL',
        details: { credentialId: params.id, orderId: credential.orderId },
      },
    });

    const decryptedPassword = decrypt(credential.password);

    return successResponse({
      ...credential,
      password: decryptedPassword,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
