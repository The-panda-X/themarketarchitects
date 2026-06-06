export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { sendVerificationEmail } from '@/lib/email';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { authLimiter, getClientIp } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 5 requests per minute per IP
    const { success } = authLimiter.check(getClientIp(request));
    if (!success) return errorResponse('Too many requests. Please try again later.', 429);

    const { token, email, action } = await request.json();

    if (action === 'resend') {
      if (!email) return errorResponse('Email is required', 400);

      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (!user) return successResponse({ message: 'If that email exists, a verification link was sent.' });

      if (user.emailVerified) {
        return errorResponse('Email is already verified', 400);
      }

      await prisma.verificationToken.deleteMany({
        where: { identifier: email.toLowerCase() },
      });

      const newToken = crypto.randomBytes(32).toString('hex');
      await prisma.verificationToken.create({
        data: {
          identifier: email.toLowerCase(),
          token: newToken,
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });

      try {
        await sendVerificationEmail(email.toLowerCase(), newToken);
      } catch (emailErr) {
        console.error('Failed to send verification email:', emailErr);
      }

      return successResponse({ message: 'Verification email sent.' });
    }

    if (!token) return errorResponse('Token is required', 400);

    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!verificationToken) {
      return errorResponse('Invalid or expired verification link', 400);
    }

    if (verificationToken.expires < new Date()) {
      await prisma.verificationToken.delete({ where: { token } });
      return errorResponse('Verification link has expired. Please request a new one.', 400);
    }

    await prisma.user.update({
      where: { email: verificationToken.identifier },
      data: { emailVerified: new Date() },
    });

    await prisma.verificationToken.delete({ where: { token } });

    return successResponse({ message: 'Email verified successfully.' });
  } catch (error) {
    console.error('Verify email error:', error);
    return errorResponse('Verification failed', 500);
  }
}
