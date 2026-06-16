export const dynamic = 'force-dynamic';

import { type NextRequest } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { requireAuth, handleApiError, successResponse, errorResponse } from '@/lib/api-helpers';
import { notifyAdmins } from '@/lib/admin-notify';

export const MIN_PAYOUT = 50;

const PAYOUT_METHODS = ['USDT_TRC20', 'USDT_BEP20'] as const;

const createSchema = z.object({
  amount: z.number().positive('Amount must be greater than zero'),
  method: z.enum(PAYOUT_METHODS),
  wallet: z.string().trim().min(10, 'Wallet address looks too short').max(120),
});

/** GET — list the current user's payout requests */
export async function GET() {
  try {
    const session = await requireAuth();
    const [user, payouts] = await Promise.all([
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: { referralBalance: true },
      }),
      prisma.referralPayout.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
    ]);
    return successResponse({
      balance: user?.referralBalance ?? 0,
      minPayout: MIN_PAYOUT,
      payouts,
    });
  } catch (err) {
    return handleApiError(err);
  }
}

/** POST — create a new payout request, debit from referralBalance */
export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0].message, 400);
    }
    const { amount, method, wallet } = parsed.data;

    if (amount < MIN_PAYOUT) {
      return errorResponse(`Minimum payout is $${MIN_PAYOUT}`, 400);
    }

    // Round to 2dp to avoid floating-point drift
    const rounded = Number(amount.toFixed(2));

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { referralBalance: true, email: true, name: true },
    });
    if (!user) return errorResponse('User not found', 404);

    if (rounded > user.referralBalance) {
      return errorResponse('Amount exceeds your available balance', 400);
    }

    // Atomic: deduct balance + create payout in one transaction
    const payout = await prisma.$transaction(async (tx) => {
      // Re-check balance inside the transaction
      const fresh = await tx.user.findUnique({
        where: { id: session.user.id },
        select: { referralBalance: true },
      });
      if (!fresh || rounded > fresh.referralBalance) {
        throw new Error('Balance check failed');
      }

      await tx.user.update({
        where: { id: session.user.id },
        data: { referralBalance: { decrement: rounded } },
      });

      return tx.referralPayout.create({
        data: {
          userId: session.user.id,
          amount: rounded,
          method,
          wallet,
          status: 'PENDING',
        },
      });
    });

    // Notify admins (best-effort)
    await notifyAdmins({
      title: 'Referral Payout Requested',
      message: `${user.name ?? user.email} requested a $${rounded.toFixed(2)} payout (${method}).`,
      type: 'payment',
      link: '/admin/referrals',
    });

    return successResponse(payout, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
