import type { HTTPEvent } from "vinxi/http";
import { handlePasskeyError, registrationOptions } from "~/lib/passkey-auth";

export async function POST(event: HTTPEvent) {
  try {
    return await registrationOptions(event);
  } catch (error) {
    return handlePasskeyError(error);
  }
}
