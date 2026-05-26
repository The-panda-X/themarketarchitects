export const dynamic = 'force-dynamic';

import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { requireAuth, handleApiError, successResponse, errorResponse } from '@/lib/api-helpers';
import { createPasswordSchema } from '@/lib/validations';

/** POST — Create password for OAuth users who don't have one */
export async function POST(req: Request) {
  try {
    const session = await requireAuth();
    const body = await req.json();
    const parsed = createPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0].message, 400);
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { passwordHash: true },
    });

    if (user?.passwordHash) {
      return errorResponse('Password already exists. Use change password instead.', 400);
    }

    const hashed = await bcrypt.hash(parsed.data.newPassword, 12);
    await prisma.user.update({
      where: { id: session.user.id },
      data: { passwordHash: hashed },
    });

    return successResponse({ success: true });
  } catch (err) {
    return handleApiError(err);
  }
}
