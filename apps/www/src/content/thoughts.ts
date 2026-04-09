/**
 * Thought/blog content fetching.
 *
 * Data source priority: D1 -> Supabase -> empty.
 * Filesystem reads removed (Workers have no filesystem).
 * Markdown files sync to the database via git hook, so DB is always fresh.
 */

import { cache } from "react";
import { getDB, parseJsonArray, toBool } from "@anipotts/lib/db";
import { createServerClient } from "@anipotts/lib";

export interface ThoughtEntry {
  slug: string;
  title: string;
  summary: string;
  date: string;
  tags: string[];
  published: boolean;
  content: string;
}

function d1RowToEntry(row: Record<string, unknown>): ThoughtEntry {
  return {
    slug: String(row.slug),
    title: String(row.title),
    summary: String(row.summary ?? ""),
    date: String(row.published_at ?? row.created_at ?? ""),
    tags: parseJsonArray(row.tags),
    published: row.status === "published" || toBool(row.published),
    content: String(row.content ?? ""),
  };
}

function supabaseRowToEntry(row: Record<string, unknown>): ThoughtEntry {
  const tags = Array.isArray(row.tags) ? row.tags.map(String) : [];
  return {
    slug: String(row.slug),
    title: String(row.title),
    summary: String(row.summary ?? ""),
    date: String(row.published_at ?? row.created_at ?? ""),
    tags,
    published: row.status === "published" || Boolean(row.published),
    content: String(row.content ?? ""),
  };
}

export const getPublishedThoughts = cache(async (): Promise<ThoughtEntry[]> => {
  // D1 path
  const db = getDB();
  if (db) {
    try {
      const { results } = await db
        .prepare(
          "SELECT * FROM thoughts WHERE status = 'published' OR published = 1 ORDER BY published_at DESC, created_at DESC",
        )
        .all<Record<string, unknown>>();
      return (results ?? []).map(d1RowToEntry);
    } catch {
      // fall through to Supabase
    }
  }

  // Supabase path
  const supabase = createServerClient();
  if (supabase) {
    const { data, error } = await supabase
      .from("thoughts")
      .select("*")
      .eq("status", "published")
      .order("published_at", { ascending: false });

    if (!error && data && data.length > 0) {
      return data.map((row: Record<string, unknown>) =>
        supabaseRowToEntry(row),
      );
    }
  }

  return [];
});

export async function getThoughtBySlug(
  slug: string,
): Promise<ThoughtEntry | undefined> {
  // D1 path
  const db = getDB();
  if (db) {
    try {
      const row = await db
        .prepare(
          "SELECT * FROM thoughts WHERE slug = ? AND (status = 'published' OR published = 1)",
        )
        .bind(slug)
        .first<Record<string, unknown>>();
      if (row) return d1RowToEntry(row);
    } catch {
      // fall through to Supabase
    }
  }

  // Supabase path
  const supabase = createServerClient();
  if (supabase) {
    const { data, error } = await supabase
      .from("thoughts")
      .select("*")
      .eq("slug", slug)
      .eq("status", "published")
      .single();

    if (!error && data) {
      return supabaseRowToEntry(data as Record<string, unknown>);
    }
  }

  return undefined;
}

export async function searchThoughtEntries(
  query: string,
): Promise<ThoughtEntry[]> {
  const q = query.trim().toLowerCase();
  if (!q) return getPublishedThoughts();

  // D1 FTS5 search
  const db = getDB();
  if (db) {
    try {
      const { results } = await db
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
      return (results ?? []).map(d1RowToEntry);
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
