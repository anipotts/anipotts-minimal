import type { HTTPEvent } from "vinxi/http";
import { handlePasskeyError, verifyRegistration } from "~/lib/passkey-auth";

export async function POST(event: HTTPEvent) {
  try {
    return await verifyRegistration(event);
  } catch (error) {
    return handlePasskeyError(error);
  }
}
