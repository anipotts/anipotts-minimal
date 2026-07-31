import type { APIRoute } from "astro";
import { handleAdminAuthError } from "../../../../../lib/admin-auth";
import { verifyRecoveryRegistration } from "../../../../../lib/admin-recovery";

export const POST: APIRoute = async (context) => {
  try {
    return await verifyRecoveryRegistration(context);
  } catch (error) {
    return handleAdminAuthError(error);
  }
};
