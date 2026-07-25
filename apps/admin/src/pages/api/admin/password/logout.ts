import type { APIRoute } from "astro";
import { logoutPassword } from "../../../../lib/password-auth";

export const POST: APIRoute = (context) => logoutPassword(context);
