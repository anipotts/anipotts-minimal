import { defineMiddleware } from "astro:middleware";

const SESSION_COOKIE = "admin_passkey_session";
const PUBLIC_PATHS = [
  "/auth/passkey",
  "/api/health",
  "/favicon-16x16.png",
  "/favicon-32x32.png",
  "/apple-touch-icon.png",
];

export const onRequest = defineMiddleware(async (context, next) => {
  if (isPublicPath(context.url.pathname)) return next();

  const hasSession = await hasActiveSession(context);
  if (hasSession) return next();

  const nextPath = encodeURIComponent(
    `${context.url.pathname}${context.url.search}`,
  );
  return context.redirect(`/auth/passkey?next=${nextPath}`, 302);
});

function isPublicPath(pathname: string): boolean {
  return (
    PUBLIC_PATHS.includes(pathname) ||
    pathname.startsWith("/_astro/") ||
    pathname.startsWith("/assets/")
  );
}

async function hasActiveSession(context: {
  cookies: { get(name: string): { value: string } | undefined };
  locals: App.Locals;
}): Promise<boolean> {
  const token = context.cookies.get(SESSION_COOKIE)?.value;
  const db = context.locals.runtime?.env.DB;
  if (!token || !db) return false;

  const tokenHash = await hashToken(token);
  const row = await db
    .prepare(
      `SELECT id FROM admin_passkey_sessions
       WHERE token_hash = ? AND revoked_at IS NULL AND expires_at > ?
       LIMIT 1`,
    )
    .bind(tokenHash, new Date().toISOString())
    .first<{ id: string }>();

  context.locals.passkeySessionActive = Boolean(row);
  return Boolean(row);
}

async function hashToken(token: string): Promise<string> {
  const bytes = new TextEncoder().encode(token);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
