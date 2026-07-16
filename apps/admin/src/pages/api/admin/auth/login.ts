import type { APIRoute } from "astro";
import { loginWithPassword } from "../../../../lib/native-auth";
import { handlePasskeyError } from "../../../../lib/passkey-auth";

export const POST: APIRoute = async (context) => {
  try {
    return await loginWithPassword(context);
  } catch (error) {
    return handlePasskeyError(error);
  }
};
