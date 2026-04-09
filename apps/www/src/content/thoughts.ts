/**
 * Thought/blog content fetching.
 *
 * Data source: D1 only.
 * Filesystem reads removed (Workers have no filesystem).
 * Markdown files sync to the database via git hook, so DB is always fresh.
 */

import { cache } from "react";
import {
  getDrizzle,
  getDB,
  parseJsonArray,
  schema,
  eq,
  or,
  desc,
} from "@anipotts/lib/db";

export interface ThoughtEntry {
  slug: string;
  title: string;
  summary: string;
  date: string;
  tags: string[];
  published: boolean;
  content: string;
}

type ThoughtRow = typeof schema.thoughts.$inferSelect;

function thoughtRowToEntry(row: ThoughtRow): ThoughtEntry {
  return {
    slug: row.slug,
    title: row.title,
    summary: row.summary ?? "",
    date: row.published_at ?? row.created_at ?? "",
    tags: parseJsonArray(row.tags),
    published: row.status === "published" || (row.published ?? false),
    content: row.content ?? "",
  };
}

export const getPublishedThoughts = cache(async (): Promise<ThoughtEntry[]> => {
  const db = getDrizzle();
  if (db) {
    try {
      const results = await db
        .select()
        .from(schema.thoughts)
        .where(
          or(
            eq(schema.thoughts.status, "published"),
            eq(schema.thoughts.published, true),
          ),
        )
        .orderBy(
          desc(schema.thoughts.published_at),
          desc(schema.thoughts.created_at),
        );
      return results.map(thoughtRowToEntry);
    } catch {
      // D1 query failed
    }
  }

  return [];
});

export async function getThoughtBySlug(
  slug: string,
): Promise<ThoughtEntry | undefined> {
  const db = getDrizzle();
  if (db) {
    try {
      const rows = await db
        .select()
        .from(schema.thoughts)
        .where(eq(schema.thoughts.slug, slug));
      const row = rows[0];
      if (row && (row.status === "published" || row.published)) {
        return thoughtRowToEntry(row);
      }
    } catch {
      // D1 query failed
    }
  }

  return undefined;
}

export async function searchThoughtEntries(
  query: string,
): Promise<ThoughtEntry[]> {
  const q = query.trim().toLowerCase();
  if (!q) return getPublishedThoughts();

  // D1 FTS5 search: must use raw SQL (Drizzle doesn't support FTS5 MATCH)
  const d1 = getDB();
  if (d1) {
    try {
      const { results } = await d1
        .prepare(
          `SELECT t.* FROM thoughts_fts fts
           JOIN thoughts t ON t.rowid = fts.rowid
           WHERE thoughts_fts MATCH ?
             AND (t.status = 'published' OR t.published = 1)
           ORDER BY rank
           LIMIT 20`,
        )
        .bind(q)
        .all<Record<string, unknown>>();
      return (results ?? []).map((row) => ({
        slug: String(row.slug),
        title: String(row.title),
        summary: String(row.summary ?? ""),
        date: String(row.published_at ?? row.created_at ?? ""),
        tags: parseJsonArray(row.tags),
        published:
          row.status === "published" ||
          row.published === 1 ||
          row.published === true,
        content: String(row.content ?? ""),
      }));
    } catch {
      // fall through to in-memory filter
    }
  }

  // Fallback: in-memory filter
  const thoughts = await getPublishedThoughts();
  return thoughts.filter(
    (t) =>
      t.title.toLowerCase().includes(q) ||
      t.summary.toLowerCase().includes(q) ||
      t.tags.join(" ").toLowerCase().includes(q) ||
      t.content.toLowerCase().includes(q),
  );
}

/**
 * @deprecated Use getPublishedThoughts() instead.
 * Kept for backward compatibility with components that import this.
 */
export const getThoughtEntries = cache(
  async (): Promise<ThoughtEntry[]> => getPublishedThoughts(),
);
