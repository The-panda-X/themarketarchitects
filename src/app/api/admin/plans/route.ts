export const dynamic = 'force-dynamic';

import { type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin, handleApiError, successResponse, errorResponse } from '@/lib/api-helpers';

export async function GET() {
  try {
    await requireAdmin();
    const plans = await prisma.servicePlan.findMany({ orderBy: { sortOrder: 'asc' } });
    return successResponse(plans);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json();

    const { name, tier, serviceType, price, originalPrice, priceLabel, description, features, popular, accountSizes, guarantee, successRate, deliveryDays, sortOrder } = body;

    if (!name || !serviceType || !description) {
      return errorResponse('Name, service type, and description are required', 400);
    }

    const plan = await prisma.servicePlan.create({
      data: {
        name,
        tier: tier ?? 'starter',
        serviceType,
        price: price ?? null,
        originalPrice: originalPrice ?? null,
        priceLabel: priceLabel ?? null,
        description,
        features: features ?? [],
        popular: popular ?? false,
        accountSizes: accountSizes ?? [],
        guarantee: guarantee ?? null,
        successRate: successRate ?? null,
        deliveryDays: deliveryDays ?? null,
        sortOrder: sortOrder ?? 0,
        isActive: true,
      },
    });

    return successResponse(plan, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
