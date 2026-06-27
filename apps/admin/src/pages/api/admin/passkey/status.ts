import type { APIRoute } from "astro";
import { getPasskeyStatus, json } from "../../../../lib/passkey-auth";

export const GET: APIRoute = async (context) =>
  json(await getPasskeyStatus(context));
