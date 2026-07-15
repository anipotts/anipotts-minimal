import { defineMiddleware } from "astro:middleware";
import { hasActivePasskeySession } from "./lib/passkey-auth";

const PUBLIC_PATHS = new Set([
  "/auth/passkey",
  "/api/health",
  "/api/mcp",
  "/favicon.svg",
  "/favicon-light.svg",
  "/favicon-dark.svg",
  "/favicon-light-32.png",
  "/favicon-dark-32.png",
  "/favicon-16x16.png",
  "/favicon-32x32.png",
  "/apple-touch-icon.png",
]);

const PUBLIC_PASSKEY_API_PATHS = new Set([
  "/api/admin/passkey/login-options",
  "/api/admin/passkey/login-verify",
  "/api/admin/passkey/logout",
  "/api/admin/passkey/register-options",
  "/api/admin/passkey/register-verify",
  "/api/admin/passkey/revoke-current",
  "/api/admin/passkey/status",
]);

const PUBLIC_PREFIXES = ["/_astro/", "/assets/"];

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
    PUBLIC_PATHS.has(pathname) ||
    PUBLIC_PASSKEY_API_PATHS.has(pathname) ||
    PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  );
}
