import type { APIRoute } from "astro";
import { handlePasskeyError, logout } from "../../../../lib/passkey-auth";

export const POST: APIRoute = async (context) => {
  try {
    return await logout(context);
  } catch (error) {
    return handlePasskeyError(error);
  }
};
