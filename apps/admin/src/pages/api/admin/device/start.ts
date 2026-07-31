import type { APIRoute } from "astro";
import { handleAdminAuthError } from "../../../../lib/admin-auth";
import { startDeviceAuthorization } from "../../../../lib/device-authorization";

export const POST: APIRoute = async (context) => {
  try {
    return await startDeviceAuthorization(context);
  } catch (error) {
    return handleAdminAuthError(error);
  }
};
