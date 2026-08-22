import type { APIRoute } from "astro";
import { handleAdminAuthError } from "../../../../lib/admin-auth";
import { verifyInviteRegistration } from "../../../../lib/admin-invites";

export const POST: APIRoute = async (context) => {
  try {
    return await verifyInviteRegistration(context);
  } catch (error) {
    return handleAdminAuthError(error);
  }
};
