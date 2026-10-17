import { NextRequest } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { requireAuth, handleApiError, successResponse, errorResponse } from '@/lib/api-helpers';

export const dynamic = 'force-dynamic';

const RESERVED_SLUGS = new Set([
  'admin', 'api', 'dashboard', 'register', 'login', 'signup', 'signin',
  'support', 'help', 'about', 'contact', 'terms', 'privacy', 'blog',
  'staff', 'moderator', 'owner', 'tma', 'themarketarchitects',
  'trading', 'signals', 'services', 'pricing', 'referral', 'referrals',
]);

const slugSchema = z.object({
  slug: z
    .string()
    .min(3, 'Slug must be at least 3 characters')
    .max(30, 'Slug must be at most 30 characters')
    .regex(/^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/, 'Only letters, numbers, and hyphens allowed (cannot start or end with a hyphen)')
    .transform((s) => s.toLowerCase()),
});

export async function PUT(request: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const parsed = slugSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0].message, 400);
    }

    const { slug } = parsed.data;

    if (RESERVED_SLUGS.has(slug)) {
      return errorResponse('This slug is reserved. Please choose another.', 409);
    }

    const existing = await prisma.user.findUnique({
      where: { referralSlug: slug },
      select: { id: true },
    });

    if (existing && existing.id !== session.user.id) {
      return errorResponse('This slug is already taken. Please choose another.', 409);
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { referralSlug: slug },
    });

    return successResponse({ slug });
  } catch (err) {
    return handleApiError(err);
  }
}
