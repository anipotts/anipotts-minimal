import { defineMiddleware } from "astro:middleware";

/** flat redirect map: pathname (exact or prefix) -> destination. */
const REDIRECTS: Record<string, string> = {
  "/lab": "/running",
  "/links": "/connect",
  "/dev": "/claude",
  "/updates": "/claude#proof",
  "/metrics": "/claude#playbooks",
  "/status": "/claude#work-together",
  "/docs": "/",
};

/** segment renames (noun -> verb). preserve subpaths and query. these are
 *  external link-equity redirects: every old anipotts.com/thoughts/* url
 *  ever shared keeps resolving. */
const RENAMES: Record<string, string> = {
  "/thoughts": "/writing",
  "/work": "/shipping",
  "/labs": "/running",
};

const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self'",
    "connect-src 'self' https://us.i.posthog.com https://us-assets.i.posthog.com",
    "frame-src https://challenges.cloudflare.com",
  ].join("; "),
};

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname, search } = context.url;

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
  // on the destination; "/running" is a distinct segment, never matches.
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

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("text/html")) {
    for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
      response.headers.set(key, value);
    }
  }
  return response;
});
