import type { APIRoute } from "astro";
import { handleAdminAuthError } from "../../../../lib/admin-auth";
import { readDeviceAuthorization } from "../../../../lib/device-authorization";

export const GET: APIRoute = async (context) => {
  try {
    return await readDeviceAuthorization(context);
  } catch (error) {
    return handleAdminAuthError(error);
  }
};
