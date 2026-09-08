import { siteConfig } from "@anipotts/content/public";

export const prerender = true;

export function GET(): Response {
  return new Response(
    `User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${siteConfig.url}/sitemap.xml\n`,
    {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    },
  );
}
