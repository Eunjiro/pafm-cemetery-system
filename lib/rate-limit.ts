/**
 * Simple in-memory rate limiter using sliding window
 * For production at scale, replace with Redis-based solution
 */

interface RateLimitEntry {
  timestamps: number[]
}

const rateLimitStore = new Map<string, RateLimitEntry>()

// Cleanup old entries every 5 minutes to prevent memory leaks
const CLEANUP_INTERVAL = 5 * 60 * 1000
let lastCleanup = Date.now()

function cleanup(windowMs: number) {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL) return
  lastCleanup = now

  const cutoff = now - windowMs
  for (const [key, entry] of rateLimitStore.entries()) {
    entry.timestamps = entry.timestamps.filter((t) => t > cutoff)
    if (entry.timestamps.length === 0) {
      rateLimitStore.delete(key)
    }
  }
}

/**
 * Check if a request should be rate limited
 * @param key - Unique identifier (e.g., IP address or email)
 * @param maxRequests - Maximum number of requests allowed in the window
 * @param windowMs - Time window in milliseconds
 * @returns Object with `limited` boolean and `retryAfter` seconds
 */
export function rateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { limited: boolean; retryAfter: number } {
  cleanup(windowMs)

  const now = Date.now()
  const cutoff = now - windowMs

  let entry = rateLimitStore.get(key)
  if (!entry) {
    entry = { timestamps: [] }
    rateLimitStore.set(key, entry)
  }

  // Remove expired timestamps
  entry.timestamps = entry.timestamps.filter((t) => t > cutoff)

  if (entry.timestamps.length >= maxRequests) {
    const oldestInWindow = entry.timestamps[0]
    const retryAfter = Math.ceil((oldestInWindow + windowMs - now) / 1000)
    return { limited: true, retryAfter }
  }

  // Allow the request, record timestamp
  entry.timestamps.push(now)
  return { limited: false, retryAfter: 0 }
}

/**
 * Helper to extract client IP from request headers
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) {
    return forwarded.split(",")[0].trim()
  }
  const realIp = request.headers.get("x-real-ip")
  if (realIp) return realIp
  return "unknown"
}
