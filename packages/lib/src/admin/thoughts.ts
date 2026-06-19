/**
 * Query helpers for the writing/content D1 table.
 * Uses Drizzle ORM for typed D1 queries.
 */

import type { Thought, ContentSection } from "@anipotts/types";
import { eq, desc, sql, and } from "drizzle-orm";
import { logger } from "../logger";
import { getDrizzle, parseJsonArray, toJsonArray, uuid, now } from "../db";
import * as s from "../db/schema";

export interface QueryOptions {
  section?: ContentSection;
  /** @deprecated Use section. */
  subdomain?: ContentSection;
}

function querySection(options?: QueryOptions) {
  return options?.section ?? options?.subdomain;
}

/** Fetch all thoughts (admin view, includes drafts), ordered by newest first. */
export async function fetchAllThoughts(options?: QueryOptions) {
  const db = getDrizzle();
  if (!db) return [];

  try {
    const conditions = [];
    const section = querySection(options);
    if (section) {
      conditions.push(eq(s.thoughts.section, section));
    }

    const results = await db
      .select()
      .from(s.thoughts)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(s.thoughts.created_at));

    return results.map((row) => ({
      ...row,
      tags: parseJsonArray(row.tags),
      platforms_targeted: parseJsonArray(row.platforms_targeted),
      platforms_posted: parseJsonArray(row.platforms_posted),
      views: row.views ?? 0,
    }));
  } catch (err) {
    logger.error("admin", "D1 fetchAllThoughts failed", {
      error: String(err),
    });
    return [];
  }
}

/** Create or update a thought record. Returns the saved record. */
export async function upsertThoughtRecord(thought: Partial<Thought>) {
  const db = getDrizzle();
  if (!db) throw new Error("Database not configured");

  const id = thought.id || uuid();
  const ts = now();

  const record = {
    id,
    slug: thought.slug ?? "",
    title: thought.title ?? "",
    summary: thought.summary ?? "",
    content: thought.content ?? "",
    tags: toJsonArray(thought.tags),
    published: thought.published ?? false,
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

  await db
    .insert(s.thoughts)
    .values(record)
    .onConflictDoUpdate({
      target: s.thoughts.id,
      set: {
        slug: record.slug,
        title: record.title,
        summary: record.summary,
        content: record.content,
        tags: record.tags,
        published: record.published,
        views: record.views,
        section: record.section,
        content_type: record.content_type,
        series_type: record.series_type,
        status: record.status,
        artifact_url: record.artifact_url,
        artifact_type: record.artifact_type,
        platforms_targeted: record.platforms_targeted,
        platforms_posted: record.platforms_posted,
        voice_mode: record.voice_mode,
        project: record.project,
        published_at: record.published_at,
        scheduled_at: record.scheduled_at,
        updated_at: record.updated_at,
      },
    });

  return {
    ...record,
    tags: parseJsonArray(record.tags),
    platforms_targeted: parseJsonArray(record.platforms_targeted),
    platforms_posted: parseJsonArray(record.platforms_posted),
    views: record.views ?? 0,
  };
}

/** Delete a thought by ID. */
export async function deleteThoughtRecord(id: string) {
  const db = getDrizzle();
  if (!db) throw new Error("Database not configured");

  await db.delete(s.thoughts).where(eq(s.thoughts.id, id));
}

/** Increment view count for a thought by slug. */
export async function incrementThoughtViewCount(slug: string) {
  const db = getDrizzle();
  if (!db) return;

  await db
    .update(s.thoughts)
    .set({ views: sql`views + 1` })
    .where(eq(s.thoughts.slug, slug));
}

/** Fetch aggregated stats for the admin analytics monitor. */
export async function fetchThoughtStats(options?: QueryOptions) {
  const db = getDrizzle();
  if (!db) return null;

  try {
    const conditions = [];
    const section = querySection(options);
    if (section) {
      conditions.push(eq(s.thoughts.section, section));
    }

    const results = await db
      .select({
        id: s.thoughts.id,
        title: s.thoughts.title,
        slug: s.thoughts.slug,
        views: s.thoughts.views,
        published: s.thoughts.published,
        created_at: s.thoughts.created_at,
        section: s.thoughts.section,
      })
      .from(s.thoughts)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(s.thoughts.views));

    const totalViews = results.reduce((acc, t) => acc + (t.views || 0), 0);
    const totalThoughts = results.length;
    const publishedCount = results.filter((t) => t.published).length;
    const draftCount = totalThoughts - publishedCount;
    const topThoughts = results.slice(0, 5);

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
