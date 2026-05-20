export const dynamic = 'force-dynamic';
import { type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { createCheckoutSession } from '@/lib/stripe';
import { requireAuth, handleApiError, successResponse, errorResponse } from '@/lib/api-helpers';
import { SITE_CONFIG, CHALLENGE_PASSING_PLANS, ACCOUNT_MANAGEMENT_PLANS } from '@/lib/constants';

const ALL_PLANS = [...CHALLENGE_PASSING_PLANS, ...ACCOUNT_MANAGEMENT_PLANS];

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await req.json();
    const { serviceType, planName, planId, tier, accountSize, firmName, couponCode } = body;

    if (!serviceType || !planName || !planId) {
      return errorResponse('Missing required fields', 400);
    }

    const plan = ALL_PLANS.find((p) => p.id === planId);
    if (!plan) {
      return errorResponse('Invalid plan', 400);
    }
    const canonicalPrice = plan.price;

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, name: true },
    });
    if (!user) return errorResponse('User not found', 404);

    let discountAmount = 0;
    let finalPrice = canonicalPrice;
    let appliedCouponCode: string | null = null;

    if (couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: couponCode.trim().toUpperCase() },
      });

      if (!coupon || !coupon.isActive) {
        return errorResponse('Invalid or inactive coupon', 400);
      }
      if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
        return errorResponse('Coupon usage limit reached', 400);
      }
      if (coupon.validUntil && new Date() > new Date(coupon.validUntil)) {
        return errorResponse('Coupon has expired', 400);
      }
      if (coupon.validFrom && new Date() < new Date(coupon.validFrom)) {
        return errorResponse('Coupon is not yet active', 400);
      }

      if (coupon.discountPercent) {
        discountAmount = (canonicalPrice * coupon.discountPercent) / 100;
      } else if (coupon.discountAmount) {
        discountAmount = Math.min(coupon.discountAmount, canonicalPrice);
      }
      finalPrice = Math.max(0, canonicalPrice - discountAmount);
      appliedCouponCode = coupon.code;
    }

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
      },
    });

    const baseUrl = SITE_CONFIG.url;
    const stripeSession = await createCheckoutSession({
      priceAmount: finalPrice,
      productName: `${planName}${accountSize ? ` — ${accountSize}` : ''}`,
      customerEmail: user.email,
      metadata: {
        orderId: order.id,
        userId: session.user.id,
        serviceType,
        planName,
        couponCode: appliedCouponCode ?? '',
      },
      successUrl: `${baseUrl}/dashboard/payments?success=1&orderId=${order.id}`,
      cancelUrl: `${baseUrl}/dashboard/purchase?cancelled=1`,
    });

    return successResponse(stripeSession, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
