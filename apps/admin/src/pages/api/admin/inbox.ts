import type { APIRoute } from "astro";
import { readAdminInbox } from "../../../data/inbox";

export const GET: APIRoute = async (context) => {
  const inbox = await readAdminInbox(context.locals.runtime?.env.DB);
  return Response.json(inbox, {
    headers: { "cache-control": "no-store" },
  });
};
