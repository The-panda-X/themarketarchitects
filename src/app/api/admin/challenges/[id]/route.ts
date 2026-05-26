export const dynamic = 'force-dynamic';
import { type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin, requireModerator, requireHeadAdmin, handleApiError, successResponse, errorResponse } from '@/lib/api-helpers';
import { updateChallengeSchema } from '@/lib/validations';

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireModerator();

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

    const parsed = updateChallengeSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0].message, 400);
    }

    const updateData: Record<string, unknown> = { ...parsed.data };
    if (body.startDate !== undefined) updateData.startDate = body.startDate ? new Date(body.startDate) : null;
    if (body.endDate !== undefined) updateData.endDate = body.endDate ? new Date(body.endDate) : null;
    if (Array.isArray(body.proofImages)) updateData.proofImages = body.proofImages;

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

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const adminSession = await requireHeadAdmin();

    const challenge = await prisma.challenge.findUnique({
      where: { id: params.id },
      select: { id: true, firmName: true, accountSize: true },
    });
    if (!challenge) return errorResponse('Challenge not found', 404);

    await prisma.$transaction([
      prisma.dailyStat.deleteMany({ where: { challengeId: params.id } }),
      prisma.signalDelivery.deleteMany({ where: { challengeId: params.id } }),
      prisma.profitSplit.deleteMany({ where: { challengeId: params.id } }),
      prisma.challenge.delete({ where: { id: params.id } }),
    ]);

    await prisma.adminLog.create({
      data: {
        adminId: adminSession.user.id,
        action: 'DELETE_CHALLENGE',
        details: JSON.parse(JSON.stringify({ challengeId: params.id, firmName: challenge.firmName })),
      },
    });

    return successResponse({ deleted: true });
  } catch (err) {
    return handleApiError(err);
  }
}
