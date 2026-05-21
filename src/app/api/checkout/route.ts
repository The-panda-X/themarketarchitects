export const dynamic = 'force-dynamic';
import { type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth, handleApiError, successResponse, errorResponse } from '@/lib/api-helpers';
import { CHALLENGE_PASSING_PLANS, ACCOUNT_MANAGEMENT_PLANS, ACCOUNT_GROWTH_PLANS } from '@/lib/constants';

const ALL_PLANS = [...CHALLENGE_PASSING_PLANS, ...ACCOUNT_MANAGEMENT_PLANS, ...ACCOUNT_GROWTH_PLANS];

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await req.json();
    const { serviceType, planName, planId, tier, accountSize, firmName, couponCode } = body;

    if (!serviceType || !planName || !planId) {
      return errorResponse('Missing required fields', 400);
    }

    const plan = ALL_PLANS.find((p) => p.id === planId);
    if (!plan) return errorResponse('Invalid plan', 400);

    const isProfitSplit = !plan.price && !!plan.priceLabel;
    const canonicalPrice = plan.price ?? 0;

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, name: true },
    });
    if (!user) return errorResponse('User not found', 404);

    let discountAmount = 0;
    let finalPrice = canonicalPrice;
    let appliedCouponCode: string | null = null;

    if (couponCode && canonicalPrice > 0) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: couponCode.trim().toUpperCase() },
      });
      if (!coupon || !coupon.isActive) return errorResponse('Invalid or inactive coupon', 400);
      if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) return errorResponse('Coupon usage limit reached', 400);
      if (coupon.validUntil && new Date() > new Date(coupon.validUntil)) return errorResponse('Coupon has expired', 400);
      if (coupon.validFrom && new Date() < new Date(coupon.validFrom)) return errorResponse('Coupon is not yet active', 400);

      if (coupon.discountPercent) discountAmount = (canonicalPrice * coupon.discountPercent) / 100;
      else if (coupon.discountAmount) discountAmount = Math.min(coupon.discountAmount, canonicalPrice);
      finalPrice = Math.max(0, canonicalPrice - discountAmount);
      appliedCouponCode = coupon.code;
    }

    // ── Profit-split plans: no payment needed ──
    if (isProfitSplit) {
      const order = await prisma.order.create({
        data: {
          userId: session.user.id,
          serviceType,
          planName,
          planDetails: { tier, planId, features: plan.features },
          accountSize: accountSize ?? null,
          firmName: firmName ?? null,
          status: 'PAID',
          totalAmount: 0,
          discountAmount: 0,
          couponCode: null,
          notes: plan.priceLabel ?? 'Profit Split Agreement',
        },
      });

      await prisma.notification.create({
        data: {
          userId: session.user.id,
          title: 'Agreement Submitted',
          message: `Your ${planName} agreement has been received. Our team will contact you within 24 hours.`,
          type: 'success',
          link: '/dashboard/payments',
        },
      });

      return successResponse({ orderId: order.id, type: 'profit_split' }, 201);
    }

    // ── Paid plans: create order, return crypto payment instructions ──
    const order = await prisma.order.create({
      data: {
        userId: session.user.id,
        serviceType,
        planName,
        planDetails: { tier, planId, features: plan.features },
        accountSize: accountSize ?? null,
        firmName: firmName ?? null,
        status: 'PENDING_PAYMENT',
        totalAmount: finalPrice,
        discountAmount,
        couponCode: appliedCouponCode,
        notes: 'Awaiting crypto payment confirmation',
      },
    });

    await prisma.notification.create({
      data: {
        userId: session.user.id,
        title: 'Order Created',
        message: `Your order for ${planName} has been created. Please complete your crypto payment to proceed.`,
        type: 'info',
        link: '/dashboard/payments',
      },
    });

    return successResponse({
      orderId: order.id,
      type: 'crypto',
      amount: finalPrice,
      planName,
    }, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
