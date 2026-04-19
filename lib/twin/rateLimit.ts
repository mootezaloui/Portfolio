export interface RateLimitResult {
  allowed: boolean;
  key: string;
  limit: number;
  remaining: number;
  resetAt: number;
}

export interface RateLimitPolicy {
  windowMs: number;
  maxRequests: number;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const DEFAULT_POLICY: RateLimitPolicy = {
  windowMs: 60 * 60 * 1000,
  maxRequests: 10,
};

const rateLimitStore = new Map<string, RateLimitEntry>();

function cleanupExpiredEntries(now: number): void {
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt <= now) {
      rateLimitStore.delete(key);
    }
  }
}

export async function checkTwinRateLimit(
  key: string,
  policy: RateLimitPolicy = DEFAULT_POLICY
): Promise<RateLimitResult> {
  const now = Date.now();
  cleanupExpiredEntries(now);

  const entry = rateLimitStore.get(key);
  if (!entry || entry.resetAt <= now) {
    const resetAt = now + policy.windowMs;
    rateLimitStore.set(key, { count: 1, resetAt });
    return {
      key,
      allowed: true,
      limit: policy.maxRequests,
      remaining: Math.max(policy.maxRequests - 1, 0),
      resetAt,
    };
  }

  entry.count += 1;
  const allowed = entry.count <= policy.maxRequests;
  return {
    key,
    allowed,
    limit: policy.maxRequests,
    remaining: Math.max(policy.maxRequests - entry.count, 0),
    resetAt: entry.resetAt,
  };
}

export function clearTwinRateLimits(): void {
  rateLimitStore.clear();
}
