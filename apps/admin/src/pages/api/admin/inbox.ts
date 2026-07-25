import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { readAdminInbox } from "../../../data/inbox";

export const GET: APIRoute = async () => {
  const inbox = await readAdminInbox(env.DB);
  return Response.json(inbox, {
    headers: { "cache-control": "no-store" },
  });
};
