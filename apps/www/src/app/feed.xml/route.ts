import { supabase } from "@/lib/supabaseClient";

export const revalidate = 3600;

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const siteUrl = "https://anipotts.com";

  let thoughts: { title: string; slug: string; summary: string | null; created_at: string }[] = [];

  if (supabase) {
    const { data } = await supabase
      .from("thoughts")
      .select("title, slug, summary, created_at")
      .eq("published", true)
      .order("created_at", { ascending: false })
      .limit(50);
    thoughts = data ?? [];
  }

  const items = thoughts
    .map(
      (t) => `    <item>
      <title>${escapeXml(t.title)}</title>
      <link>${siteUrl}/thoughts/${escapeXml(t.slug)}</link>
      <guid isPermaLink="true">${siteUrl}/thoughts/${escapeXml(t.slug)}</guid>
      <description>${escapeXml(t.summary ?? "")}</description>
      <pubDate>${new Date(t.created_at).toUTCString()}</pubDate>
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
