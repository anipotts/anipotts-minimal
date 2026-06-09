import type { APIRoute } from "astro";

export const prerender = false;

/** posthog reverse proxy (replaces the next.js /ingest rewrites). static
 *  assets go to us-assets, events to us. */
const handler: APIRoute = async ({ params, request, url }) => {
  const path = params.path ?? "";
  const upstream = path.startsWith("static/")
    ? `https://us-assets.i.posthog.com/${path}`
    : `https://us.i.posthog.com/${path}`;

  const target = new URL(upstream);
  target.search = url.search;

  const headers = new Headers(request.headers);
  headers.set("host", target.host);

  const response = await fetch(target, {
    method: request.method,
    headers,
    body:
      request.method === "GET" || request.method === "HEAD"
        ? undefined
        : request.body,
  });

  return new Response(response.body, {
    status: response.status,
    headers: response.headers,
  });
};

export const GET = handler;
export const POST = handler;
export const OPTIONS = handler;
