import type { APIRoute } from "astro";
import { handleAdminAuthError } from "../../../../lib/admin-auth";
import { createAdminInvite } from "../../../../lib/admin-invites";

export const POST: APIRoute = async (context) => {
  try {
    return await createAdminInvite(context);
  } catch (error) {
    return handleAdminAuthError(error);
  }
};
