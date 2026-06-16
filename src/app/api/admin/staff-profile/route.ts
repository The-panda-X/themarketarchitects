export const dynamic = 'force-dynamic';
import { type NextRequest } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { requireModerator, handleApiError, successResponse, errorResponse } from '@/lib/api-helpers';

const nicknameSchema = z.object({
  staffNickname: z
    .string()
    .trim()
    .min(2, 'Nickname must be at least 2 characters')
    .max(30, 'Nickname must be 30 characters or less')
    .regex(/^[a-zA-Z0-9 _.-]+$/, 'Use only letters, numbers, spaces, dot, hyphen, underscore')
    .nullable(),
});

/** GET — fetch the current staff member's display nickname */
export async function GET() {
  try {
    const session = await requireModerator();
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { staffNickname: true, name: true, email: true, role: true },
    });
    return successResponse({
      staffNickname: user?.staffNickname ?? null,
      defaultDisplay: user?.name ?? user?.email ?? 'Staff',
      role: user?.role ?? 'USER',
    });
  } catch (err) {
    return handleApiError(err);
  }
}

/** PATCH — update the current staff member's display nickname */
export async function PATCH(req: NextRequest) {
  try {
    const session = await requireModerator();
    const body = await req.json();
    const parsed = nicknameSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0].message, 400);
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: { staffNickname: parsed.data.staffNickname },
      select: { staffNickname: true },
    });

    return successResponse({ staffNickname: user.staffNickname });
  } catch (err) {
    return handleApiError(err);
  }
}
