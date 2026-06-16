export const dynamic = 'force-dynamic';
import { type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin, requireModerator, requireHeadAdmin, handleApiError, successResponse, errorResponse } from '@/lib/api-helpers';
import { OrderStatus } from '@/types';
import { creditReferralCommission } from '@/lib/referral';

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireModerator();

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
    if (status) {
      if (!Object.values(OrderStatus).includes(status)) {
        return errorResponse('Invalid order status', 400);
      }
      updateData.status = status;
    }
    if (notes !== undefined) updateData.notes = notes;

    const existing = await prisma.order.findUnique({ where: { id: params.id } });
    if (!existing) return errorResponse('Order not found', 404);

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

    // Credit referral commission on transition to PAID (idempotent — safe to call
    // even if already credited from the Stripe webhook).
    if (status === 'PAID' && existing.status !== 'PAID') {
      await creditReferralCommission(params.id);
    }

    return successResponse(order);
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

    const order = await prisma.order.findUnique({
      where: { id: params.id },
      select: { id: true, planName: true },
    });
    if (!order) return errorResponse('Order not found', 404);

    await prisma.$transaction([
      prisma.credential.deleteMany({ where: { orderId: params.id } }),
      prisma.payment.deleteMany({ where: { orderId: params.id } }),
      prisma.profitSplit.deleteMany({ where: { orderId: params.id } }),
      prisma.dailyStat.deleteMany({ where: { challenge: { orderId: params.id } } }),
      prisma.signalDelivery.deleteMany({ where: { challenge: { orderId: params.id } } }),
      prisma.challenge.deleteMany({ where: { orderId: params.id } }),
      prisma.order.delete({ where: { id: params.id } }),
    ]);

    await prisma.adminLog.create({
      data: {
        adminId: adminSession.user.id,
        action: 'DELETE_ORDER',
        details: JSON.parse(JSON.stringify({ orderId: params.id, planName: order.planName })),
      },
    });

    return successResponse({ deleted: true });
  } catch (err) {
    return handleApiError(err);
  }
}
