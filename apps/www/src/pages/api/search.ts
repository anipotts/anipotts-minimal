import type { APIRoute } from "astro";
import { json } from "../../lib/api";
import { searchWriting } from "@anipotts/lib/cms";
import { setDB } from "@anipotts/lib/db";
import type { D1Database } from "@anipotts/lib/db";
import { env } from "cloudflare:workers";

export const prerender = false;

/** writing full-text search over d1 fts5 (thoughts_fts). feeds the
 *  /writing search surface. */
export const GET: APIRoute = async ({ url }) => {
  const q = (url.searchParams.get("q") ?? "").trim().toLowerCase();
  if (!q) return json({ results: [] });

  setDB(env.DB as unknown as D1Database);

  try {
    const results = await searchWriting(q);

    return json({
      results: results.map((thought) => ({
        slug: thought.slug,
        title: thought.title,
        summary: thought.summary,
        date: thought.published_at ?? thought.created_at,
      })),
    });
  } catch (error) {
    console.error("search api error", error);
    return json({ error: "Search unavailable" }, 503);
  }
};
