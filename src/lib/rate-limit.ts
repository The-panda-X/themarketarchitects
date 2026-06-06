/**
 * Simple in-memory rate limiter for API routes.
 *
 * For production with serverless (Vercel), replace with @upstash/ratelimit + @upstash/redis
 * for distributed rate limiting across instances. This in-memory version works
 * for single-instance deployments and development.
 *
 * Usage:
 *   const limiter = rateLimit({ interval: 60_000, uniqueTokenPerInterval: 500, limit: 5 });
 *   const { success } = await limiter.check(ip);
 *   if (!success) return errorResponse('Too many requests', 429);
 */

interface RateLimitConfig {
  /** Time window in milliseconds */
  interval: number;
  /** Max unique tokens (IPs) tracked per interval (memory cap) */
  uniqueTokenPerInterval?: number;
  /** Max requests per token per interval */
  limit: number;
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  limit: number;
}

interface TokenBucket {
  count: number;
  resetAt: number;
}

export function rateLimit(config: RateLimitConfig) {
  const { interval, uniqueTokenPerInterval = 500, limit } = config;
  const tokenCache = new Map<string, TokenBucket>();

  // Periodic cleanup to prevent unbounded memory growth
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of tokenCache) {
      if (bucket.resetAt <= now) {
        tokenCache.delete(key);
      }
    }
    // Hard cap: evict oldest if too many unique tokens
    if (tokenCache.size > uniqueTokenPerInterval) {
      const excess = tokenCache.size - uniqueTokenPerInterval;
      const keys = tokenCache.keys();
      for (let i = 0; i < excess; i++) {
        const next = keys.next();
        if (!next.done) tokenCache.delete(next.value);
      }
    }
  }, interval);

  // Don't prevent Node process from exiting
  if (cleanupInterval.unref) cleanupInterval.unref();

  return {
    check(token: string): RateLimitResult {
      const now = Date.now();
      const bucket = tokenCache.get(token);

      if (!bucket || bucket.resetAt <= now) {
        // New window
        tokenCache.set(token, { count: 1, resetAt: now + interval });
        return { success: true, remaining: limit - 1, limit };
      }

      bucket.count++;

      if (bucket.count > limit) {
        return { success: false, remaining: 0, limit };
      }

      return { success: true, remaining: limit - bucket.count, limit };
    },
  };
}

// ── Pre-configured limiters for common use cases ──

/** Auth routes: 5 requests per minute per IP */
export const authLimiter = rateLimit({ interval: 60_000, limit: 5 });

/** Contact / public forms: 3 requests per minute per IP */
export const formLimiter = rateLimit({ interval: 60_000, limit: 3 });

/** Coupon validation: 10 requests per minute per IP */
export const couponLimiter = rateLimit({ interval: 60_000, limit: 10 });

/** General API: 60 requests per minute per IP */
export const generalLimiter = rateLimit({ interval: 60_000, limit: 60 });

/** Extract client IP from request headers */
export function getClientIp(req: Request): string {
  return (
    (req.headers.get('x-forwarded-for') ?? '').split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    req.headers.get('cf-connecting-ip') ||
    'unknown'
  );
}
