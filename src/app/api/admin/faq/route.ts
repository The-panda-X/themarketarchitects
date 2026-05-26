export const dynamic = 'force-dynamic';

import { type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin, handleApiError, successResponse, errorResponse } from '@/lib/api-helpers';

export async function GET() {
  try {
    await requireAdmin();
    const items = await prisma.fAQItem.findMany({ orderBy: { sortOrder: 'asc' } });
    return successResponse(items);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json();
    const { question, answer, sortOrder } = body;

    if (!question || !answer) return errorResponse('Question and answer are required', 400);

    const item = await prisma.fAQItem.create({
      data: { question, answer, sortOrder: sortOrder ?? 0, isActive: true },
    });

    return successResponse(item, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
