import type { APIRoute } from "astro";
import { handleAdminAuthError } from "../../../../lib/admin-auth";
import { approveAdminMember } from "../../../../lib/admin-invites";

export const POST: APIRoute = async (context) => {
  try {
    return await approveAdminMember(context);
  } catch (error) {
    return handleAdminAuthError(error);
  }
};
