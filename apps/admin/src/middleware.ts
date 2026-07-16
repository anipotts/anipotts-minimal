import { defineMiddleware } from "astro:middleware";
import { hasActivePasskeySession } from "./lib/passkey-auth";
import { hasActiveNativeSession } from "./lib/native-auth";

const PUBLIC_PATHS = new Set([
  "/auth",
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

const PUBLIC_NATIVE_AUTH_API_PATHS = new Set([
  "/api/admin/auth/status",
  "/api/admin/auth/bootstrap",
  "/api/admin/auth/login",
  "/api/admin/auth/logout",
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
  if (
    import.meta.env.DEV &&
    context.url.searchParams.get("source") === "fixture"
  ) {
    return next();
  }
  if (isMachineApiPath(context.url.pathname)) return next();
  if (isPublicPath(context.url.pathname)) return next();

  const [passkeySession, nativeSession] = await Promise.all([
    hasActivePasskeySession(context),
    hasActiveNativeSession(context),
  ]);
  context.locals.passkeySessionActive = passkeySession;
  context.locals.nativeSessionActive = nativeSession;
  if (passkeySession || nativeSession) return next();

  const nextPath = encodeURIComponent(
    `${context.url.pathname}${context.url.search}`,
  );
  return context.redirect(`/auth?next=${nextPath}`, 302);
});

function isPublicPath(pathname: string): boolean {
  return (
    PUBLIC_PATHS.has(pathname) ||
    PUBLIC_NATIVE_AUTH_API_PATHS.has(pathname) ||
    PUBLIC_PASSKEY_API_PATHS.has(pathname) ||
    PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  );
}

function isMachineApiPath(pathname: string): boolean {
  return (
    pathname === "/api/admin/projections/refresh" ||
    /^\/api\/admin\/actions\/[^/]+\/(claim|proof)$/.test(pathname)
  );
}
