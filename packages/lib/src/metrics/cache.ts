/**
 * Metrics cache helpers. D1-only.
 * Simple key-value table: metrics_cache(key TEXT PK, value TEXT/JSONB, updated_at TEXT)
 */

import { logger } from "../logger";
import { getDB, parseJson, toJson, now } from "../db";

export const CACHE_KEYS = {
  GITHUB_STATS: "github_stats",
  GITHUB_LANGUAGES: "github_languages",
  GITHUB_ACTIVITY: "github_activity",
  WAKATIME_STATS: "wakatime_stats",
  GITHUB_CALENDAR: "github_calendar",
} as const;

/** Write a value to the metrics cache. */
export async function setCacheValue(
  key: string,
  value: unknown,
): Promise<void> {
  const db = getDB();
  if (!db) {
    logger.error("metrics", `No D1 database available to write cache [${key}]`);
    throw new Error("Database not configured");
  }

  await db
    .prepare(
      "INSERT OR REPLACE INTO metrics_cache (key, value, updated_at) VALUES (?, ?, ?)",
    )
    .bind(key, toJson(value), now())
    .run();
}

/** Read a value from the metrics cache. Returns null if not found. */
export async function getCacheValue<T>(
  key: string,
): Promise<{ value: T; updatedAt: string } | null> {
  const db = getDB();
  if (!db) return null;

  const row = await db
    .prepare("SELECT value, updated_at FROM metrics_cache WHERE key = ?")
    .bind(key)
    .first<{ value: string; updated_at: string }>();
  if (!row) return null;
  return {
    value: parseJson<T>(row.value) as T,
    updatedAt: row.updated_at,
  };
}
