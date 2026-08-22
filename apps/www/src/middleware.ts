import { defineMiddleware } from "astro:middleware";

/** flat redirect map: pathname (exact or prefix) -> destination. */
const REDIRECTS: Record<string, string> = {
  "/shipping": "/making",
  "/running": "/making",
  "/connect": "/systems",
  "/lab": "/systems",
  "/dev": "/systems",
  "/updates": "/systems",
  "/metrics": "/systems",
  "/status": "/systems",
  "/docs": "/",
  "/work": "/making",
  "/labs": "/systems",
};

const NEWS_HOST = "news.anipotts.com";

/** segment renames (noun -> verb). preserve subpaths and query. these are
 *  external link-equity redirects: every old anipotts.com/thoughts/* url
 *  ever shared keeps resolving. */
const RENAMES: Record<string, string> = {
  "/thoughts": "/writing",
  "/claude": "/systems",
  "/orchestrating": "/systems",
};

const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self'",
    "connect-src 'self' https://us.i.posthog.com https://us-assets.i.posthog.com",
  ].join("; "),
};

function applyHtmlSecurityHeaders(response: Response): Response {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("text/html")) return response;
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname, search } = context.url;
  const host = context.url.hostname.toLowerCase();

  if (host === NEWS_HOST) {
    if (pathname === "/") {
      const page = await next(new URL("/newsletter", context.url));
      return applyHtmlSecurityHeaders(page);
    }

    if (pathname === "/newsletter") {
      return context.redirect("/", 301);
    }

    if (pathname === "/archive" || pathname.startsWith("/archive/")) {
      const page = await next(new URL("/newsletter/archive", context.url));
      return applyHtmlSecurityHeaders(page);
    }
  }

  // segment renames: preserve the tail. /thoughts/foo -> /writing/foo.
  for (const [from, to] of Object.entries(RENAMES)) {
    if (pathname === from) {
      return context.redirect(`${to}${search}`, 301);
    }
    if (pathname.startsWith(`${from}/`)) {
      return context.redirect(
        `${to}${pathname.slice(from.length)}${search}`,
        301,
      );
    }
  }

  // flat redirects: tail is discarded. "/lab" and "/lab/..." both land
  // on the destination instead of preserving stale subpaths.
  for (const [from, to] of Object.entries(REDIRECTS)) {
    if (pathname === from || pathname.startsWith(`${from}/`)) {
      return context.redirect(to, 301);
    }
  }

  // /admin moved to the admin subdomain
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    const adminPath = pathname.replace(/^\/admin/, "") || "/";
    return context.redirect(
      `https://admin.anipotts.com${adminPath}${search}`,
      308,
    );
  }

  const response = await next();

  return applyHtmlSecurityHeaders(response);
});
