export const dynamic = 'force-dynamic';

import { randomInt, createHash } from 'crypto';
import prisma from '@/lib/prisma';
import { requireAuth, handleApiError, successResponse, errorResponse } from '@/lib/api-helpers';
import { send2FACode } from '@/lib/email';
import { authLimiter, getClientIp } from '@/lib/rate-limit';

/** Hash OTP so it is never stored in plaintext */
function hashOtp(code: string): string {
  return createHash('sha256').update(code).digest('hex');
}

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
export async function POST(req: Request) {
  try {
    // Rate limit: 5 OTP sends per minute per IP
    const { success } = authLimiter.check(getClientIp(req));
    if (!success) return errorResponse('Too many requests. Please try again later.', 429);

    const session = await requireAuth();
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, twoFactorEnabled: true },
    });

    if (!user) return errorResponse('User not found', 404);
    if (user.twoFactorEnabled) return errorResponse('2FA is already enabled', 400);

    // Generate 6-digit OTP using crypto.randomInt (not Math.random)
    const otp = randomInt(100000, 1000000).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store hashed OTP — never plaintext
    await prisma.user.update({
      where: { id: user.id },
      data: { twoFactorSecret: `${hashOtp(otp)}|${expiry.toISOString()}` },
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

    const [storedHash, expiryStr] = user.twoFactorSecret.split('|');
    if (!storedHash || !expiryStr || new Date(expiryStr) < new Date()) {
      return errorResponse('Verification code expired. Please request a new one.', 400);
    }

    // Compare hashed values
    if (hashOtp(code.trim()) !== storedHash) {
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
