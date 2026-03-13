import { getPublishedThoughts } from "@/content/thoughts";

export const revalidate = 3600;

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const siteUrl = "https://anipotts.com";
  const thoughts = (await getPublishedThoughts()).slice(0, 50);

  const items = thoughts
    .map(
      (thought) => `    <item>
      <title>${escapeXml(thought.title)}</title>
      <link>${siteUrl}/thoughts/${escapeXml(thought.slug)}</link>
      <guid isPermaLink="true">${siteUrl}/thoughts/${escapeXml(thought.slug)}</guid>
      <description>${escapeXml(thought.summary)}</description>
      <pubDate>${new Date(thought.date).toUTCString()}</pubDate>
    </item>`,
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>ani potts</title>
    <link>${siteUrl}</link>
    <description>Technical writings and reflections from ani potts</description>
    <language>en-us</language>
    <atom:link href="${siteUrl}/feed.xml" rel="self" type="application/rss+xml" />
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
