export const dynamic = 'force-dynamic';

import { type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthSession } from '@/lib/api-helpers';
import { geolocateIp } from '@/lib/geo';
import { NextResponse } from 'next/server';

/**
 * POST /api/auth/track-login
 * Called once after login to record the user's IP + geolocation.
 * Lightweight — returns 204 immediately and geo-lookup is best-effort.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }

    // Extract IP from headers (Vercel / Cloudflare / fallback)
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      req.headers.get('x-real-ip') ??
      req.headers.get('cf-connecting-ip') ??
      'unknown';

    // Check if we already tracked this session recently (within 1 hour)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { lastLoginAt: true, lastLoginIp: true },
    });

    // Skip if same IP and last tracked within 1 hour
    if (
      user?.lastLoginIp === ip &&
      user?.lastLoginAt &&
      Date.now() - user.lastLoginAt.getTime() < 3600_000
    ) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    // Geolocate (best-effort, 3s timeout)
    const geo = await geolocateIp(ip);

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        lastLoginIp: ip,
        lastLoginCountry: geo.country,
        lastLoginCity: geo.city,
        lastLoginRegion: geo.region,
        lastLoginLat: geo.lat,
        lastLoginLon: geo.lon,
        lastLoginAt: new Date(),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Track login error:', error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
