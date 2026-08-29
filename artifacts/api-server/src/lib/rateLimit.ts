import type { RequestHandler } from "express";

type RateLimitOptions = {
  windowMs: number;
  max: number;
  message: string;
};

type Bucket = { startedAt: number; count: number };

/**
 * Process-local limiter for public forms. The key is req.ip, which Express
 * derives from the trusted proxy configuration instead of trusting a raw
 * x-forwarded-for header supplied by the browser.
 */
export function createRateLimiter({ windowMs, max, message }: RateLimitOptions): RequestHandler {
  const buckets = new Map<string, Bucket>();

  const cleanup = setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of buckets) {
      if (now - bucket.startedAt >= windowMs) buckets.delete(key);
    }
  }, Math.min(windowMs, 10 * 60 * 1000));
  cleanup.unref();

  return (req, res, next) => {
    const now = Date.now();
    const key = req.ip || "unknown";
    const current = buckets.get(key);
    const bucket = !current || now - current.startedAt >= windowMs
      ? { startedAt: now, count: 0 }
      : current;

    bucket.count += 1;
    buckets.set(key, bucket);
    res.setHeader("X-RateLimit-Limit", String(max));
    res.setHeader("X-RateLimit-Remaining", String(Math.max(0, max - bucket.count)));

    if (bucket.count > max) {
      res.status(429).json({ error: message });
      return;
    }
    next();
  };
}