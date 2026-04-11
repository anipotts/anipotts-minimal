import { getDB } from "@anipotts/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  let d1Status: "connected" | "error" = "error";
  let tablesOk = false;

  try {
    const db = getDB();
    if (db) {
      const result = await db
        .prepare("SELECT COUNT(*) as cnt FROM thoughts LIMIT 1")
        .first<{ cnt: number }>();
      if (result && result.cnt >= 0) {
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
