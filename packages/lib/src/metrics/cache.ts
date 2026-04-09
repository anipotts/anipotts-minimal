/**
 * Metrics cache helpers. Uses Drizzle ORM for typed D1 queries.
 * Simple key-value table: metrics_cache(key TEXT PK, value TEXT/JSONB, updated_at TEXT)
 */

import { eq } from "drizzle-orm";
import { logger } from "../logger";
import { getDrizzle, parseJson, toJson, now } from "../db";
import * as s from "../db/schema";

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
  const db = getDrizzle();
  if (!db) {
    logger.error("metrics", `No D1 database available to write cache [${key}]`);
    throw new Error("Database not configured");
  }

  const ts = now();
  await db
    .insert(s.metricsCache)
    .values({ key, value: toJson(value), updated_at: ts })
    .onConflictDoUpdate({
      target: s.metricsCache.key,
      set: { value: toJson(value), updated_at: ts },
    });
}

/** Read a value from the metrics cache. Returns null if not found. */
export async function getCacheValue<T>(
  key: string,
): Promise<{ value: T; updatedAt: string } | null> {
  const db = getDrizzle();
  if (!db) return null;

  const rows = await db
    .select({
      value: s.metricsCache.value,
      updated_at: s.metricsCache.updated_at,
    })
    .from(s.metricsCache)
    .where(eq(s.metricsCache.key, key));
  const row = rows[0];
  if (!row) return null;
  return {
    value: parseJson<T>(row.value) as T,
    updatedAt: row.updated_at ?? "",
  };
}
