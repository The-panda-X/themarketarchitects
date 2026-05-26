export const dynamic = 'force-dynamic';

import prisma from '@/lib/prisma';
import { requireAuth, handleApiError, successResponse, errorResponse } from '@/lib/api-helpers';
import { send2FACode } from '@/lib/email';

/** GET — check 2FA status */
export async function GET() {
  try {
    const session = await requireAuth();
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { twoFactorEnabled: true },
    });
    return successResponse({ enabled: user?.twoFactorEnabled ?? false });
  } catch (err) {
    return handleApiError(err);
  }
}

/** POST — initiate 2FA enable: generate OTP, send email */
export async function POST() {
  try {
    const session = await requireAuth();
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, twoFactorEnabled: true },
    });

    if (!user) return errorResponse('User not found', 404);
    if (user.twoFactorEnabled) return errorResponse('2FA is already enabled', 400);

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.user.update({
      where: { id: user.id },
      data: { twoFactorSecret: `${otp}|${expiry.toISOString()}` },
    });

    try {
      await send2FACode(user.email, otp);
    } catch (emailErr) {
      console.error('Failed to send 2FA email:', emailErr);
      // Clear the secret since the code was never sent
      await prisma.user.update({
        where: { id: user.id },
        data: { twoFactorSecret: null },
      });
      return errorResponse('Failed to send verification email. Please check your email configuration.', 500);
    }

    return successResponse({ message: 'Verification code sent to your email' });
  } catch (err) {
    return handleApiError(err);
  }
}

/** PUT — verify OTP and activate 2FA */
export async function PUT(req: Request) {
  try {
    const session = await requireAuth();
    const { code } = await req.json();

    if (!code || typeof code !== 'string') {
      return errorResponse('Verification code is required', 400);
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, twoFactorSecret: true, twoFactorEnabled: true },
    });

    if (!user) return errorResponse('User not found', 404);
    if (user.twoFactorEnabled) return errorResponse('2FA is already enabled', 400);

    if (!user.twoFactorSecret) {
      return errorResponse('No verification code pending. Please request a new one.', 400);
    }

    const [storedCode, expiryStr] = user.twoFactorSecret.split('|');
    if (!storedCode || !expiryStr || new Date(expiryStr) < new Date()) {
      return errorResponse('Verification code expired. Please request a new one.', 400);
    }
    if (code.trim() !== storedCode) {
      return errorResponse('Invalid verification code', 400);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { twoFactorEnabled: true, twoFactorSecret: null },
    });

    return successResponse({ enabled: true });
  } catch (err) {
    return handleApiError(err);
  }
}

/** DELETE — disable 2FA */
export async function DELETE() {
  try {
    const session = await requireAuth();

    await prisma.user.update({
      where: { id: session.user.id },
      data: { twoFactorEnabled: false, twoFactorSecret: null },
    });

    return successResponse({ enabled: false });
  } catch (err) {
    return handleApiError(err);
  }
}
