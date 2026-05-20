export const dynamic = 'force-dynamic';
﻿import { type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth, handleApiError, successResponse, errorResponse } from '@/lib/api-helpers';

export async function POST(req: NextRequest) {
  try {
    await requireAuth();
    const { code, amount } = await req.json();

    if (!code || typeof code !== 'string') {
      return errorResponse('Coupon code is required', 400);
    }

    const coupon = await prisma.coupon.findUnique({
      where: { code: code.trim().toUpperCase() },
    });

    if (!coupon || !coupon.isActive) {
      return errorResponse('Invalid or expired coupon code', 400);
    }

    const now = new Date();
    if (coupon.validFrom > now) {
      return errorResponse('Coupon is not yet active', 400);
    }
    if (coupon.validUntil && coupon.validUntil < now) {
      return errorResponse('Coupon has expired', 400);
    }
    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
      return errorResponse('Coupon has reached its usage limit', 400);
    }

    const orderAmount = typeof amount === 'number' ? amount : 0;
    let discountAmount = 0;

    if (coupon.discountPercent) {
      discountAmount = (orderAmount * coupon.discountPercent) / 100;
    } else if (coupon.discountAmount) {
      discountAmount = Math.min(coupon.discountAmount, orderAmount);
    }

    return successResponse({
      valid: true,
      code: coupon.code,
      discountPercent: coupon.discountPercent,
      discountAmount,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
