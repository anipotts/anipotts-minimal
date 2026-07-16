import type { APIRoute } from "astro";
import { changePassword } from "../../../../lib/native-auth";
import { handlePasskeyError } from "../../../../lib/passkey-auth";

export const POST: APIRoute = async (context) => {
  try {
    return await changePassword(context);
  } catch (error) {
    return handlePasskeyError(error);
  }
};
