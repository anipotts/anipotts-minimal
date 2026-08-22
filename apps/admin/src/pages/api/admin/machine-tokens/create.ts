import type { APIRoute } from "astro";
import { handleAdminAuthError } from "../../../../lib/admin-auth";
import { createMcpToken } from "../../../../lib/admin-machine-tokens";

export const POST: APIRoute = async (context) => {
  try {
    return await createMcpToken(context);
  } catch (error) {
    return handleAdminAuthError(error);
  }
};
