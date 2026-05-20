import { type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { createCheckoutSession } from '@/lib/stripe';
import { requireAuth, handleApiError, successResponse, errorResponse } from '@/lib/api-helpers';
import { SITE_CONFIG } from '@/lib/constants';

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await req.json();
    const { serviceType, planName, planId, tier, accountSize, firmName, couponCode, price } = body;

    if (!serviceType || !planName || !price) {
      return errorResponse('Missing required fields', 400);
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, name: true },
    });
    if (!user) return errorResponse('User not found', 404);

    // Apply coupon if provided
    let discountAmount = 0;
    let finalPrice = price;
    if (couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: couponCode.trim().toUpperCase() },
      });
      if (coupon?.isActive) {
        if (coupon.discountPercent) {
          discountAmount = (price * coupon.discountPercent) / 100;
        } else if (coupon.discountAmount) {
          discountAmount = Math.min(coupon.discountAmount, price);
        }
        finalPrice = Math.max(0, price - discountAmount);
        // Increment coupon usage
        await prisma.coupon.update({
          where: { id: coupon.id },
          data: { usedCount: { increment: 1 } },
        });
      }
    }

    // Create pending order
    const order = await prisma.order.create({
      data: {
        userId: session.user.id,
        serviceType,
        planName,
        planDetails: { tier, planId, features: [] },
        accountSize: accountSize ?? null,
        firmName: firmName ?? null,
        status: 'PENDING_PAYMENT',
        totalAmount: finalPrice,
        discountAmount,
        couponCode: couponCode ?? null,
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
      },
      successUrl: `${baseUrl}/dashboard/payments?success=1&orderId=${order.id}`,
      cancelUrl: `${baseUrl}/dashboard/purchase?cancelled=1`,
    });

    return successResponse(stripeSession, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
