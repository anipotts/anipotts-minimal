import type { APIRoute } from "astro";
import {
  projectSlug,
  publishedWriting,
  writingSlug,
  visibleProjects,
} from "../lib/content";
import { setDB } from "@anipotts/lib/db";
import type { D1Database } from "@anipotts/lib/db";
import { env } from "cloudflare:workers";

export const prerender = false;

const BASE = "https://anipotts.com";

interface Entry {
  path: string;
  priority: number;
  lastmod?: string;
}

export const GET: APIRoute = async () => {
  setDB(env.DB as unknown as D1Database);
  const writingEntries = await publishedWriting();
  const projects = await visibleProjects();

  const entries: Entry[] = [
    { path: "/", priority: 1 },
    { path: "/making", priority: 0.9 },
    { path: "/projects", priority: 0.8 },
    { path: "/writing", priority: 0.85 },
    { path: "/orchestrating", priority: 0.9 },
    ...writingEntries.map((t) => ({
      path: `/writing/${writingSlug(t)}`,
      priority: 0.65,
      lastmod: t.data.published_at?.toISOString(),
    })),
    ...projects.map((p) => ({
      path: `/projects/${projectSlug(p)}`,
      priority: 0.7,
    })),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map(
    (e) =>
      `  <url><loc>${BASE}${e.path === "/" ? "" : e.path}</loc>${
        e.lastmod ? `<lastmod>${e.lastmod}</lastmod>` : ""
      }<priority>${e.priority}</priority></url>`,
  )
  .join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
};
