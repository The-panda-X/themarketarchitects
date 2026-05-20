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

    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        user: { select: { id: true, email: true, name: true } },
        payments: true,
        challenge: true,
        credentials: { select: { id: true, platform: true, server: true, loginId: true, submittedAt: true } },
      },
    });

    if (!order) return errorResponse('Order not found', 404);
    return successResponse(order);
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
    const { status, notes } = body;

    const updateData: Record<string, unknown> = {};
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;

    const order = await prisma.order.update({
      where: { id: params.id },
      data: updateData,
    });

    await prisma.adminLog.create({
      data: {
        adminId: adminSession.user.id,
        action: 'UPDATE_ORDER',
        details: JSON.parse(JSON.stringify({ orderId: params.id, changes: updateData })),
      },
    });

    // Notify user on status change
    if (status) {
      await prisma.notification.create({
        data: {
          userId: order.userId,
          title: 'Order Updated',
          message: `Your order for ${order.planName} status has been updated to ${status.replace('_', ' ')}.`,
          type: 'info',
          link: '/dashboard/payments',
        },
      });
    }

    return successResponse(order);
  } catch (err) {
    return handleApiError(err);
  }
}
