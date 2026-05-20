export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-helpers';

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return errorResponse('Token and password are required', 400);
    }

    if (password.length < 8) {
      return errorResponse('Password must be at least 8 characters', 400);
    }

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
