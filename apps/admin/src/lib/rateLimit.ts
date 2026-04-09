import { getDB } from "@anipotts/lib/db";

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

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
    await db.batch([
      db
        .prepare("DELETE FROM rate_limits WHERE key = ? AND ts < ?")
        .bind(key, windowStart),
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

/** Admin login: 5 attempts per 15 minutes */
export async function checkAdminLoginRateLimit(
  ip: string,
): Promise<RateLimitResult> {
  return slidingWindow(`admin_login:${ip}`, 5, 15 * 60 * 1000);
}
