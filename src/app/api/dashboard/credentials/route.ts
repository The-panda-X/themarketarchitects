import { type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth, handleApiError, successResponse, errorResponse } from '@/lib/api-helpers';
import { credentialSchema } from '@/lib/validations';
import { encrypt } from '@/lib/encrypt';

export async function GET() {
  try {
    const session = await requireAuth();

    const credentials = await prisma.credential.findMany({
      where: { order: { userId: session.user.id } },
      select: {
        id: true,
        orderId: true,
        platform: true,
        server: true,
        loginId: true,
        notes: true,
        submittedAt: true,
        // password intentionally excluded from list view
      },
      orderBy: { submittedAt: 'desc' },
    });

    return successResponse(credentials);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await req.json();
    const parsed = credentialSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0].message, 400);
    }

    const { orderId, platform, server, loginId, password, notes } = parsed.data;

    // Verify order belongs to user
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId: session.user.id },
    });
    if (!order) return errorResponse('Order not found', 404);

    const encryptedPassword = encrypt(password);

    const credential = await prisma.credential.create({
      data: {
        orderId,
        platform,
        server: server ?? null,
        loginId,
        password: encryptedPassword,
        notes: notes ?? null,
      },
      select: {
        id: true,
        orderId: true,
        platform: true,
        server: true,
        loginId: true,
        notes: true,
        submittedAt: true,
      },
    });

    return successResponse(credential, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
