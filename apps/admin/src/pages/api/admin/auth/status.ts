import type { APIRoute } from "astro";
import { getNativeAuthStatus } from "../../../../lib/native-auth";
import { json } from "../../../../lib/passkey-auth";

export const GET: APIRoute = async (context) =>
  json(await getNativeAuthStatus(context));
