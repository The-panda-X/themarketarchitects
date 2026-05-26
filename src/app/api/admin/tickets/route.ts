export const dynamic = 'force-dynamic';
import { type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireModerator, handleApiError, successResponse, parsePagination } from '@/lib/api-helpers';
import { TicketStatus } from '@/types';

const VALID_TICKET_STATUSES = new Set(Object.values(TicketStatus));

export async function GET(req: NextRequest) {
  try {
    await requireModerator();
    const { searchParams } = req.nextUrl;
    const { page, limit, skip } = parsePagination(searchParams);
    const status = searchParams.get('status') ?? '';

    const where = status && VALID_TICKET_STATUSES.has(status as TicketStatus)
      ? { status: status as TicketStatus }
      : {};

    const [tickets, total] = await Promise.all([
      prisma.supportTicket.findMany({
        where,
        include: { user: { select: { id: true, email: true, name: true } } },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.supportTicket.count({ where }),
    ]);

    return successResponse({ data: tickets, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    return handleApiError(err);
  }
}
