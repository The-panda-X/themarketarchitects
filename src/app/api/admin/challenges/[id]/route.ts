import { type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin, handleApiError, successResponse, errorResponse } from '@/lib/api-helpers';

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();

    const challenge = await prisma.challenge.findUnique({
      where: { id: params.id },
      include: {
        user: { select: { id: true, email: true, name: true } },
        order: { select: { planName: true, serviceType: true, totalAmount: true } },
        dailyStats: { orderBy: { date: 'desc' }, take: 30 },
      },
    });

    if (!challenge) return errorResponse('Challenge not found', 404);
    return successResponse(challenge);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminSession = await requireAdmin();
    const body = await req.json();

    const allowedFields = [
      'status', 'currentPhase', 'currentProfit', 'currentDrawdown',
      'targetProfit', 'maxDrawdown', 'daysTraded', 'winRate',
      'adminNotes', 'startDate', 'endDate', 'proofImages',
    ];

    const updateData: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) updateData[field] = body[field];
    }

    const challenge = await prisma.challenge.update({
      where: { id: params.id },
      data: updateData,
    });

    await prisma.adminLog.create({
      data: {
        adminId: adminSession.user.id,
        action: 'UPDATE_CHALLENGE',
        details: JSON.parse(JSON.stringify({ challengeId: params.id, changes: updateData })),
      },
    });

    // Notify user on status change
    if (body.status) {
      const statusMessages: Record<string, string> = {
        PHASE_1: 'Phase 1 is now in progress.',
        PHASE_2: 'Phase 1 passed! Phase 2 is now in progress.',
        PASSED: 'Congratulations! Your challenge has been passed.',
        FUNDED: 'Your account is now funded. Welcome to the funded traders!',
        FAILED: 'Unfortunately, your challenge did not meet the requirements.',
      };
      const msg = statusMessages[body.status];
      if (msg) {
        await prisma.notification.create({
          data: {
            userId: challenge.userId,
            title: 'Challenge Update',
            message: msg,
            type: body.status === 'FAILED' ? 'warning' : 'success',
            link: `/dashboard/challenges/${challenge.id}`,
          },
        });
      }
    }

    return successResponse(challenge);
  } catch (err) {
    return handleApiError(err);
  }
}
