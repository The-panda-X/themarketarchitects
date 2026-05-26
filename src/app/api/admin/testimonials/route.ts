export const dynamic = 'force-dynamic';

import { type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin, handleApiError, successResponse, errorResponse } from '@/lib/api-helpers';

export async function GET() {
  try {
    await requireAdmin();
    const items = await prisma.testimonial.findMany({ orderBy: { createdAt: 'desc' } });
    return successResponse(items);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json();
    const { name, title, content, rating, verified, featured } = body;

    if (!name || !title || !content) return errorResponse('Name, title, and content are required', 400);

    const item = await prisma.testimonial.create({
      data: {
        name,
        title,
        content,
        rating: rating ?? 5,
        verified: verified ?? false,
        featured: featured ?? false,
      },
    });

    return successResponse(item, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
