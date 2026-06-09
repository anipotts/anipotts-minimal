import type { APIRoute } from "astro";

export const prerender = false;

/** the a. monogram favicon, served dynamically for legacy consumers of
 *  /api/icon. ?theme=dark flips the surface. the static /favicon.svg is the
 *  primary icon. */
export const GET: APIRoute = ({ url }) => {
  const dark = url.searchParams.get("theme") === "dark";
  const bg = dark ? "#14110d" : "#f4f1ea";
  const ink = dark ? "#ece5d4" : "#1a1614";
  const spark = dark ? "#e8853a" : "#a8381c";

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="${bg}" />
  <text x="16" y="46" fill="${ink}" font-family="Georgia, serif" font-style="italic" font-weight="600" font-size="44">a</text>
  <circle cx="46" cy="42" r="5" fill="${spark}" />
</svg>`;

  return new Response(svg, {
    headers: {
      "content-type": "image/svg+xml",
      "cache-control": "public, max-age=86400",
    },
  });
};
