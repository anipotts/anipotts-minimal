import type { APIRoute } from "astro";
import { createMachineToken } from "../../../../lib/native-auth";
import { handlePasskeyError } from "../../../../lib/passkey-auth";

export const POST: APIRoute = async (context) => {
  try {
    return await createMachineToken(context);
  } catch (error) {
    return handlePasskeyError(error);
  }
};
