import type { APIRoute } from "astro";
import { handleAdminAuthError } from "../../../../lib/admin-auth";
import { revokeMcpToken } from "../../../../lib/admin-machine-tokens";

export const POST: APIRoute = async (context) => {
  try {
    return await revokeMcpToken(context);
  } catch (error) {
    return handleAdminAuthError(error);
  }
};
