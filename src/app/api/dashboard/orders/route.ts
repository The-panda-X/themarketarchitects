export const dynamic = 'force-dynamic';
﻿import { type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth, handleApiError, successResponse } from '@/lib/api-helpers';

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();
    const { searchParams } = req.nextUrl;
    const statusParam = searchParams.get('status');

    const statusFilter = statusParam
      ? { status: { in: statusParam.split(',') as never[] } }
      : {};

    const orders = await prisma.order.findMany({
      where: { userId: session.user.id, ...statusFilter },
      include: { payments: { orderBy: { createdAt: 'desc' }, take: 1 } },
      orderBy: { createdAt: 'desc' },
    });

    return successResponse(orders);
  } catch (err) {
    return handleApiError(err);
  }
}
