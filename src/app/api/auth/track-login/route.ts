export const dynamic = 'force-dynamic';

import { type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthSession, successResponse, errorResponse } from '@/lib/api-helpers';
import { geolocateIp } from '@/lib/geo';

/**
 * POST /api/auth/track-login
 * Called once after login to record the user's IP + geolocation.
 * Lightweight — returns immediately and geo-lookup is best-effort.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return errorResponse('Unauthorized', 401);
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
      return successResponse({ skipped: true });
    }

    // Vercel provides geo headers for free — use as primary source
    const vercelCountryCode = req.headers.get('x-vercel-ip-country') || null;
    const vercelCity = req.headers.get('x-vercel-ip-city') || null;
    const vercelRegion = req.headers.get('x-vercel-ip-country-region') || null;
    const vercelLat = req.headers.get('x-vercel-ip-latitude');
    const vercelLon = req.headers.get('x-vercel-ip-longitude');

    // Convert 2-letter ISO code to full country name (e.g. "US" → "United States")
    let vercelCountry: string | null = null;
    if (vercelCountryCode) {
      try {
        const dn = new Intl.DisplayNames(['en'], { type: 'region' });
        vercelCountry = dn.of(vercelCountryCode) ?? vercelCountryCode;
      } catch {
        vercelCountry = vercelCountryCode;
      }
    }

    // Fall back to ip-api.com if Vercel headers are missing (e.g. local dev)
    let country = vercelCountry;
    let city = vercelCity ? decodeURIComponent(vercelCity) : null;
    let region = vercelRegion;
    let lat = vercelLat ? parseFloat(vercelLat) : null;
    let lon = vercelLon ? parseFloat(vercelLon) : null;

    if (!country) {
      const geo = await geolocateIp(ip);
      country = geo.country;
      city = geo.city;
      region = geo.region;
      lat = geo.lat;
      lon = geo.lon;
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        lastLoginIp: ip,
        lastLoginCountry: country,
        lastLoginCity: city,
        lastLoginRegion: region,
        lastLoginLat: lat,
        lastLoginLon: lon,
        lastLoginAt: new Date(),
      },
    });

    return successResponse({ tracked: true });
  } catch (error) {
    console.error('Track login error:', error);
    return errorResponse('Internal server error', 500);
  }
}
