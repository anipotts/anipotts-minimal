/**
 * Metrics cache helpers. D1-first with Supabase fallback.
 * Simple key-value table: metrics_cache(key TEXT PK, value TEXT/JSONB, updated_at TEXT)
 */

import type { SupabaseClient } from "@supabase/supabase-js";
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
  supabase: SupabaseClient,
  key: string,
  value: unknown,
): Promise<void> {
  const db = getDB();
  if (db) {
    await db
      .prepare(
        "INSERT OR REPLACE INTO metrics_cache (key, value, updated_at) VALUES (?, ?, ?)",
      )
      .bind(key, toJson(value), now())
      .run();
    return;
  }

  const { error } = await supabase.from("metrics_cache").upsert(
    {
      key,
      value,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" },
  );

  if (error) {
    logger.error("metrics", `Error writing cache [${key}]`, {
      error: String(error),
    });
    throw error;
  }
}

/** Read a value from the metrics cache. Returns null if not found. */
export async function getCacheValue<T>(
  supabase: SupabaseClient,
  key: string,
): Promise<{ value: T; updatedAt: string } | null> {
  const db = getDB();
  if (db) {
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

  const { data, error } = await supabase
    .from("metrics_cache")
    .select("value, updated_at")
    .eq("key", key)
    .single();

  if (error || !data) return null;

  return {
    value: data.value as T,
    updatedAt: data.updated_at,
  };
}
