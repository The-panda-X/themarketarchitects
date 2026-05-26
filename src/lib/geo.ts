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

export async function geolocateIp(ip: string): Promise<GeoResult> {
  const empty: GeoResult = { country: null, city: null, region: null, lat: null, lon: null };

  // Skip private/local IPs
  if (!ip || ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.') || ip === 'unknown') {
    return empty;
  }

  try {
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,regionName,city,lat,lon`, {
      signal: AbortSignal.timeout(3000), // 3s timeout
    });

    if (!res.ok) return empty;

    const data = await res.json();
    if (data.status !== 'success') return empty;

    return {
      country: data.country ?? null,
      city: data.city ?? null,
      region: data.regionName ?? null,
      lat: data.lat ?? null,
      lon: data.lon ?? null,
    };
  } catch {
    // Service down or timeout — don't block login
    return empty;
  }
}
