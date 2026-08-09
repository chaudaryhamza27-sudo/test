import "server-only";

// In-memory sliding-window rate limiter, keyed by an arbitrary string (usually
// "<route>:<ip>"). Fine for a single Node process; if this app is ever deployed
// across multiple serverless instances each keeps its own counters, which just
// means the effective limit is (max * instance count) — acceptable here since
// this exists to blunt casual brute-force/spam, not to be airtight.
const buckets = new Map();

const CLEANUP_INTERVAL_MS = 5 * 60_000;
let lastCleanup = Date.now();

function cleanup(now) {
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt < now) buckets.delete(key);
  }
}

// Returns { allowed, remaining, resetAt }. Call once per request; only counts
// toward the limit when you actually want the attempt to count (e.g. skip
// counting a successful login if you only want to throttle failures).
export function checkRateLimit(key, { max, windowMs }) {
  const now = Date.now();
  cleanup(now);

  let bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    bucket = { count: 0, resetAt: now + windowMs };
    buckets.set(key, bucket);
  }

  bucket.count += 1;
  return { allowed: bucket.count <= max, remaining: Math.max(0, max - bucket.count), resetAt: bucket.resetAt };
}

// Best-effort client IP extraction for Next.js App Router route handlers
// (the Request object has no built-in .ip). Falls back to a constant so
// requests without any forwarding headers still share one bucket rather
// than bypassing the limiter entirely.
export function getClientIp(request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;
  return "unknown";
}
