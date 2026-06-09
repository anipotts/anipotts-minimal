import type { APIRoute } from "astro";
import {
  experimentSlug,
  projectSlug,
  publishedExperiments,
  publishedThoughts,
  thoughtSlug,
  visibleProjects,
  weeklyDigests,
} from "../lib/content";

const BASE = "https://anipotts.com";

interface Entry {
  path: string;
  priority: number;
  lastmod?: string;
}

export const GET: APIRoute = async () => {
  const thoughts = await publishedThoughts();
  const projects = await visibleProjects();
  const weeks = await weeklyDigests();
  const experiments = await publishedExperiments();

  const entries: Entry[] = [
    { path: "/", priority: 1 },
    { path: "/work", priority: 0.9 },
    { path: "/projects", priority: 0.8 },
    { path: "/thoughts", priority: 0.85 },
    { path: "/labs", priority: 0.7 },
    { path: "/claude", priority: 0.9 },
    { path: "/connect", priority: 0.8 },
    ...thoughts.map((t) => ({
      path: `/thoughts/${thoughtSlug(t)}`,
      priority: 0.65,
      lastmod: t.data.published_at?.toISOString(),
    })),
    ...projects.map((p) => ({
      path: `/projects/${projectSlug(p)}`,
      priority: 0.7,
    })),
    ...weeks.map((w) => ({
      path: `/labs/weekly/${w.data.week}`,
      priority: 0.5,
      lastmod: w.data.generated_at?.toISOString(),
    })),
    ...experiments.map((e) => ({
      path: `/labs/experiments/${experimentSlug(e)}`,
      priority: 0.5,
      lastmod: e.data.date.toISOString(),
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
