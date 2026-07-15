import type { APIRoute } from "astro";

export const prerender = false;

/** Redirect legacy icon consumers to the approved contextual `ap` mark. */
export const GET: APIRoute = ({ url }) => {
  const dark = url.searchParams.get("theme") === "dark";
  const asset = dark ? "/brand/ap-on-black.svg" : "/brand/ap-on-white.svg";

  return Response.redirect(new URL(asset, url), 307);
};
