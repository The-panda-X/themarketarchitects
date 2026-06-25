import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@auth/prisma-adapter';
import type { Adapter } from 'next-auth/adapters';
import bcrypt from 'bcryptjs';
import { randomInt, createHash } from 'crypto';
import prisma from '@/lib/prisma';

/** Hash a 2FA OTP so it is never stored in plaintext */
function hashOtp(code: string): string {
  return createHash('sha256').update(code).digest('hex');
}

/** Max failed OTP attempts before lockout */
const MAX_OTP_ATTEMPTS = 5;
/** Lockout duration after max failed OTP attempts (30 minutes) */
const OTP_LOCKOUT_MS = 30 * 60 * 1000;

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60, // 8 hours
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      // Removed allowDangerousEmailAccountLinking to prevent account takeover (CB-5)
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        twoFactorCode: { label: '2FA Code', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
        });

        if (!user || !user.passwordHash) {
          throw new Error('Invalid email or password');
        }

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!isValid) {
          throw new Error('Invalid email or password');
        }

        if (!user.emailVerified) {
          throw new Error('Please verify your email address');
        }

        // ── 2FA check ──
        if (user.twoFactorEnabled) {
          // CB-7: Check brute-force lockout
          if (
            user.otpLockedUntil &&
            user.otpLockedUntil > new Date()
          ) {
            const minutesLeft = Math.ceil((user.otpLockedUntil.getTime() - Date.now()) / 60000);
            throw new Error(`Too many failed attempts. Try again in ${minutesLeft} minutes.`);
          }

          const code = credentials.twoFactorCode;
          if (!code) {
            // Generate and send OTP using crypto.randomInt (CB-2 fix)
            const otp = randomInt(100000, 1000000).toString();
            const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min

            // CB-6: Store hashed OTP, never plaintext
            await prisma.user.update({
              where: { id: user.id },
              data: {
                twoFactorSecret: `${hashOtp(otp)}|${expiry.toISOString()}`,
                otpAttempts: 0, // Reset attempts on new code generation
                otpLockedUntil: null,
              },
            });

            // Send OTP email (dynamic import to avoid circular deps)
            const { send2FACode } = await import('@/lib/email');
            await send2FACode(user.email, otp);
            throw new Error('2FA_REQUIRED');
          }

          // Verify the provided code
          if (!user.twoFactorSecret) {
            throw new Error('Invalid 2FA code');
          }

          const [storedHash, expiryStr] = user.twoFactorSecret.split('|');
          if (!storedHash || !expiryStr || new Date(expiryStr) < new Date()) {
            throw new Error('2FA code expired. Please try logging in again.');
          }

          // CB-6: Compare hashed values
          if (hashOtp(code) !== storedHash) {
            // CB-7: Increment failed attempts
            const newAttempts = (user.otpAttempts ?? 0) + 1;
            const updateData: { otpAttempts: number; otpLockedUntil?: Date; twoFactorSecret?: null } = {
              otpAttempts: newAttempts,
            };

            if (newAttempts >= MAX_OTP_ATTEMPTS) {
              updateData.otpLockedUntil = new Date(Date.now() + OTP_LOCKOUT_MS);
              updateData.twoFactorSecret = null; // Invalidate the code
            }

            await prisma.user.update({
              where: { id: user.id },
              data: updateData,
            });

            if (newAttempts >= MAX_OTP_ATTEMPTS) {
              throw new Error('Too many failed attempts. Account locked for 30 minutes.');
            }
            throw new Error('Invalid 2FA code');
          }

          // Clear the used code and reset attempts
          await prisma.user.update({
            where: { id: user.id },
            data: {
              twoFactorSecret: null,
              otpAttempts: 0,
              otpLockedUntil: null,
            },
          });
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.avatar,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        // Always fetch role from DB to get latest value (incl. ADMIN)
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { role: true },
        });
        token.role = dbUser?.role ?? 'USER';
      }

      if (trigger === 'update' && session) {
        token.name = session.name ?? token.name;
        token.picture = session.image ?? token.picture;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as 'USER' | 'TRADER' | 'MODERATOR' | 'ADMIN' | 'HEAD_ADMIN';
      }
      return session;
    },
    async signIn({ user, account }) {
      try {
        if (account?.provider === 'google') {
          if (!user.email) return false;
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email },
          });
          if (existingUser && !existingUser.emailVerified) {
            await prisma.user.update({
              where: { id: existingUser.id },
              data: { emailVerified: new Date() },
            });
          }
        }
        return true;
      } catch (error) {
        // CB-12: Return false on error instead of swallowing and allowing auth
        console.error('SignIn callback error:', error);
        return false;
      }
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      if (url.startsWith(baseUrl)) return url;
      return `${baseUrl}/dashboard`;
    },
  },
};
