export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { sendVerificationEmail } from '@/lib/email';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { authLimiter, getClientIp } from '@/lib/rate-limit';

const serverRegisterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  referralCode: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 5 registrations per minute per IP
    const { success } = authLimiter.check(getClientIp(request));
    if (!success) return errorResponse('Too many requests. Please try again later.', 429);

    const body = await request.json();
    const parsed = serverRegisterSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0].message, 400);
    }

    const { name, email, password, referralCode } = parsed.data;
    const normalizedEmail = email.toLowerCase();

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return errorResponse('An account with this email already exists', 409);
    }

    let referrerId: string | null = null;
    if (referralCode) {
      const referrer = await prisma.user.findUnique({
        where: { referralCode },
      });
      if (referrer) {
        referrerId = referrer.id;
      }
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const emailServiceEnabled = !!process.env.RESEND_API_KEY;

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        name,
        passwordHash,
        referredBy: referrerId,
        // Auto-verify if no email service is configured
        emailVerified: emailServiceEnabled ? null : new Date(),
      },
    });

    if (emailServiceEnabled) {
      const token = crypto.randomBytes(32).toString('hex');
      const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await prisma.verificationToken.create({
        data: { identifier: normalizedEmail, token, expires },
      });

      try {
        await sendVerificationEmail(normalizedEmail, token);
      } catch (emailErr) {
        console.error('Failed to send verification email:', emailErr);
      }
    }

    if (referrerId) {
      await prisma.referral.create({
        data: {
          referrerId,
          referredEmail: normalizedEmail,
        },
      });
    }

    return successResponse(
      {
        userId: user.id,
        emailVerified: !emailServiceEnabled,
        message: emailServiceEnabled
          ? 'Account created. Please check your email to verify.'
          : 'Account created. You can now sign in.',
      },
      201
    );
  } catch (error) {
    console.error('Registration error:', error);
    return errorResponse('Registration failed', 500);
  }
}
