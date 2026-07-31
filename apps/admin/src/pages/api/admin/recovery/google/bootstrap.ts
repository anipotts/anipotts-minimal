import type { APIRoute } from "astro";
import { handleAdminAuthError } from "../../../../../lib/admin-auth";
import { bootstrapGoogleOwnerSubject } from "../../../../../lib/admin-recovery";

export const POST: APIRoute = async (context) => {
  try {
    return await bootstrapGoogleOwnerSubject(context);
  } catch (error) {
    return handleAdminAuthError(error);
  }
};
