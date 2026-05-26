export const dynamic = 'force-dynamic';

import { type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin, handleApiError, successResponse, errorResponse } from '@/lib/api-helpers';

export async function GET() {
  try {
    await requireAdmin();
    const firms = await prisma.propFirm.findMany({ orderBy: { sortOrder: 'asc' } });
    return successResponse(firms);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json();
    const { name, phases, accountSizes, sortOrder } = body;

    if (!name) return errorResponse('Firm name is required', 400);

    const firm = await prisma.propFirm.create({
      data: {
        name,
        phases: phases ?? 2,
        accountSizes: accountSizes ?? [],
        sortOrder: sortOrder ?? 0,
        isActive: true,
      },
    });

    return successResponse(firm, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
