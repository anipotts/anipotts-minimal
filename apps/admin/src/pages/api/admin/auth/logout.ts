import type { APIRoute } from "astro";
import { logoutNativeSession } from "../../../../lib/native-auth";
import { handlePasskeyError } from "../../../../lib/passkey-auth";

export const POST: APIRoute = async (context) => {
  try {
    return await logoutNativeSession(context);
  } catch (error) {
    return handlePasskeyError(error);
  }
};
