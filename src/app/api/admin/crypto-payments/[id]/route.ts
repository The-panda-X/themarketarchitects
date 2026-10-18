export const dynamic = 'force-dynamic';
import { type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin, handleApiError, successResponse, errorResponse } from '@/lib/api-helpers';
import { creditReferralCommission } from '@/lib/referral';
import { sendOrderConfirmationEmail } from '@/lib/email';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminSession = await requireAdmin();
    const body = await req.json();
    const { action } = body as { action: 'approve' | 'reject' };

    if (!['approve', 'reject'].includes(action)) {
      return errorResponse('Invalid action. Must be "approve" or "reject".', 400);
    }

    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: { user: { select: { id: true, email: true, name: true } } },
    });
    if (!order) return errorResponse('Order not found', 404);

    if (action === 'approve') {
      await prisma.order.update({
        where: { id: params.id },
        data: { status: 'PAID' },
      });

      await prisma.notification.create({
        data: {
          userId: order.userId,
          title: 'Payment Verified',
          message: `Your crypto payment for ${order.planName} has been verified. Your order is now being processed.`,
          type: 'success',
          link: '/dashboard/payments',
        },
      });

      if (order.user.email) {
        await sendOrderConfirmationEmail(order.user.email, {
          orderId: order.id,
          planName: order.planName,
          amount: order.totalAmount,
        }).catch(() => {});
      }

      if (order.status !== 'PAID') {
        await creditReferralCommission(params.id);
      }
    } else {
      await prisma.order.update({
        where: { id: params.id },
        data: { status: 'CANCELLED' },
      });

      await prisma.notification.create({
        data: {
          userId: order.userId,
          title: 'Payment Rejected',
          message: `Your crypto payment for ${order.planName} could not be verified. Please contact support or try again.`,
          type: 'error',
          link: '/dashboard/payments',
        },
      });
    }

    await prisma.adminLog.create({
      data: {
        adminId: adminSession.user.id,
        action: action === 'approve' ? 'APPROVE_CRYPTO_PAYMENT' : 'REJECT_CRYPTO_PAYMENT',
        details: JSON.parse(JSON.stringify({
          orderId: params.id,
          planName: order.planName,
          amount: order.totalAmount,
          network: order.paymentNetwork,
          txId: order.cryptoTxId,
        })),
      },
    });

    return successResponse({ action, orderId: params.id });
  } catch (err) {
    return handleApiError(err);
  }
}
