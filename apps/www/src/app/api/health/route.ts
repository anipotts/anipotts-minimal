export const dynamic = "force-dynamic";

export async function GET() {
  let d1Status: "connected" | "error" = "error";
  let tablesOk = false;

  try {
    // getCloudflareContext() works in route handlers on OpenNext
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getCloudflareContext } = require("@opennextjs/cloudflare");
    const ctx = getCloudflareContext();
    const db = ctx?.env?.DB;
    if (db) {
      const result = await db
        .prepare("SELECT COUNT(*) as cnt FROM thoughts LIMIT 1")
        .first();
      if (result && (result as { cnt: number }).cnt >= 0) {
        d1Status = "connected";
        tablesOk = true;
      }
    }
  } catch {
    d1Status = "error";
  }

  return Response.json({
    app: "www",
    ok: d1Status === "connected",
    d1: d1Status,
    tables_ok: tablesOk,
    ts: new Date().toISOString(),
  });
}
