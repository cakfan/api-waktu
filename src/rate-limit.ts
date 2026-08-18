import type { MiddlewareHandler } from "hono";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

export function rateLimiter(
  maxRequests = 60,
  windowMs = 60_000
): MiddlewareHandler {
  return async (c, next) => {
    const ip = c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || "unknown";
    const now = Date.now();
    const entry = store.get(ip);

    if (entry && now < entry.resetAt) {
      if (entry.count >= maxRequests) {
        c.header("X-RateLimit-Limit", String(maxRequests));
        c.header("X-RateLimit-Remaining", "0");
        c.header("X-RateLimit-Reset", String(Math.ceil(entry.resetAt / 1000)));
        return c.json({ error: "Rate limit exceeded. Try again later." }, 429);
      }
      entry.count++;
    } else {
      store.set(ip, { count: 1, resetAt: now + windowMs });
    }

    const current = store.get(ip)!;
    c.header("X-RateLimit-Limit", String(maxRequests));
    c.header("X-RateLimit-Remaining", String(maxRequests - current.count));
    c.header("X-RateLimit-Reset", String(Math.ceil(current.resetAt / 1000)));

    await next();
  };
}
