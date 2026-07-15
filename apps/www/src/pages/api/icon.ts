import type { APIRoute } from "astro";

export const prerender = false;

/** Redirect legacy icon consumers to the compact contextual `ap` mark. */
export const GET: APIRoute = ({ url }) => {
  const dark = url.searchParams.get("theme") === "dark";
  const asset = dark
    ? "/brand/favicon-dark.svg?v=20260715"
    : "/brand/favicon-light.svg?v=20260715";

  return Response.redirect(new URL(asset, url), 307);
};
