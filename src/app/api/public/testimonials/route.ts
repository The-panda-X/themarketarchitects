export const dynamic = 'force-dynamic';
import prisma from '@/lib/prisma';
import { successResponse, handleApiError } from '@/lib/api-helpers';

export async function GET() {
  try {
    const testimonials = await prisma.testimonial.findMany({
      where: { verified: true },
      orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
      take: 12,
    });
    return successResponse(testimonials);
  } catch (err) {
    return handleApiError(err);
  }
}
