export const dynamic = 'force-dynamic';
import { type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth, handleApiError, successResponse } from '@/lib/api-helpers';
import { OrderStatus } from '@/types';

const VALID_ORDER_STATUSES = new Set(Object.values(OrderStatus));

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();
    const { searchParams } = req.nextUrl;
    const statusParam = searchParams.get('status');

    const validStatuses = statusParam
      ? statusParam.split(',').filter((s) => VALID_ORDER_STATUSES.has(s as OrderStatus))
      : [];
    const statusFilter = validStatuses.length > 0
      ? { status: { in: validStatuses as OrderStatus[] } }
      : {};

    const orders = await prisma.order.findMany({
      where: { userId: session.user.id, ...statusFilter },
      include: { payments: { orderBy: { createdAt: 'desc' }, take: 1 } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return successResponse(orders);
  } catch (err) {
    return handleApiError(err);
  }
}
