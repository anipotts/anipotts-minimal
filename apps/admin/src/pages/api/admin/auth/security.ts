import type { APIRoute } from "astro";
import { readSecurityState } from "../../../../lib/native-auth";
import { handlePasskeyError } from "../../../../lib/passkey-auth";

export const GET: APIRoute = async (context) => {
  try {
    return await readSecurityState(context);
  } catch (error) {
    return handlePasskeyError(error);
  }
};
