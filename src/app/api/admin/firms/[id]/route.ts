export const dynamic = 'force-dynamic';

import { type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin, requireHeadAdmin, handleApiError, successResponse, errorResponse } from '@/lib/api-helpers';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
    const body = await req.json();

    const existing = await prisma.propFirm.findUnique({ where: { id: params.id } });
    if (!existing) return errorResponse('Firm not found', 404);

    const updateData: Record<string, unknown> = {};
    for (const field of ['name', 'phases', 'accountSizes', 'sortOrder', 'isActive']) {
      if (body[field] !== undefined) updateData[field] = body[field];
    }

    const firm = await prisma.propFirm.update({ where: { id: params.id }, data: updateData });
    return successResponse(firm);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    await requireHeadAdmin();
    await prisma.propFirm.delete({ where: { id: params.id } });
    return successResponse({ deleted: true });
  } catch (err) {
    return handleApiError(err);
  }
}
