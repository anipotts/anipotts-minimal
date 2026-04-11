import { getDrizzle, sql } from "@anipotts/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  let d1Status: "connected" | "error" = "error";
  let tablesOk = false;

  try {
    const db = getDrizzle();
    if (db) {
      const result = await db.all(
        sql`SELECT COUNT(*) as cnt FROM thoughts LIMIT 1`,
      );
      if (result.length > 0) {
        d1Status = "connected";
        tablesOk = true;
      }
    }
  } catch {
    d1Status = "error";
  }

  return Response.json({
    app: "admin",
    ok: d1Status === "connected",
    d1: d1Status,
    tables_ok: tablesOk,
    ts: new Date().toISOString(),
  });
}
