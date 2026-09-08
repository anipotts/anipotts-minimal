/** shared guards for the POST endpoints: origin allowlist + d1 sliding-window
 *  rate limit (5 requests / 10 min per ip, table rate_limits). */
import { siteConfig } from "@anipotts/content/public";

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

const CANONICAL_ORIGINS = new Set([
  siteConfig.url,
  `${new URL(siteConfig.url).protocol}//www.${new URL(siteConfig.url).host}`,
]);

/** reject cross-origin posts. same-origin (the serving host, so previews and
 *  local dev work) and the canonical origins pass. */
export function checkOrigin(request: Request): Response | null {
  const origin = request.headers.get("origin");
  if (!origin) return null;
  if (CANONICAL_ORIGINS.has(origin)) return null;
  try {
    if (new URL(origin).host === new URL(request.url).host) return null;
  } catch {
    /* malformed origin header falls through to forbidden */
  }
  return json({ error: "Forbidden" }, 403);
}

function requestIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const first = forwarded?.split(",")[0]?.trim();
  if (first) return first;
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

export async function checkRateLimit(
  request: Request,
  db: D1Database | undefined,
): Promise<boolean> {
  if (!db) return true;
  const key = `contact:${requestIp(request)}`;
  const now = Date.now();
  const windowStart = now - 10 * 60 * 1000;
  const max = 5;
  try {
    await db.batch([
      db
        .prepare("DELETE FROM rate_limits WHERE key = ? AND ts < ?")
        .bind(key, windowStart),
      db
        .prepare("INSERT INTO rate_limits (key, ts) VALUES (?, ?)")
        .bind(key, now),
    ]);
    const row = await db
      .prepare(
        "SELECT COUNT(*) as cnt FROM rate_limits WHERE key = ? AND ts >= ?",
      )
      .bind(key, windowStart)
      .first<{ cnt: number }>();
    return (row?.cnt ?? 1) <= max;
  } catch {
    return true;
  }
}
