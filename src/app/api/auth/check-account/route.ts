export const dynamic = 'force-dynamic';

import { type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { generalLimiter, getClientIp } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  const { success } = generalLimiter.check(getClientIp(req));
  if (!success) {
    return Response.json({ code: 'RATE_LIMITED' }, { status: 429 });
  }

  try {
    const { email } = await req.json();
    if (!email || typeof email !== 'string') {
      return Response.json({ code: 'INVALID' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, emailVerified: true, passwordHash: true },
    });

    if (!user || !user.passwordHash) {
      return Response.json({ code: 'NO_ACCOUNT' }, { status: 404 });
    }

    if (!user.emailVerified) {
      return Response.json({ code: 'EMAIL_NOT_VERIFIED' }, { status: 403 });
    }

    return Response.json({ code: 'OK' });
  } catch {
    return Response.json({ code: 'ERROR' }, { status: 500 });
  }
}
