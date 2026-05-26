export const dynamic = 'force-dynamic';

import { type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireHeadAdmin, handleApiError, successResponse, errorResponse } from '@/lib/api-helpers';

/** PATCH – update a home service */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireHeadAdmin();
    const { id } = params;
    const body = await req.json();

    const allowed = ['title', 'description', 'icon', 'features', 'priceLabel', 'linkHref', 'linkText', 'sortOrder', 'isActive'];
    const data: Record<string, unknown> = {};
    for (const key of allowed) {
      if (body[key] !== undefined) data[key] = body[key];
    }

    if (Object.keys(data).length === 0) {
      return errorResponse('No fields to update', 400);
    }

    const service = await prisma.homeService.update({
      where: { id },
      data,
    });

    return successResponse(service);
  } catch (err) {
    return handleApiError(err);
  }
}

/** DELETE – delete a home service */
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireHeadAdmin();
    const { id } = params;

    await prisma.homeService.delete({ where: { id } });
    return successResponse({ deleted: true });
  } catch (err) {
    return handleApiError(err);
  }
}
