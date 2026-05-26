export const dynamic = 'force-dynamic';

import { type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin, handleApiError, successResponse, errorResponse } from '@/lib/api-helpers';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();

    const body = await req.json() as {
      status:    'CONFIRMED' | 'DISPUTED' | 'REJECTED';
      adminNote?: string;
    };

    if (!['CONFIRMED', 'DISPUTED', 'REJECTED'].includes(body.status))
      return errorResponse('Invalid status', 400);

    const split = await prisma.profitSplit.findUnique({
      where: { id: params.id },
      include: { user: { select: { id: true, name: true } } },
    });
    if (!split) return errorResponse('Profit split not found', 404);

    const updated = await prisma.profitSplit.update({
      where: { id: params.id },
      data: {
        status:     body.status,
        adminNote:  body.adminNote ?? null,
        reviewedAt: new Date(),
      },
    });

    // Notify the client
    const msgMap: Record<string, string> = {
      CONFIRMED: `Your profit split payment of $${split.amountSent.toFixed(2)} ${split.currency} has been confirmed. Thank you!`,
      DISPUTED:  `Your profit split submission has been disputed. ${body.adminNote ?? 'Please contact support.'}`,
      REJECTED:  `Your profit split submission was rejected. ${body.adminNote ?? 'Please contact support.'}`,
    };
    const typeMap: Record<string, string> = {
      CONFIRMED: 'success',
      DISPUTED:  'warning',
      REJECTED:  'error',
    };

    await prisma.notification.create({
      data: {
        userId:  split.userId,
        title:   'Profit Split Update',
        message: msgMap[body.status],
        type:    typeMap[body.status],
        link:    '/dashboard/profit-split',
      },
    });

    return successResponse({ split: updated });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const adminSession = await requireAdmin();

    const split = await prisma.profitSplit.findUnique({
      where: { id: params.id },
      select: { id: true, userId: true, amountSent: true },
    });
    if (!split) return errorResponse('Profit split not found', 404);

    await prisma.profitSplit.delete({ where: { id: params.id } });

    await prisma.adminLog.create({
      data: {
        adminId: adminSession.user.id,
        action: 'DELETE_PROFIT_SPLIT',
        details: JSON.parse(JSON.stringify({ splitId: params.id, amountSent: split.amountSent })),
      },
    });

    return successResponse({ deleted: true });
  } catch (err) {
    return handleApiError(err);
  }
}
