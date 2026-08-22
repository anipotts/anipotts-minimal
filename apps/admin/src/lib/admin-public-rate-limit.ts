import { adminJson, hashToken, type AdminD1Database } from "./admin-auth";

const PUBLIC_ALLOCATION_WINDOW_MS = 10 * 60 * 1000;
const PUBLIC_ALLOCATION_PER_SOURCE = 5;
const PUBLIC_ALLOCATION_GLOBAL = 120;

export async function requirePublicAllocationBudget(
  db: AdminD1Database,
  request: Request,
  bucket: "device" | "recovery",
  now = Date.now(),
): Promise<void> {
  const source =
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";
  const sourceHash = await hashToken(`admin-public:${source}`);
  const prefix = `admin-public:${bucket}:`;
  const key = `${prefix}${sourceHash}`;
  const windowStart = now - PUBLIC_ALLOCATION_WINDOW_MS;

  await db
    .prepare("DELETE FROM rate_limits WHERE key LIKE ? AND ts < ?")
    .bind(`${prefix}%`, windowStart)
    .run();

  const result = await db
    .prepare(
      `INSERT INTO rate_limits (key, ts)
       SELECT ?, ?
       WHERE (
         SELECT COUNT(*) FROM rate_limits WHERE key = ? AND ts >= ?
       ) < ?
       AND (
         SELECT COUNT(*) FROM rate_limits WHERE key LIKE ? AND ts >= ?
       ) < ?`,
    )
    .bind(
      key,
      now,
      key,
      windowStart,
      PUBLIC_ALLOCATION_PER_SOURCE,
      `${prefix}%`,
      windowStart,
      PUBLIC_ALLOCATION_GLOBAL,
    )
    .run();

  if (resultChanges(result) !== 1) {
    throw adminJson(
      { error: "request_rate_limited" },
      { status: 429, headers: { "retry-after": "600" } },
    );
  }
}

function resultChanges(result: { meta?: unknown }): number {
  return Number(
    (result.meta as { changes?: number } | undefined)?.changes ?? 0,
  );
}
