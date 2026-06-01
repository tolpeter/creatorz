// Egyszerű in-memory rate limit (dev/egy instance). Prod-ban Redis/DB ajánlott.
const userLimits = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  key: string,
  max: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetAt?: number } {
  const now = Date.now();
  const record = userLimits.get(key);

  if (!record || now > record.resetAt) {
    userLimits.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: max - 1 };
  }

  if (record.count >= max) {
    return { allowed: false, remaining: 0, resetAt: record.resetAt };
  }

  record.count++;
  return { allowed: true, remaining: max - record.count };
}

export const HOUR = 60 * 60 * 1000;
export const DAY = 24 * HOUR;
