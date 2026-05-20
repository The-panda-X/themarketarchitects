export const dynamic = 'force-dynamic';
import { type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin, handleApiError, successResponse, parsePagination } from '@/lib/api-helpers';
import { ChallengeStatus } from '@/types';

const VALID_CHALLENGE_STATUSES = new Set(Object.values(ChallengeStatus));

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
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
