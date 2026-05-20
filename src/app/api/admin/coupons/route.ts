export const dynamic = 'force-dynamic';
import { type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin, handleApiError, successResponse, errorResponse } from '@/lib/api-helpers';
import { couponSchema } from '@/lib/validations';

export async function GET() {
  try {
    await requireAdmin();
    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return successResponse(coupons);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json();
    const parsed = couponSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0].message, 400);
    }

    const { code, discountPercent, discountAmount, maxUses, validUntil, isActive } = parsed.data;

    if (!discountPercent && !discountAmount) {
      return errorResponse('Either discountPercent or discountAmount is required', 400);
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: code.trim().toUpperCase(),
        discountPercent: discountPercent ?? null,
        discountAmount: discountAmount ?? null,
        maxUses: maxUses ?? null,
        validUntil: validUntil ? new Date(validUntil) : null,
        isActive,
      },
    });

    return successResponse(coupon, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
