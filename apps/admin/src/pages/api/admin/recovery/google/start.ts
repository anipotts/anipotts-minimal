import type { APIRoute } from "astro";
import { handleAdminAuthError } from "../../../../../lib/admin-auth";
import { startGoogleRecovery } from "../../../../../lib/admin-recovery";

export const POST: APIRoute = async (context) => {
  try {
    return await startGoogleRecovery(context);
  } catch (error) {
    return handleAdminAuthError(error);
  }
};
