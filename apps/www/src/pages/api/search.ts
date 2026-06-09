import type { APIRoute } from "astro";
import { json } from "../../lib/api";

export const prerender = false;

/** thoughts full-text search over d1 fts5 (thoughts_fts). feeds the
 *  /thoughts search island. */
export const GET: APIRoute = async ({ url, locals }) => {
  const q = (url.searchParams.get("q") ?? "").trim().toLowerCase();
  if (!q) return json({ results: [] });

  const db = locals.runtime.env.DB;
  try {
    // quoted match so user input is treated as a phrase, not fts syntax
    const phrase = `"${q.replaceAll('"', '""')}"`;
    const { results } = await db
      .prepare(
        `SELECT t.slug, t.title, t.summary, t.published_at, t.created_at, t.tags
         FROM thoughts_fts fts
         JOIN thoughts t ON t.rowid = fts.rowid
         WHERE thoughts_fts MATCH ?
           AND (t.status = 'published' OR t.published = 1)
         ORDER BY rank
         LIMIT 20`,
      )
      .bind(phrase)
      .all<Record<string, unknown>>();

    return json({
      results: (results ?? []).map((row) => ({
        slug: String(row.slug),
        title: String(row.title),
        summary: String(row.summary ?? ""),
        date: String(row.published_at ?? row.created_at ?? ""),
      })),
    });
  } catch (error) {
    console.error("search api error", error);
    return json({ error: "Search unavailable" }, 503);
  }
};
