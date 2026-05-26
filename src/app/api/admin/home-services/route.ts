export const dynamic = 'force-dynamic';

import { type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireHeadAdmin, handleApiError, successResponse, errorResponse } from '@/lib/api-helpers';

/** GET – list all home services (including inactive) */
export async function GET() {
  try {
    await requireHeadAdmin();
    const services = await prisma.homeService.findMany({
      orderBy: { sortOrder: 'asc' },
    });
    return successResponse(services);
  } catch (err) {
    return handleApiError(err);
  }
}

/** POST – create a new home service */
export async function POST(req: NextRequest) {
  try {
    await requireHeadAdmin();
    const body = await req.json();

    const { title, description, icon, features, priceLabel, linkHref, linkText, sortOrder, isActive } = body;

    if (!title || !description) {
      return errorResponse('Title and description are required', 400);
    }

    const service = await prisma.homeService.create({
      data: {
        title,
        description,
        icon: icon || 'Target',
        features: Array.isArray(features) ? features : [],
        priceLabel: priceLabel || 'Custom',
        linkHref: linkHref || '#pricing',
        linkText: linkText || 'View Plans',
        sortOrder: sortOrder ?? 0,
        isActive: isActive ?? true,
      },
    });

    return successResponse(service, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
