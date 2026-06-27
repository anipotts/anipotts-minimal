import type { APIRoute } from "astro";
import {
  handlePasskeyError,
  verifyRegistration,
} from "../../../../lib/passkey-auth";

export const POST: APIRoute = async (context) => {
  try {
    return await verifyRegistration(context);
  } catch (error) {
    return handlePasskeyError(error);
  }
};
