import type { APIRoute } from "astro";
import { handleAdminAuthError } from "../../../../lib/admin-auth";
import { inviteRegistrationOptions } from "../../../../lib/admin-invites";

export const POST: APIRoute = async (context) => {
  try {
    return await inviteRegistrationOptions(context);
  } catch (error) {
    return handleAdminAuthError(error);
  }
};
