const tracker = new Map<string, number[]>()

/**
 * Checks if a key has exceeded the allowed request limit in a sliding window.
 * @param key Unique key to rate limit (e.g. userId or IP)
 * @param limit Max number of requests allowed in window
 * @param windowMs Window duration in milliseconds (default: 1 minute)
 */
export function isRateLimited(key: string, limit = 15, windowMs = 60000): boolean {
  const now = Date.now()
  if (!tracker.has(key)) {
    tracker.set(key, [now])
    return false
  }

  const timestamps = tracker.get(key)!.filter((t) => now - t < windowMs)
  if (timestamps.length >= limit) {
    return true
  }

  timestamps.push(now)
  tracker.set(key, timestamps)
  return false
}
