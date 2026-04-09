/**
 * Query helpers for the thoughts/blog system.
 * D1-first with Supabase fallback for backward compatibility.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
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
export async function fetchAllThoughts(
  supabase: SupabaseClient,
  options?: QueryOptions,
) {
  const db = getDB();
  if (db) {
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

  let query = supabase
    .from("thoughts")
    .select("*")
    .order("created_at", { ascending: false });

  if (options?.subdomain) {
    query = query.eq("subdomain", options.subdomain);
  }

  const { data, error } = await query;
  if (error) {
    logger.error("admin", "Error fetching thoughts", { error: String(error) });
    return [];
  }
  return data;
}

/** Create or update a thought record. Returns the saved record. */
export async function upsertThoughtRecord(
  supabase: SupabaseClient,
  thought: Partial<Thought>,
) {
  const db = getDB();
  if (db) {
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

  const { data, error } = await supabase
    .from("thoughts")
    .upsert(thought)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/** Delete a thought by ID. */
export async function deleteThoughtRecord(
  supabase: SupabaseClient,
  id: string,
) {
  const db = getDB();
  if (db) {
    await db.prepare("DELETE FROM thoughts WHERE id = ?").bind(id).run();
    return;
  }

  const { error } = await supabase.from("thoughts").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/** Increment view count for a thought by slug. */
export async function incrementThoughtViewCount(
  supabase: SupabaseClient,
  slug: string,
) {
  const db = getDB();
  if (db) {
    // D1/SQLite supports atomic increment natively
    await db
      .prepare("UPDATE thoughts SET views = views + 1 WHERE slug = ?")
      .bind(slug)
      .run();
    return;
  }

  // Supabase: try RPC first (atomic), fallback to read-modify-write
  const { error } = await supabase.rpc("increment_thought_views", {
    thought_slug: slug,
  });

  if (error) {
    const { data: thought } = await supabase
      .from("thoughts")
      .select("views")
      .eq("slug", slug)
      .single();

    if (thought) {
      await supabase
        .from("thoughts")
        .update({ views: (thought.views || 0) + 1 })
        .eq("slug", slug);
    }
  }
}

/** Fetch aggregated stats for the admin analytics monitor. */
export async function fetchThoughtStats(
  supabase: SupabaseClient,
  options?: QueryOptions,
) {
  const db = getDB();
  if (db) {
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

  let query = supabase
    .from("thoughts")
    .select("id, title, slug, views, published, created_at, subdomain")
    .order("views", { ascending: false });

  if (options?.subdomain) {
    query = query.eq("subdomain", options.subdomain);
  }

  const { data: thoughts, error } = await query;
  if (error) {
    logger.error("admin", "Error fetching thought stats", {
      error: String(error),
    });
    return null;
  }

  const totalViews = thoughts.reduce(
    (acc: number, t: { views?: number }) => acc + (t.views || 0),
    0,
  );
  const totalThoughts = thoughts.length;
  const publishedCount = thoughts.filter(
    (t: { published?: boolean }) => t.published,
  ).length;
  const draftCount = totalThoughts - publishedCount;
  const topThoughts = thoughts.slice(0, 5);

  return { totalViews, totalThoughts, publishedCount, draftCount, topThoughts };
}
