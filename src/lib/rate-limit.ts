// Simple in-memory rate limiter (per-IP, sliding window).
// For production, use Redis or a proper rate-limit middleware.
// This is sufficient for demo purposes and prevents brute-force login/signup attempts.

const WINDOW_MS = 60 * 1000 // 1 minute
const MAX_AUTH_ATTEMPTS = 8  // max auth attempts per IP per minute

interface Entry {
  count: number
  resetAt: number
}

const store = new Map<string, Entry>()

// periodically clean up expired entries to prevent memory leak
let lastCleanup = Date.now()
function cleanup() {
  const now = Date.now()
  if (now - lastCleanup < 5 * 60 * 1000) return // every 5 min
  lastCleanup = now
  for (const [key, entry] of store) {
    if (entry.resetAt < now) store.delete(key)
  }
}

export function checkRateLimit(
  ip: string,
  maxAttempts = MAX_AUTH_ATTEMPTS,
  windowMs = WINDOW_MS
): { ok: boolean; retryAfter: number } {
  cleanup()
  const now = Date.now()
  const entry = store.get(ip)
  if (!entry || entry.resetAt < now) {
    store.set(ip, { count: 1, resetAt: now + windowMs })
    return { ok: true, retryAfter: 0 }
  }
  if (entry.count >= maxAttempts) {
    return { ok: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) }
  }
  entry.count++
  return { ok: true, retryAfter: 0 }
}

export function getClientIP(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  const realIP = req.headers.get('x-real-ip')
  if (realIP) return realIP
  return 'unknown'
}
