import type { APIRoute } from "astro";

export const prerender = false;

/** the a. monogram favicon, served dynamically for legacy consumers of
 *  /api/icon. ?theme=dark flips the surface. the static /favicon.svg is the
 *  primary icon. */
export const GET: APIRoute = ({ url }) => {
  const dark = url.searchParams.get("theme") === "dark";
  const bg = dark ? "#11111b" : "#fbfaf7";
  const ink = dark ? "#cdd6f4" : "#1a1a1a";
  const spark = dark ? "#89b4fa" : "#2563eb";

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="${bg}" />
  <text x="16" y="46" fill="${ink}" font-family="Inter, system-ui, sans-serif" font-weight="600" font-size="44" letter-spacing="-0.02em">a</text>
  <circle cx="46" cy="42" r="5" fill="${spark}" />
</svg>`;

  return new Response(svg, {
    headers: {
      "content-type": "image/svg+xml",
      "cache-control": "public, max-age=86400",
    },
  });
};
