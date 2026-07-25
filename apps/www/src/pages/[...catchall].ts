import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";

export const prerender = false;

/** on-demand catch-all. with `run_worker_first = false`, the asset
 *  binding serves all prerendered HTML directly; the worker only fires
 *  for paths with no static file. for those, middleware runs first
 *  (handling legacy redirects such as /thoughts and /work), and if it doesn't
 *  redirect, this catchall renders the prerendered 404 page. */
export const GET: APIRoute = async ({ request }) => {
  const notFound = await env.ASSETS.fetch(new URL("/404.html", request.url));
  return new Response(notFound.body, {
    status: 404,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
};
