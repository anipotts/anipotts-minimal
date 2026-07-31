import type { APIRoute } from "astro";
import { handleAdminAuthError } from "../../../../lib/admin-auth";
import { inviteStatus } from "../../../../lib/admin-invites";

export const GET: APIRoute = async (context) => {
  try {
    return await inviteStatus(context);
  } catch (error) {
    return handleAdminAuthError(error);
  }
};
