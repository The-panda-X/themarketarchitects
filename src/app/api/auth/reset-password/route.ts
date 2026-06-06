export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { resetPasswordSchema } from '@/lib/validations';
import { authLimiter, getClientIp } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 5 attempts per minute per IP
    const { success } = authLimiter.check(getClientIp(request));
    if (!success) return errorResponse('Too many requests. Please try again later.', 429);

    const body = await request.json();
    const parsed = resetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.errors[0]?.message ?? 'Invalid input';
      return errorResponse(firstError, 400);
    }

    const { token, password } = parsed.data;

    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!verificationToken || !verificationToken.identifier.startsWith('reset:')) {
      return errorResponse('Invalid or expired reset link', 400);
    }

    if (verificationToken.expires < new Date()) {
      await prisma.verificationToken.delete({ where: { token } });
      return errorResponse('Reset link has expired. Please request a new one.', 400);
    }

    const email = verificationToken.identifier.replace('reset:', '');
    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.user.update({
      where: { email },
      data: { passwordHash },
    });

    await prisma.verificationToken.delete({ where: { token } });

    return successResponse({ message: 'Password reset successfully.' });
  } catch (error) {
    console.error('Reset password error:', error);
    return errorResponse('Password reset failed', 500);
  }
}
