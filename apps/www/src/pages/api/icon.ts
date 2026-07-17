import type { APIRoute } from "astro";

export const prerender = false;

/** Redirect legacy icon consumers to the compact contextual `ap` mark. */
export const GET: APIRoute = ({ url }) => {
  const dark = url.searchParams.get("theme") === "dark";
  const asset = dark
    ? "/brand/ap-favicon-dark.svg?v=20260717"
    : "/brand/ap-favicon-light.svg?v=20260717";

  return Response.redirect(new URL(asset, url), 307);
};
