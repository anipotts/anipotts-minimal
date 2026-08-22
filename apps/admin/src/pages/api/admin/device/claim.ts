import type { APIRoute } from "astro";
import { handleAdminAuthError } from "../../../../lib/admin-auth";
import { claimDeviceAuthorization } from "../../../../lib/device-authorization";

export const POST: APIRoute = async (context) => {
  try {
    return await claimDeviceAuthorization(context);
  } catch (error) {
    return handleAdminAuthError(error);
  }
};
