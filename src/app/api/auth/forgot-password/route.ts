export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { sendPasswordResetEmail } from '@/lib/email';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { authLimiter, getClientIp } from '@/lib/rate-limit';
import { forgotPasswordSchema } from '@/lib/validations';

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 5 requests per minute per IP
    const { success } = authLimiter.check(getClientIp(request));
    if (!success) return errorResponse('Too many requests. Please try again later.', 429);

    const body = await request.json();
    const parsed = forgotPasswordSchema.safeParse(body);
    if (!parsed.success) return errorResponse('A valid email address is required', 400);
    const { email } = parsed.data;

    const normalizedEmail = email.toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // Always return success to prevent email enumeration
    if (!user || !user.passwordHash) {
      return successResponse({ message: 'If that email exists, a reset link was sent.' });
    }

    await prisma.verificationToken.deleteMany({
      where: { identifier: `reset:${normalizedEmail}` },
    });

    const token = crypto.randomBytes(32).toString('hex');
    await prisma.verificationToken.create({
      data: {
        identifier: `reset:${normalizedEmail}`,
        token,
        expires: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    try {
      await sendPasswordResetEmail(normalizedEmail, token);
    } catch (emailErr) {
      console.error('Failed to send password reset email:', emailErr);
    }

    return successResponse({ message: 'If that email exists, a reset link was sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    return errorResponse('Request failed', 500);
  }
}
