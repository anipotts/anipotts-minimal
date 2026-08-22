import type { APIRoute } from "astro";
import { handleAdminAuthError } from "../../../../../lib/admin-auth";
import { finishGoogleRecovery } from "../../../../../lib/admin-recovery";

export const GET: APIRoute = async (context) => {
  try {
    return await finishGoogleRecovery(context);
  } catch (error) {
    return handleAdminAuthError(error);
  }
};
