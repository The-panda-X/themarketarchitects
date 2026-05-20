export const dynamic = 'force-dynamic';
﻿import { type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth, handleApiError, successResponse, errorResponse } from '@/lib/api-helpers';
import { createTicketSchema } from '@/lib/validations';

export async function GET() {
  try {
    const session = await requireAuth();

    const tickets = await prisma.supportTicket.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return successResponse(tickets);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await req.json();
    const parsed = createTicketSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0].message, 400);
    }

    const { subject, message, priority } = parsed.data;

    const ticket = await prisma.supportTicket.create({
      data: {
        userId: session.user.id,
        subject,
        message,
        priority,
        responses: [],
      },
    });

    return successResponse(ticket, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
