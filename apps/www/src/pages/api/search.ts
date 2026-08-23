import type { APIRoute } from "astro";
import { json } from "../../lib/api";
import { publishedWriting } from "../../lib/content";

export const prerender = false;

/** Search the same canonical writing collection rendered by the public site. */
export const GET: APIRoute = async ({ url }) => {
  const q = (url.searchParams.get("q") ?? "").trim().toLowerCase();
  if (!q) return json({ results: [] });

  try {
    const results = (await publishedWriting())
      .filter((item) =>
        [item.data.title, item.data.summary, item.body]
          .join(" ")
          .toLowerCase()
          .includes(q),
      )
      .slice(0, 20);

    return json({
      results: results.map((item) => ({
        slug: item.slug,
        title: item.data.title,
        summary: item.data.summary,
        date: item.data.published_at?.toISOString() ?? null,
      })),
    });
  } catch (error) {
    console.error("search api error", error);
    return json({ error: "Search unavailable" }, 503);
  }
};
