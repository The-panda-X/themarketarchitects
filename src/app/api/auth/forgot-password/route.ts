export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { sendPasswordResetEmail } from '@/lib/email';
import { successResponse, errorResponse } from '@/lib/api-helpers';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) return errorResponse('Email is required', 400);

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
