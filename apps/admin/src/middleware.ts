import { defineMiddleware } from "astro:middleware";
import { hasActivePasskeySession } from "./lib/passkey-auth";

const PUBLIC_PATHS = [
  "/auth/passkey",
  "/api/health",
  "/favicon-16x16.png",
  "/favicon-32x32.png",
  "/apple-touch-icon.png",
];

export const onRequest = defineMiddleware(async (context, next) => {
  if (isPublicPath(context.url.pathname)) return next();

  const hasSession = await hasActivePasskeySession(context);
  if (hasSession) return next();

  const nextPath = encodeURIComponent(
    `${context.url.pathname}${context.url.search}`,
  );
  return context.redirect(`/auth/passkey?next=${nextPath}`, 302);
});

function isPublicPath(pathname: string): boolean {
  return (
    PUBLIC_PATHS.includes(pathname) ||
    pathname.startsWith("/api/admin/passkey/") ||
    pathname.startsWith("/_astro/") ||
    pathname.startsWith("/assets/")
  );
}
