/**
 * IP Geolocation helper using ip-api.com (free, no API key, 45 req/min).
 * Falls back gracefully if the service is unavailable.
 */

interface GeoResult {
  country: string | null;
  city: string | null;
  region: string | null;
  lat: number | null;
  lon: number | null;
}

const EMPTY: GeoResult = { country: null, city: null, region: null, lat: null, lon: null };

// Simple in-memory TTL cache to avoid repeat lookups for the same IP
const geoCache = new Map<string, { result: GeoResult; expires: number }>();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

/** Check whether an IP is private / reserved / not routable */
function isPrivateIp(ip: string): boolean {
  if (!ip || ip === 'unknown') return true;
  // IPv6 loopback & private
  if (ip === '::1' || ip.startsWith('fc00:') || ip.startsWith('fd') || ip.startsWith('fe80:')) return true;
  // IPv4 loopback & private ranges
  if (ip === '127.0.0.1' || ip.startsWith('127.')) return true;
  if (ip.startsWith('10.')) return true;
  if (ip.startsWith('192.168.')) return true;
  if (ip.startsWith('169.254.')) return true;
  // 172.16.0.0/12
  if (ip.startsWith('172.')) {
    const second = parseInt(ip.split('.')[1], 10);
    if (second >= 16 && second <= 31) return true;
  }
  return false;
}

/** Validate that a string looks like a valid IPv4 or IPv6 address */
function isValidIp(ip: string): boolean {
  // Basic IPv4
  if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(ip)) return true;
  // Basic IPv6 (contains colons)
  if (/^[0-9a-fA-F:]+$/.test(ip) && ip.includes(':')) return true;
  return false;
}

export async function geolocateIp(ip: string): Promise<GeoResult> {
  if (isPrivateIp(ip) || !isValidIp(ip)) return EMPTY;

  // Check cache
  const cached = geoCache.get(ip);
  if (cached && cached.expires > Date.now()) {
    return cached.result;
  }

  try {
    // ip-api.com free tier only works over HTTP (403 on HTTPS).
    // Use http:// explicitly — Vercel edge/serverless allows outbound HTTP.
    const res = await fetch(
      `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,country,regionName,city,lat,lon`,
      { signal: AbortSignal.timeout(3000) }
    );

    if (!res.ok) return EMPTY;

    const data = await res.json();
    if (data.status !== 'success') return EMPTY;

    const result: GeoResult = {
      country: data.country ?? null,
      city: data.city ?? null,
      region: data.regionName ?? null,
      lat: data.lat ?? null,
      lon: data.lon ?? null,
    };

    // Store in cache
    geoCache.set(ip, { result, expires: Date.now() + CACHE_TTL });

    // Prevent unbounded cache growth
    if (geoCache.size > 5000) {
      const firstKey = geoCache.keys().next().value;
      if (firstKey) geoCache.delete(firstKey);
    }

    return result;
  } catch {
    // Service down or timeout — don't block login
    return EMPTY;
  }
}
