export const dynamic = 'force-dynamic';

import { type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth, handleApiError, successResponse, errorResponse } from '@/lib/api-helpers';
import { uploadProofImage } from '@/lib/storage';

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

function deriveSplitPercent(planName: string, serviceType: string): number {
  const p = planName.toLowerCase();
  if (serviceType === 'ACCOUNT_MANAGEMENT') {
    if (p.includes('pro')) return 15;
    return 20;
  }
  if (p.includes('elite')) return 20;
  if (p.includes('pro'))   return 25;
  return 30;
}

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

    const [fundedChallenges, amOrders] = await Promise.all([
      prisma.challenge.findMany({
        where: { userId, status: 'FUNDED' },
        select: {
          id: true, firmName: true, accountSize: true,
          order: { select: { planName: true, serviceType: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.order.findMany({
        where: {
          userId,
          serviceType: 'ACCOUNT_MANAGEMENT',
          status: { in: ['IN_PROGRESS', 'COMPLETED'] },
        },
        select: { id: true, planName: true, accountSize: true, firmName: true, serviceType: true },
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

    const formData = await req.formData();

    const challengeId = formData.get('challengeId') as string | null;
    const orderId     = formData.get('orderId')     as string | null;
    const totalPayout = parseFloat(formData.get('totalPayout') as string || '0');
    const amountSent  = parseFloat(formData.get('amountSent')  as string || '0');
    const currency    = (formData.get('currency') as string) || 'USDT';
    const network     = formData.get('network')  as string | null;
    const txHash      = formData.get('txHash')   as string | null;
    const notes       = formData.get('notes')    as string | null;
    const file        = formData.get('proofImage') as File | null;

    if (!challengeId && !orderId)
      return errorResponse('challengeId or orderId is required', 400);
    if (!totalPayout || totalPayout <= 0)
      return errorResponse('Total payout must be greater than 0', 400);
    if (!amountSent || amountSent <= 0)
      return errorResponse('Amount sent must be greater than 0', 400);
    if (!file)
      return errorResponse('Proof screenshot is required', 400);
    if (!ALLOWED_TYPES.includes(file.type))
      return errorResponse('Invalid file type. Allowed: JPG, PNG, WebP, GIF', 400);
    if (file.size > MAX_SIZE)
      return errorResponse('File too large (max 5MB)', 400);

    // Look up the linked order to derive split %
    let splitPercent = 25;
    if (challengeId) {
      const ch = await prisma.challenge.findFirst({
        where: { id: challengeId, userId, status: 'FUNDED' },
        include: { order: { select: { planName: true, serviceType: true } } },
      });
      if (!ch) return errorResponse('Funded challenge not found', 404);
      splitPercent = deriveSplitPercent(ch.order.planName, ch.order.serviceType);
    } else if (orderId) {
      const ord = await prisma.order.findFirst({
        where: {
          id: orderId,
          userId,
          serviceType: 'ACCOUNT_MANAGEMENT',
          status: { in: ['IN_PROGRESS', 'COMPLETED'] },
        },
        select: { planName: true, serviceType: true },
      });
      if (!ord) return errorResponse('Account Management order not found', 404);
      splitPercent = deriveSplitPercent(ord.planName, ord.serviceType);
    }

    // Upload to Supabase Storage
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const ext = file.name.split('.').pop() ?? 'png';
    const filename = `split_${userId.slice(-6)}_${Date.now()}.${ext}`;
    const proofUrl = await uploadProofImage(buffer, filename, file.type);

    const amountDue = Math.round((totalPayout * splitPercent) / 100 * 100) / 100;

    const split = await prisma.profitSplit.create({
      data: {
        userId,
        challengeId:  challengeId ?? null,
        orderId:      orderId     ?? null,
        totalPayout,
        splitPercent,
        amountDue,
        amountSent,
        currency,
        network:     network  ?? null,
        txHash:      txHash   ?? null,
        proofImage:  proofUrl,
        notes:       notes    ?? null,
      },
    });

    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true },
    });
    if (admins.length > 0) {
      await prisma.notification.createMany({
        data: admins.map((a) => ({
          userId:  a.id,
          title:   'New Profit Split Submission',
          message: `A client submitted a profit split payment of $${amountSent.toFixed(2)} ${currency} (due: $${amountDue.toFixed(2)}).`,
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
