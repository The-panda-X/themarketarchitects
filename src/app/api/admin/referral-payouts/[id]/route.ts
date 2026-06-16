export const dynamic = 'force-dynamic';

import { type NextRequest } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { requireAdmin, handleApiError, successResponse, errorResponse } from '@/lib/api-helpers';

const actionSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('pay'),
    txHash: z.string().trim().min(4, 'Transaction hash is required').max(200),
    adminNote: z.string().max(500).optional().nullable(),
  }),
  z.object({
    action: z.literal('reject'),
    adminNote: z.string().trim().min(3, 'Reason is required').max(500),
  }),
]);

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAdmin();
    const body = await req.json();
    const parsed = actionSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0].message, 400);
    }

    const payout = await prisma.referralPayout.findUnique({
      where: { id: params.id },
      include: { user: { select: { id: true, email: true, name: true } } },
    });
    if (!payout) return errorResponse('Payout not found', 404);
    if (payout.status !== 'PENDING') {
      return errorResponse('Payout is already processed', 400);
    }

    if (parsed.data.action === 'pay') {
      // Mark as PAID. Balance was already debited at request time, so nothing to refund.
      const updated = await prisma.$transaction(async (tx) => {
        const u = await tx.referralPayout.update({
          where: { id: params.id },
          data: {
            status: 'PAID',
            txHash: parsed.data.action === 'pay' ? parsed.data.txHash : null,
            adminNote: parsed.data.adminNote ?? null,
            processedBy: session.user.id,
            processedAt: new Date(),
          },
        });

        await tx.notification.create({
          data: {
            userId: payout.userId,
            title: 'Referral Payout Sent',
            message: `Your $${payout.amount.toFixed(2)} payout has been sent to ${payout.wallet.slice(0, 10)}…${payout.wallet.slice(-6)}.`,
            type: 'success',
            link: '/dashboard/referrals',
          },
        });

        await tx.adminLog.create({
          data: {
            adminId: session.user.id,
            action: 'PAY_REFERRAL_PAYOUT',
            details: JSON.parse(JSON.stringify({
              payoutId: params.id,
              userId: payout.userId,
              amount: payout.amount,
              method: payout.method,
              txHash: parsed.data.action === 'pay' ? parsed.data.txHash : null,
            })),
          },
        });

        return u;
      });

      return successResponse(updated);
    }

    // action === 'reject' — refund balance to user
    const updated = await prisma.$transaction(async (tx) => {
      const u = await tx.referralPayout.update({
        where: { id: params.id },
        data: {
          status: 'REJECTED',
          adminNote: parsed.data.action === 'reject' ? parsed.data.adminNote : null,
          processedBy: session.user.id,
          processedAt: new Date(),
        },
      });

      await tx.user.update({
        where: { id: payout.userId },
        data: { referralBalance: { increment: payout.amount } },
      });

      await tx.notification.create({
        data: {
          userId: payout.userId,
          title: 'Referral Payout Declined',
          message: `Your $${payout.amount.toFixed(2)} payout was declined. The amount has been returned to your referral balance.`,
          type: 'warning',
          link: '/dashboard/referrals',
        },
      });

      await tx.adminLog.create({
        data: {
          adminId: session.user.id,
          action: 'REJECT_REFERRAL_PAYOUT',
          details: JSON.parse(JSON.stringify({
            payoutId: params.id,
            userId: payout.userId,
            amount: payout.amount,
            reason: parsed.data.action === 'reject' ? parsed.data.adminNote : null,
          })),
        },
      });

      return u;
    });

    return successResponse(updated);
  } catch (err) {
    return handleApiError(err);
  }
}
