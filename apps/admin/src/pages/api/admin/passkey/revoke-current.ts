import type { APIRoute } from "astro";
import {
  handlePasskeyError,
  revokeCurrentCredential,
} from "../../../../lib/passkey-auth";

export const POST: APIRoute = async (context) => {
  try {
    return await revokeCurrentCredential(context);
  } catch (error) {
    return handlePasskeyError(error);
  }
};
