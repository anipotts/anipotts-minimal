import type { APIRoute } from "astro";
import {
  handlePasskeyError,
  registrationOptions,
} from "../../../../lib/passkey-auth";

export const POST: APIRoute = async (context) => {
  try {
    return await registrationOptions(context);
  } catch (error) {
    return handlePasskeyError(error);
  }
};
