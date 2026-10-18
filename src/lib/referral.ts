import prisma from '@/lib/prisma';

/** Flat 20% commission rate on every paid referred order. */
export const REFERRAL_COMMISSION_RATE = 0.2;

/** Service types that are refundable security deposits — no referral commission. */
const EXCLUDED_SERVICE_TYPES = ['ACCOUNT_MANAGEMENT', 'ACCOUNT_GROWTH'];

interface CreditResult {
  credited: boolean;
  amount?: number;
  reason?: string;
}

/**
 * Credit the referrer's commission balance for a paid order.
 *
 * Idempotent: if a paid Referral row already exists for this orderId,
 * the function is a no-op. Safe to call from multiple places (Stripe
 * webhook, admin status change, profit-split checkout).
 *
 * Rules:
 *   - Order must have a positive totalAmount
 *   - Order's user must have `referredBy` set
 *   - The referrer must exist
 *   - Self-referrals are blocked
 */
export async function creditReferralCommission(orderId: string): Promise<CreditResult> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      totalAmount: true,
      planName: true,
      serviceType: true,
      user: {
        select: { id: true, email: true, referredBy: true },
      },
    },
  });

  if (!order) return { credited: false, reason: 'order_not_found' };
  if (order.serviceType && EXCLUDED_SERVICE_TYPES.includes(order.serviceType)) {
    return { credited: false, reason: 'excluded_service_type' };
  }
  if (order.totalAmount <= 0) return { credited: false, reason: 'zero_amount' };

  const referrerId = order.user.referredBy;
  if (!referrerId) return { credited: false, reason: 'no_referrer' };
  if (referrerId === order.user.id) return { credited: false, reason: 'self_referral' };

  // Idempotency: have we already credited for this order?
  const existingPaid = await prisma.referral.findFirst({
    where: { orderId: order.id, paid: true },
  });
  if (existingPaid) return { credited: false, reason: 'already_credited' };

  const referrer = await prisma.user.findUnique({
    where: { id: referrerId },
    select: { id: true, email: true },
  });
  if (!referrer) return { credited: false, reason: 'referrer_missing' };

  const commission = Number((order.totalAmount * REFERRAL_COMMISSION_RATE).toFixed(2));

  // Try to update the pre-existing Referral row created at signup. If none
  // exists (rare — older accounts or direct DB inserts), create one.
  await prisma.$transaction(async (tx) => {
    const updated = await tx.referral.updateMany({
      where: {
        referrerId,
        referredEmail: order.user.email,
        paid: false,
        OR: [{ orderId: null }, { orderId: order.id }],
      },
      data: {
        orderId: order.id,
        commission,
        paid: true,
      },
    });

    if (updated.count === 0) {
      await tx.referral.create({
        data: {
          referrerId,
          referredEmail: order.user.email,
          orderId: order.id,
          commission,
          paid: true,
        },
      });
    }

    await tx.user.update({
      where: { id: referrerId },
      data: { referralBalance: { increment: commission } },
    });

    await tx.notification.create({
      data: {
        userId: referrerId,
        title: 'Referral Commission Earned',
        message: `You earned $${commission.toFixed(2)} from a referred client's purchase of ${order.planName}.`,
        type: 'success',
        link: '/dashboard/referrals',
      },
    });
  });

  return { credited: true, amount: commission };
}
