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
  "/api/admin/password/login",
  "/api/admin/password/logout",
  "/api/admin/password/status",
]);

const PUBLIC_PREFIXES = ["/_astro/", "/assets/"];
const DEV_LOOPBACK_ORIGINS = new Set([
  "http://localhost:4311",
  "http://127.0.0.1:4311",
]);
const DEV_LOOPBACK_PREVIEW_PATHS = new Set(["/", "/inbox", "/work"]);

type AdminAccessInput = {
  isDev: boolean;
  method: string;
  url: URL;
  hasSession: boolean;
};

export type AdminAccessDecision =
  | "public"
  | "dev-loopback-preview"
  | "session"
  | "passkey-required";

export function decideAdminAccess({
  isDev,
  method,
  url,
  hasSession,
}: AdminAccessInput): AdminAccessDecision {
  if (isPublicAdminPath(url.pathname)) return "public";
  if (isDevLoopbackPreviewRequest({ isDev, method, url })) {
    return "dev-loopback-preview";
  }
  if (hasSession) return "session";
  return "passkey-required";
}

export function isDevLoopbackPreviewRequest({
  isDev,
  method,
  url,
}: Omit<AdminAccessInput, "hasSession">): boolean {
  return (
    isDev &&
    (method === "GET" || method === "HEAD") &&
    DEV_LOOPBACK_ORIGINS.has(url.origin) &&
    DEV_LOOPBACK_PREVIEW_PATHS.has(url.pathname)
  );
}

export function isPublicAdminPath(pathname: string): boolean {
  return (
    PUBLIC_PATHS.has(pathname) ||
    PUBLIC_PASSKEY_API_PATHS.has(pathname) ||
    PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  );
}
