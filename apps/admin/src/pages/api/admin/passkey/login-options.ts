import type { APIRoute } from "astro";
import {
  authenticationOptions,
  handlePasskeyError,
} from "../../../../lib/passkey-auth";

export const POST: APIRoute = async (context) => {
  try {
    return await authenticationOptions(context);
  } catch (error) {
    return handlePasskeyError(error);
  }
};
