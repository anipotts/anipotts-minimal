import { loadAdminControlSnapshot } from "@anipotts/lib/admin-control";
import { env } from "cloudflare:workers";

export async function GET() {
  const snapshot = await loadAdminControlSnapshot(env.DB);

  return Response.json(snapshot, {
    headers: {
      "cache-control": "no-store",
    },
  });
}
