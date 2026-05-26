export const dynamic = 'force-dynamic';
export const revalidate = 60;

import prisma from '@/lib/prisma';
import { successResponse } from '@/lib/api-helpers';
import { NextResponse } from 'next/server';

/** GET – public: fetch active home services for the landing page */
export async function GET() {
  try {
    const services = await prisma.homeService.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
    return successResponse(services);
  } catch {
    return NextResponse.json({ data: [] });
  }
}
