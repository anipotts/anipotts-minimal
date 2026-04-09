/**
 * Query helpers for the thoughts/blog system.
 * D1-only.
 */

import type { Thought, Subdomain } from "@anipotts/types";
import { logger } from "../logger";
import {
  getDB,
  parseJsonArray,
  toJsonArray,
  toBool,
  fromBool,
  uuid,
  now,
} from "../db";

export interface QueryOptions {
  subdomain?: Subdomain;
}

/** Deserialize a D1 row into a Thought-like object. */
function deserializeThought(
  row: Record<string, unknown>,
): Record<string, unknown> {
  return {
    ...row,
    tags: parseJsonArray(row.tags),
    platforms_targeted: parseJsonArray(row.platforms_targeted),
    platforms_posted: parseJsonArray(row.platforms_posted),
    published: toBool(row.published),
    views: (row.views as number) ?? 0,
  };
}

/** Fetch all thoughts (admin view, includes drafts), ordered by newest first. */
export async function fetchAllThoughts(options?: QueryOptions) {
  const db = getDB();
  if (!db) return [];

  try {
    let sql = "SELECT * FROM thoughts";
    const params: unknown[] = [];
    if (options?.subdomain) {
      sql += " WHERE section = ?";
      params.push(options.subdomain);
    }
    sql += " ORDER BY created_at DESC";

    const stmt = db.prepare(sql);
    const { results } = await (
      params.length > 0 ? stmt.bind(...params) : stmt
    ).all<Record<string, unknown>>();
    return (results ?? []).map(deserializeThought);
  } catch (err) {
    logger.error("admin", "D1 fetchAllThoughts failed", {
      error: String(err),
    });
    return [];
  }
}

/** Create or update a thought record. Returns the saved record. */
export async function upsertThoughtRecord(thought: Partial<Thought>) {
  const db = getDB();
  if (!db) throw new Error("Database not configured");

  const id = thought.id || uuid();
  const ts = now();

  // Build column/value lists for INSERT OR REPLACE
  const record: Record<string, unknown> = {
    id,
    slug: thought.slug ?? "",
    title: thought.title ?? "",
    summary: thought.summary ?? "",
    content: thought.content ?? "",
    tags: toJsonArray(thought.tags),
    published: fromBool(thought.published),
    views: thought.views ?? 0,
    section: thought.section ?? null,
    content_type: thought.content_type ?? "article",
    series_type: thought.series_type ?? null,
    status: thought.status ?? "draft",
    artifact_url: thought.artifact_url ?? null,
    artifact_type: thought.artifact_type ?? null,
    platforms_targeted: toJsonArray(thought.platforms_targeted),
    platforms_posted: toJsonArray(thought.platforms_posted),
    voice_mode: thought.voice_mode ?? null,
    project: thought.project ?? null,
    published_at: thought.published_at ?? null,
    scheduled_at: thought.scheduled_at ?? null,
    created_at: thought.created_at ?? ts,
    updated_at: ts,
  };

  const cols = Object.keys(record);
  const placeholders = cols.map(() => "?").join(", ");
  const sql = `INSERT OR REPLACE INTO thoughts (${cols.join(", ")}) VALUES (${placeholders})`;

  await db
    .prepare(sql)
    .bind(...Object.values(record))
    .run();
  return deserializeThought(record);
}

/** Delete a thought by ID. */
export async function deleteThoughtRecord(id: string) {
  const db = getDB();
  if (!db) throw new Error("Database not configured");

  await db.prepare("DELETE FROM thoughts WHERE id = ?").bind(id).run();
}

/** Increment view count for a thought by slug. */
export async function incrementThoughtViewCount(slug: string) {
  const db = getDB();
  if (!db) return;

  await db
    .prepare("UPDATE thoughts SET views = views + 1 WHERE slug = ?")
    .bind(slug)
    .run();
}

/** Fetch aggregated stats for the admin analytics monitor. */
export async function fetchThoughtStats(options?: QueryOptions) {
  const db = getDB();
  if (!db) return null;

  try {
    let sql =
      "SELECT id, title, slug, views, published, created_at, section FROM thoughts";
    const params: unknown[] = [];
    if (options?.subdomain) {
      sql += " WHERE section = ?";
      params.push(options.subdomain);
    }
    sql += " ORDER BY views DESC";

    const stmt = db.prepare(sql);
    const { results } = await (
      params.length > 0 ? stmt.bind(...params) : stmt
    ).all<Record<string, unknown>>();

    const thoughts = results ?? [];
    const totalViews = thoughts.reduce(
      (acc, t) => acc + ((t.views as number) || 0),
      0,
    );
    const totalThoughts = thoughts.length;
    const publishedCount = thoughts.filter((t) => toBool(t.published)).length;
    const draftCount = totalThoughts - publishedCount;
    const topThoughts = thoughts.slice(0, 5).map((t) => ({
      ...t,
      published: toBool(t.published),
    }));

    return {
      totalViews,
      totalThoughts,
      publishedCount,
      draftCount,
      topThoughts,
    };
  } catch (err) {
    logger.error("admin", "D1 fetchThoughtStats failed", {
      error: String(err),
    });
    return null;
  }
}
