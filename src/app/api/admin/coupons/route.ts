export const dynamic = 'force-dynamic';
import { type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin, handleApiError, successResponse, errorResponse } from '@/lib/api-helpers';

export async function GET() {
  try {
    await requireAdmin();
    const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
    return successResponse(coupons);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json();
    const { code, discountPercent, discountAmount, maxUses, validUntil } = body;

    if (!code?.trim()) return errorResponse('Coupon code is required', 400);
    if (!discountPercent && !discountAmount) {
      return errorResponse('Either discountPercent or discountAmount is required', 400);
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: code.trim().toUpperCase(),
        discountPercent: discountPercent ? parseFloat(discountPercent) : null,
        discountAmount: discountAmount ? parseFloat(discountAmount) : null,
        maxUses: maxUses ? parseInt(maxUses) : null,
        validUntil: validUntil ? new Date(validUntil) : null,
      },
    });

    return successResponse(coupon, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
