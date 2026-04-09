import { getDB } from "@anipotts/lib/db";

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * D1-backed sliding window rate limiter.
 * Falls back to in-memory Map when D1 is unavailable (local dev).
 *
 * Table auto-created on first use:
 *   rate_limits(key TEXT, ts INTEGER)
 */

const memoryStore = new Map<string, number[]>();

async function slidingWindow(
  key: string,
  maxRequests: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const now = Date.now();
  const windowStart = now - windowMs;
  const reset = now + windowMs;

  const db = getDB();

  if (db) {
    // Ensure table exists (cheap no-op after first call)
    await db
      .prepare(
        `CREATE TABLE IF NOT EXISTS rate_limits (
        key TEXT NOT NULL,
        ts INTEGER NOT NULL
      )`,
      )
      .run();
    await db
      .prepare(
        `CREATE INDEX IF NOT EXISTS idx_rate_limits_key_ts ON rate_limits(key, ts)`,
      )
      .run();

    // Clean old entries and insert new one in a batch
    await db.batch([
      db.prepare("DELETE FROM rate_limits WHERE ts < ?").bind(windowStart),
      db
        .prepare("INSERT INTO rate_limits (key, ts) VALUES (?, ?)")
        .bind(key, now),
    ]);

    const row = await db
      .prepare(
        "SELECT COUNT(*) as cnt FROM rate_limits WHERE key = ? AND ts >= ?",
      )
      .bind(key, windowStart)
      .first<{ cnt: number }>();

    const count = row?.cnt ?? 1;
    const remaining = Math.max(0, maxRequests - count);

    return {
      success: count <= maxRequests,
      limit: maxRequests,
      remaining,
      reset,
    };
  }

  // In-memory fallback for local dev
  const entries = (memoryStore.get(key) ?? []).filter(
    (ts) => ts >= windowStart,
  );
  entries.push(now);
  memoryStore.set(key, entries);

  const remaining = Math.max(0, maxRequests - entries.length);
  return {
    success: entries.length <= maxRequests,
    limit: maxRequests,
    remaining,
    reset,
  };
}

function getRequestIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("x-real-ip") ?? "unknown";
}

/** Contact form / subscribe: 5 requests per 10 minutes */
export async function checkRateLimit(
  request: Request,
): Promise<RateLimitResult> {
  const ip = getRequestIp(request);
  return slidingWindow(`contact:${ip}`, 5, 10 * 60 * 1000);
}

/** Admin login: 5 attempts per 15 minutes */
export async function checkAdminLoginRateLimit(
  ip: string,
): Promise<RateLimitResult> {
  return slidingWindow(`admin_login:${ip}`, 5, 15 * 60 * 1000);
}
