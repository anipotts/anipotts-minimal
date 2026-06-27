import type { APIRoute } from "astro";
import {
  handlePasskeyError,
  verifyAuthentication,
} from "../../../../lib/passkey-auth";

export const POST: APIRoute = async (context) => {
  try {
    return await verifyAuthentication(context);
  } catch (error) {
    return handlePasskeyError(error);
  }
};
