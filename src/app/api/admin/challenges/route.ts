export const dynamic = 'force-dynamic';
import { type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin, requireModerator, handleApiError, successResponse, errorResponse, parsePagination } from '@/lib/api-helpers';
import { ChallengeStatus } from '@/types';

const VALID_CHALLENGE_STATUSES = new Set(Object.values(ChallengeStatus));

export async function GET(req: NextRequest) {
  try {
    await requireModerator();
    const { searchParams } = req.nextUrl;
    const { page, limit, skip } = parsePagination(searchParams);
    const status = searchParams.get('status') ?? '';

    const where = status && VALID_CHALLENGE_STATUSES.has(status as ChallengeStatus)
      ? { status: status as ChallengeStatus }
      : {};

    const [challenges, total] = await Promise.all([
      prisma.challenge.findMany({
        where,
        include: { user: { select: { id: true, email: true, name: true } }, order: { select: { planName: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.challenge.count({ where }),
    ]);

    return successResponse({ data: challenges, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const adminSession = await requireAdmin();
    const body = await req.json();
    const { orderId, targetProfit, maxDrawdown } = body;

    if (!orderId) return errorResponse('orderId is required', 400);

    // Fetch order to get userId, firmName, accountSize
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, userId: true, firmName: true, accountSize: true, planName: true, status: true },
    });
    if (!order) return errorResponse('Order not found', 404);

    // Check if challenge already exists for this order
    const existing = await prisma.challenge.findUnique({ where: { orderId } });
    if (existing) return errorResponse('A challenge already exists for this order', 409);

    const challenge = await prisma.challenge.create({
      data: {
        orderId,
        userId: order.userId,
        firmName: order.firmName ?? 'Unknown',
        accountSize: order.accountSize ?? 'Unknown',
        status: ChallengeStatus.PENDING,
        targetProfit: targetProfit ? parseFloat(targetProfit) : null,
        maxDrawdown: maxDrawdown ? parseFloat(maxDrawdown) : null,
      },
    });

    // Log admin action
    await prisma.adminLog.create({
      data: {
        adminId: adminSession.user.id,
        action: 'CREATE_CHALLENGE',
        details: JSON.parse(JSON.stringify({ challengeId: challenge.id, orderId, planName: order.planName })),
      },
    });

    // Notify the user
    const isChallenge = order.status === 'IN_PROGRESS' || !order.planName.toLowerCase().includes('manage');
    await prisma.notification.create({
      data: {
        userId: order.userId,
        title: isChallenge ? 'Challenge Started' : 'Account Linked',
        message: isChallenge
          ? `Your challenge for ${order.planName} has been created and is now pending. Our team will begin trading shortly.`
          : `Your account for ${order.planName} has been set up. You can now track progress from your dashboard.`,
        type: 'info',
        link: `/dashboard/challenges/${challenge.id}`,
      },
    });

    return successResponse(challenge, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
