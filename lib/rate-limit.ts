// Server-only, in-memory rate limiter. It is per-instance (not shared across
// serverless instances), so treat it as a cost/abuse speed bump rather than a
// hard quota — pair it with a provider-side quota for real enforcement.
import { NextResponse } from 'next/server';

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

// Opportunistic cleanup so the Map can't grow unbounded on a long-lived process.
function sweep(now: number) {
  if (buckets.size < 5000) return;
  for (const [k, v] of buckets) {
    if (v.resetAt <= now) buckets.delete(k);
  }
}

export interface RateLimitResult {
  ok: boolean;
  retryAfter: number; // seconds until the window resets
  remaining: number;
}

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfter: 0, remaining: limit - 1 };
  }

  existing.count += 1;
  if (existing.count > limit) {
    return { ok: false, retryAfter: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)), remaining: 0 };
  }
  return { ok: true, retryAfter: 0, remaining: limit - existing.count };
}

// Drop-in guard for an API route: returns a 429 NextResponse to return early,
// or null when the request is within limits. `scope` keeps each endpoint's
// bucket separate for the same user.
export function enforceRateLimit(
  userId: string,
  scope: string,
  limit: number,
  windowMs: number
): NextResponse | null {
  const { ok, retryAfter } = rateLimit(`${scope}:${userId}`, limit, windowMs);
  if (ok) return null;
  return NextResponse.json(
    { error: `Too many requests. Please wait ${retryAfter}s and try again.` },
    { status: 429, headers: { 'Retry-After': String(retryAfter) } }
  );
}
