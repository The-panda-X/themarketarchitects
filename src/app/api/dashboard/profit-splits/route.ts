export const dynamic = 'force-dynamic';

import { type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth, handleApiError, successResponse, errorResponse } from '@/lib/api-helpers';

export async function GET() {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    const splits = await prisma.profitSplit.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        challenge: { select: { firmName: true, accountSize: true } },
        order:     { select: { planName: true, serviceType: true } },
      },
    });

    // Also fetch accounts eligible for profit split:
    // 1. FUNDED challenges
    // 2. IN_PROGRESS / COMPLETED Account Management orders
    const [fundedChallenges, amOrders] = await Promise.all([
      prisma.challenge.findMany({
        where: { userId, status: 'FUNDED' },
        select: { id: true, firmName: true, accountSize: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.order.findMany({
        where: {
          userId,
          serviceType: 'ACCOUNT_MANAGEMENT',
          status: { in: ['IN_PROGRESS', 'COMPLETED'] },
        },
        select: { id: true, planName: true, accountSize: true, firmName: true },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const totalConfirmed = splits
      .filter((s) => s.status === 'CONFIRMED')
      .reduce((sum, s) => sum + s.amountSent, 0);

    return successResponse({ splits, fundedChallenges, amOrders, totalConfirmed });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const userId = session.user.id;

    const body = await req.json() as {
      challengeId?:  string;
      orderId?:      string;
      totalPayout:   number;
      splitPercent:  number;
      amountSent:    number;
      currency?:     string;
      network?:      string;
      txHash?:       string;
      proofImage?:   string;
      notes?:        string;
    };

    const { totalPayout, splitPercent, amountSent } = body;

    if (!totalPayout || totalPayout <= 0)
      return errorResponse('Total payout must be greater than 0', 400);
    if (!splitPercent || splitPercent <= 0 || splitPercent > 100)
      return errorResponse('Split percent must be between 1 and 100', 400);
    if (!amountSent || amountSent <= 0)
      return errorResponse('Amount sent must be greater than 0', 400);
    if (!body.challengeId && !body.orderId)
      return errorResponse('challengeId or orderId is required', 400);

    // Verify ownership
    if (body.challengeId) {
      const ch = await prisma.challenge.findFirst({
        where: { id: body.challengeId, userId, status: 'FUNDED' },
      });
      if (!ch) return errorResponse('Funded challenge not found', 404);
    }
    if (body.orderId) {
      const ord = await prisma.order.findFirst({
        where: {
          id: body.orderId,
          userId,
          serviceType: 'ACCOUNT_MANAGEMENT',
          status: { in: ['IN_PROGRESS', 'COMPLETED'] },
        },
      });
      if (!ord) return errorResponse('Account Management order not found', 404);
    }

    const amountDue = Math.round((totalPayout * splitPercent) / 100 * 100) / 100;

    const split = await prisma.profitSplit.create({
      data: {
        userId,
        challengeId:  body.challengeId  ?? null,
        orderId:      body.orderId      ?? null,
        totalPayout,
        splitPercent,
        amountDue,
        amountSent,
        currency:    body.currency  ?? 'USDT',
        network:     body.network   ?? null,
        txHash:      body.txHash    ?? null,
        proofImage:  body.proofImage ?? null,
        notes:       body.notes     ?? null,
      },
    });

    // Notify admin via notification to admin users
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true },
    });
    if (admins.length > 0) {
      await prisma.notification.createMany({
        data: admins.map((a) => ({
          userId:  a.id,
          title:   'New Profit Split Submission',
          message: `A client submitted a profit split payment of $${amountSent.toFixed(2)} ${body.currency ?? 'USDT'} (due: $${amountDue.toFixed(2)}).`,
          type:    'info',
          link:    '/admin/payouts',
        })),
      });
    }

    return successResponse({ split }, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
