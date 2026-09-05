/**
 * In-memory token bucket, per IP per route.
 *
 * This is honestly in-memory: on Vercel each serverless instance keeps its own
 * counter, so the effective limit is per-instance. That is adequate for the traffic
 * a portfolio tool sees and it keeps the project free of a KV dependency. If this
 * ever needs to be real, swap the Map for Upstash and nothing else changes.
 */
const buckets = new Map<string, { count: number; resetAt: number }>();
const MAX_KEYS = 5_000;

function clientKey(req: Request, scope: string): string {
  const fwd = req.headers.get("x-forwarded-for");
  const ip = fwd?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
  return `${scope}:${ip}`;
}

export function rateLimit(
  req: Request,
  scope: string,
  max: number,
  windowMs: number,
): { ok: true } | { ok: false; retryInSeconds: number } {
  const key = clientKey(req, scope);
  const now = Date.now();

  if (buckets.size > MAX_KEYS) {
    for (const [k, v] of buckets) if (v.resetAt < now) buckets.delete(k);
    if (buckets.size > MAX_KEYS) buckets.clear();
  }

  const entry = buckets.get(key);
  if (!entry || entry.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }
  if (entry.count >= max) {
    return { ok: false, retryInSeconds: Math.ceil((entry.resetAt - now) / 1000) };
  }
  entry.count++;
  return { ok: true };
}
