import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { json } from "../../lib/api";

export const prerender = false;

export const GET: APIRoute = async () => {
  let d1: "connected" | "error" = "error";
  let tablesOk = false;
  try {
    const db = env.DB;
    const result = await db
      .prepare("SELECT COUNT(*) as cnt FROM thoughts LIMIT 1")
      .first<{ cnt: number }>();
    if (result && result.cnt >= 0) {
      d1 = "connected";
      tablesOk = true;
    }
  } catch {
    d1 = "error";
  }

  return json({
    app: "www",
    ok: d1 === "connected",
    d1,
    tables_ok: tablesOk,
    ts: new Date().toISOString(),
  });
};
