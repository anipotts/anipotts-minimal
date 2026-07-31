import type { APIRoute } from "astro";
import { handleAdminAuthError } from "../../../../lib/admin-auth";
import { reviewDeviceAuthorization } from "../../../../lib/device-authorization";

export const GET: APIRoute = async (context) => {
  try {
    return await reviewDeviceAuthorization(context);
  } catch (error) {
    return handleAdminAuthError(error);
  }
};
