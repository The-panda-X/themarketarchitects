export const dynamic = 'force-dynamic';
﻿import { type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin, handleApiError, successResponse, errorResponse } from '@/lib/api-helpers';

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();

    const user = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        orders: { orderBy: { createdAt: 'desc' }, take: 5 },
        challenges: { orderBy: { createdAt: 'desc' }, take: 5 },
        tickets: { orderBy: { createdAt: 'desc' }, take: 5 },
        referrals: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    });

    if (!user) return errorResponse('User not found', 404);

    // Omit password hash
    const { passwordHash: _pw, ...safeUser } = user as typeof user & { passwordHash?: string };
    return successResponse(safeUser);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminSession = await requireAdmin();
    const body = await req.json();
    const { role, name } = body;

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (role === 'USER' || role === 'ADMIN') updateData.role = role;

    const user = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      select: { id: true, email: true, name: true, role: true },
    });

    await prisma.adminLog.create({
      data: {
        adminId: adminSession.user.id,
        action: 'UPDATE_USER',
        details: JSON.parse(JSON.stringify({ userId: params.id, changes: updateData })),
      },
    });

    return successResponse(user);
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

    if (params.id === adminSession.user.id) {
      return errorResponse('You cannot delete your own account', 400);
    }

    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: { id: true, email: true, role: true },
    });
    if (!user) return errorResponse('User not found', 404);

    // Delete all user data in order
    await prisma.$transaction([
      prisma.notification.deleteMany({ where: { userId: params.id } }),
      prisma.supportTicket.deleteMany({ where: { userId: params.id } }),
      prisma.referral.deleteMany({ where: { referrerId: params.id } }),
      prisma.profitSplit.deleteMany({ where: { userId: params.id } }),
      prisma.dailyStat.deleteMany({ where: { challenge: { userId: params.id } } }),
      prisma.signalDelivery.deleteMany({ where: { challenge: { userId: params.id } } }),
      prisma.challenge.deleteMany({ where: { userId: params.id } }),
      prisma.credential.deleteMany({ where: { order: { userId: params.id } } }),
      prisma.payment.deleteMany({ where: { userId: params.id } }),
      prisma.order.deleteMany({ where: { userId: params.id } }),
      prisma.session.deleteMany({ where: { userId: params.id } }),
      prisma.account.deleteMany({ where: { userId: params.id } }),
      prisma.user.delete({ where: { id: params.id } }),
    ]);

    await prisma.adminLog.create({
      data: {
        adminId: adminSession.user.id,
        action: 'DELETE_USER',
        details: JSON.parse(JSON.stringify({ userId: params.id, email: user.email })),
      },
    });

    return successResponse({ deleted: true });
  } catch (err) {
    return handleApiError(err);
  }
}
