import type { APIRoute } from "astro";
import {
  hasActivePasswordSession,
  passwordAuthConfigured,
} from "../../../../lib/password-auth";

export const GET: APIRoute = async (context) =>
  Response.json(
    {
      available: passwordAuthConfigured(context),
      has_session: await hasActivePasswordSession(context),
    },
    {
      headers: {
        "cache-control": "private, no-store",
        pragma: "no-cache",
        "referrer-policy": "no-referrer",
      },
    },
  );
