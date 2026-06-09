import type { APIRoute } from "astro";

export const prerender = false;

/** on-demand catch-all so unmatched paths enter the worker and the
 *  middleware redirect map (/lab, /links, /dev, ...) gets to run before
 *  404ing. serves the prerendered 404 page for everything else. */
export const GET: APIRoute = async ({ request, locals }) => {
  const assets = locals.runtime.env.ASSETS;
  const notFound = await assets.fetch(new URL("/404.html", request.url));
  return new Response(notFound.body, {
    status: 404,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
};
