// Per-IP token bucket. In-memory, so effective per serverless instance only —
// not a replacement for a real limiter, but blunts casual abuse and accidental
// refresh loops without adding infra.

type Bucket = { tokens: number; updatedAt: number }

const BUCKETS = new Map<string, Bucket>()
const CAPACITY = 20          // burst
const REFILL_PER_SEC = 20 / 60 // 20 requests per minute sustained
const MAX_ENTRIES = 5000     // cap memory; evict oldest on overflow

export function rateLimit(ip: string): { ok: true } | { ok: false; retryAfter: number } {
  const now = Date.now()
  let b = BUCKETS.get(ip)
  if (!b) {
    if (BUCKETS.size >= MAX_ENTRIES) {
      const oldestKey = BUCKETS.keys().next().value
      if (oldestKey) BUCKETS.delete(oldestKey)
    }
    b = { tokens: CAPACITY, updatedAt: now }
    BUCKETS.set(ip, b)
  }

  const elapsed = (now - b.updatedAt) / 1000
  b.tokens = Math.min(CAPACITY, b.tokens + elapsed * REFILL_PER_SEC)
  b.updatedAt = now

  if (b.tokens < 1) {
    const retryAfter = Math.ceil((1 - b.tokens) / REFILL_PER_SEC)
    return { ok: false, retryAfter }
  }

  b.tokens -= 1
  return { ok: true }
}

export function clientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()
  return req.headers.get('x-real-ip') || 'unknown'
}
