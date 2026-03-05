/**
 * Supabase cache helpers for metrics data.
 * Uses a simple key-value table: metrics_cache(key TEXT PK, value JSONB, updated_at TIMESTAMPTZ)
 *
 * Supabase SQL to create the table:
 *   CREATE TABLE metrics_cache (
 *     key TEXT PRIMARY KEY,
 *     value JSONB NOT NULL,
 *     updated_at TIMESTAMPTZ DEFAULT now()
 *   );
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { logger } from "../logger";

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
  const { error } = await supabase.from("metrics_cache").upsert(
    {
      key,
      value,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" },
  );

  if (error) {
    logger.error("metrics", `Error writing cache [${key}]`, { error: String(error) });
    throw error;
  }
}

/** Read a value from the metrics cache. Returns null if not found. */
export async function getCacheValue<T>(
  supabase: SupabaseClient,
  key: string,
): Promise<{ value: T; updatedAt: string } | null> {
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
