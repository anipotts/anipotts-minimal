import { defineMiddleware } from "astro:middleware";

/** ported redirect map. /lab now points at /labs (the old /lab to /work
 *  mapping collided with the new /labs section, resolved per the rebuild plan). */
const REDIRECTS: Record<string, string> = {
  "/lab": "/labs",
  "/links": "/connect",
  "/dev": "/claude",
  "/updates": "/claude#proof",
  "/metrics": "/claude#playbooks",
  "/status": "/claude#work-together",
  "/docs": "/",
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

  // exact-segment redirect match: "/lab" and "/lab/..." redirect,
  // "/labs" never does (distinct segment).
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
