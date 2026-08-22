import type { APIRoute } from "astro";
import { handleAdminAuthError } from "../../../../lib/admin-auth";
import { rotateMcpToken } from "../../../../lib/admin-machine-tokens";

export const POST: APIRoute = async (context) => {
  try {
    return await rotateMcpToken(context);
  } catch (error) {
    return handleAdminAuthError(error);
  }
};
