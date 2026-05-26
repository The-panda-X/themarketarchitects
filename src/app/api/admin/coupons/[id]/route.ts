export const dynamic = 'force-dynamic';
import { type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin, requireHeadAdmin, handleApiError, successResponse, errorResponse } from '@/lib/api-helpers';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    const body = await req.json();

    const updateData: Record<string, unknown> = {};
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    if (body.maxUses !== undefined) updateData.maxUses = body.maxUses ? parseInt(body.maxUses) : null;
    if (body.validUntil !== undefined) updateData.validUntil = body.validUntil ? new Date(body.validUntil) : null;

    const coupon = await prisma.coupon.update({ where: { id: params.id }, data: updateData });
    return successResponse(coupon);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireHeadAdmin();
    await prisma.coupon.delete({ where: { id: params.id } });
    return successResponse({ deleted: true });
  } catch (err) {
    return handleApiError(err);
  }
}
