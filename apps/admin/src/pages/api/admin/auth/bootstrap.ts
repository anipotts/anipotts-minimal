import type { APIRoute } from "astro";
import { bootstrapPassword } from "../../../../lib/native-auth";
import { handlePasskeyError } from "../../../../lib/passkey-auth";

export const POST: APIRoute = async (context) => {
  try {
    return await bootstrapPassword(context);
  } catch (error) {
    return handlePasskeyError(error);
  }
};
