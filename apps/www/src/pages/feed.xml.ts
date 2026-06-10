import rss from "@astrojs/rss";
import type { APIRoute } from "astro";
import { publishedWriting, writingSlug } from "../lib/content";

export const GET: APIRoute = async (context) => {
  const writingEntries = (await publishedWriting()).slice(0, 50);
  return rss({
    title: "ani potts",
    description:
      "ani potts. stuff i've figured out and felt like writing down.",
    site: context.site ?? "https://anipotts.com",
    items: writingEntries.map((t) => ({
      title: t.data.title,
      description: t.data.summary,
      link: `/writing/${writingSlug(t)}`,
      pubDate: t.data.published_at ?? new Date(0),
    })),
    customData: "<language>en-us</language>",
  });
};
