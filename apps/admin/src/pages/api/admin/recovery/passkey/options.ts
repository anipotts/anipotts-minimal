import type { APIRoute } from "astro";
import { handleAdminAuthError } from "../../../../../lib/admin-auth";
import { recoveryRegistrationOptions } from "../../../../../lib/admin-recovery";

export const POST: APIRoute = async (context) => {
  try {
    return await recoveryRegistrationOptions(context);
  } catch (error) {
    return handleAdminAuthError(error);
  }
};
