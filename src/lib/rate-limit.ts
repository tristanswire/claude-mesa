/**
 * Simple in-memory rate limiter for MVP.
 *
 * Limitations:
 * - Not distributed: only works within a single server instance
 * - Memory-based: resets on server restart
 * - For production, consider Redis or Upstash rate limiting
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const store = new Map<string, RateLimitEntry>();

// Cleanup old entries periodically to prevent memory leaks
const CLEANUP_INTERVAL = 60 * 1000; // 1 minute
let cleanupTimer: NodeJS.Timeout | null = null;

function startCleanup() {
  if (cleanupTimer) return;

  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (entry.resetTime < now) {
        store.delete(key);
      }
    }
  }, CLEANUP_INTERVAL);

  // Unref so it doesn't keep the process alive
  if (cleanupTimer.unref) {
    cleanupTimer.unref();
  }
}

interface RateLimitConfig {
  /** Maximum number of requests allowed in the window */
  limit: number;
  /** Time window in milliseconds */
  windowMs: number;
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetTime: number;
}

/**
 * Check rate limit for a given identifier (e.g., user ID or IP).
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  startCleanup();

  const now = Date.now();
  const key = identifier;
  const entry = store.get(key);

  // No entry or expired entry
  if (!entry || entry.resetTime < now) {
    const newEntry: RateLimitEntry = {
      count: 1,
      resetTime: now + config.windowMs,
    };
    store.set(key, newEntry);
    return {
      success: true,
      remaining: config.limit - 1,
      resetTime: newEntry.resetTime,
    };
  }

  // Within window, check if under limit
  if (entry.count < config.limit) {
    entry.count++;
    return {
      success: true,
      remaining: config.limit - entry.count,
      resetTime: entry.resetTime,
    };
  }

  // Rate limited
  return {
    success: false,
    remaining: 0,
    resetTime: entry.resetTime,
  };
}

/**
 * Default rate limit config for import operations.
 * 10 imports per minute per user.
 */
export const IMPORT_RATE_LIMIT: RateLimitConfig = {
  limit: 10,
  windowMs: 60 * 1000, // 1 minute
};
