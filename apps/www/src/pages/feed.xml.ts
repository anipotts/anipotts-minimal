import rss from "@astrojs/rss";
import type { APIRoute } from "astro";
import { setDB } from "@anipotts/lib/db";
import type { D1Database } from "@anipotts/lib/db";
import { publishedWriting, writingSlug } from "../lib/content";

export const prerender = false;

export const GET: APIRoute = async (context) => {
  setDB(context.locals.runtime.env.DB as unknown as D1Database);
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
