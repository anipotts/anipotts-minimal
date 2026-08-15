import type { APIRoute } from "astro";
import { handleAdminAuthError } from "../../../../lib/admin-auth";
import { approveDeviceAuthorization } from "../../../../lib/device-authorization";

export const POST: APIRoute = async (context) => {
  try {
    return await approveDeviceAuthorization(context);
  } catch (error) {
    return handleAdminAuthError(error);
  }
};
