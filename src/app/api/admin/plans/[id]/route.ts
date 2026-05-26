export const dynamic = 'force-dynamic';

import { type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin, requireHeadAdmin, handleApiError, successResponse, errorResponse } from '@/lib/api-helpers';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
    const plan = await prisma.servicePlan.findUnique({ where: { id: params.id } });
    if (!plan) return errorResponse('Plan not found', 404);
    return successResponse(plan);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
    const body = await req.json();

    const existing = await prisma.servicePlan.findUnique({ where: { id: params.id } });
    if (!existing) return errorResponse('Plan not found', 404);

    const updateData: Record<string, unknown> = {};
    const fields = ['name', 'tier', 'serviceType', 'price', 'originalPrice', 'priceLabel', 'description', 'features', 'popular', 'accountSizes', 'sizePricing', 'guarantee', 'successRate', 'deliveryDays', 'sortOrder', 'isActive'];
    for (const field of fields) {
      if (body[field] !== undefined) updateData[field] = body[field];
    }

    const plan = await prisma.servicePlan.update({ where: { id: params.id }, data: updateData });
    return successResponse(plan);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    await requireHeadAdmin();
    await prisma.servicePlan.delete({ where: { id: params.id } });
    return successResponse({ deleted: true });
  } catch (err) {
    return handleApiError(err);
  }
}
