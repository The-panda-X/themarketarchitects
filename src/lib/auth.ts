import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@auth/prisma-adapter';
import type { Adapter } from 'next-auth/adapters';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';

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
      allowDangerousEmailAccountLinking: true,
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
          const code = credentials.twoFactorCode;
          if (!code) {
            // Generate and send OTP, then signal the client to show 2FA form
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min
            await prisma.user.update({
              where: { id: user.id },
              data: { twoFactorSecret: `${otp}|${expiry.toISOString()}` },
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
          const [storedCode, expiryStr] = user.twoFactorSecret.split('|');
          if (!storedCode || !expiryStr || new Date(expiryStr) < new Date()) {
            throw new Error('2FA code expired. Please try logging in again.');
          }
          if (code !== storedCode) {
            throw new Error('Invalid 2FA code');
          }

          // Clear the used code
          await prisma.user.update({
            where: { id: user.id },
            data: { twoFactorSecret: null },
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
        (session.user as { id?: string }).id = token.id as string;
        (session.user as { role?: string }).role = token.role as string;
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
        console.error('SignIn callback error:', error);
        return true;
      }
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      if (url.startsWith(baseUrl)) return url;
      return `${baseUrl}/dashboard`;
    },
  },
};
