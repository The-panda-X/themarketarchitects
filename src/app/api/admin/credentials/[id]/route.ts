export const dynamic = 'force-dynamic';
import prisma from '@/lib/prisma';
import { requireAdmin, requireHeadAdmin, handleApiError, successResponse, errorResponse } from '@/lib/api-helpers';
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

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const adminSession = await requireHeadAdmin();

    const credential = await prisma.credential.findUnique({
      where: { id: params.id },
      select: { id: true, platform: true, orderId: true },
    });
    if (!credential) return errorResponse('Credential not found', 404);

    await prisma.credential.delete({ where: { id: params.id } });

    await prisma.adminLog.create({
      data: {
        adminId: adminSession.user.id,
        action: 'DELETE_CREDENTIAL',
        details: JSON.parse(JSON.stringify({ credentialId: params.id, platform: credential.platform })),
      },
    });

    return successResponse({ deleted: true });
  } catch (err) {
    return handleApiError(err);
  }
}
