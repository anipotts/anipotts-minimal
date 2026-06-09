import rss from "@astrojs/rss";
import type { APIRoute } from "astro";
import { publishedThoughts, thoughtSlug } from "../lib/content";

export const GET: APIRoute = async (context) => {
  const thoughts = (await publishedThoughts()).slice(0, 50);
  return rss({
    title: "ani potts",
    description: "Technical writings and reflections from ani potts",
    site: context.site ?? "https://anipotts.com",
    items: thoughts.map((t) => ({
      title: t.data.title,
      description: t.data.summary,
      link: `/thoughts/${thoughtSlug(t)}`,
      pubDate: t.data.published_at ?? new Date(0),
    })),
    customData: "<language>en-us</language>",
  });
};
