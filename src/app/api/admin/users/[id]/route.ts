export const dynamic = 'force-dynamic';
﻿import { type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin, requireHeadAdmin, getAuthSession, handleApiError, successResponse, errorResponse, isHeadAdmin, getSessionRole } from '@/lib/api-helpers';

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAdmin();
    const viewerRole = getSessionRole(session as { user: { role?: string } });

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

    // Hide HEAD_ADMIN users from non-HEAD_ADMIN viewers
    if ((user.role as string) === 'HEAD_ADMIN' && !isHeadAdmin(viewerRole)) {
      return errorResponse('User not found', 404);
    }

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
    const { role, name, canOverrideRisk, canSendSignals } = body;
    const viewerRole = getSessionRole(adminSession as { user: { role?: string } });

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (typeof canOverrideRisk === 'boolean') updateData.canOverrideRisk = canOverrideRisk;
    if (typeof canSendSignals === 'boolean') updateData.canSendSignals = canSendSignals;

    // Role assignment restrictions
    if (role) {
      const validRoles = ['USER', 'TRADER', 'MODERATOR', 'ADMIN', 'HEAD_ADMIN'];
      if (!validRoles.includes(role)) {
        return errorResponse('Invalid role', 400);
      }
      // Only HEAD_ADMIN can assign HEAD_ADMIN role
      if (role === 'HEAD_ADMIN' && !isHeadAdmin(viewerRole)) {
        return errorResponse('Forbidden', 403);
      }
      // Only HEAD_ADMIN can assign ADMIN role
      if (role === 'ADMIN' && !isHeadAdmin(viewerRole)) {
        return errorResponse('Forbidden', 403);
      }
      // Prevent non-HEAD_ADMIN from changing a HEAD_ADMIN user's role
      const target = await prisma.user.findUnique({ where: { id: params.id }, select: { role: true } });
      if ((target?.role as string) === 'HEAD_ADMIN' && !isHeadAdmin(viewerRole)) {
        return errorResponse('Forbidden', 403);
      }
      updateData.role = role;
    }

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
    const adminSession = await requireHeadAdmin();

    if (params.id === adminSession.user.id) {
      return errorResponse('You cannot delete your own account', 400);
    }

    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: { id: true, email: true, role: true },
    });
    if (!user) return errorResponse('User not found', 404);

    // Prevent deleting another HEAD_ADMIN
    if ((user.role as string) === 'HEAD_ADMIN') {
      return errorResponse('Cannot delete a Head Admin account', 400);
    }

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
