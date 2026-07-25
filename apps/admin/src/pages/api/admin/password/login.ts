import type { APIRoute } from "astro";
import { loginWithPassword } from "../../../../lib/password-auth";

export const POST: APIRoute = (context) => loginWithPassword(context);
