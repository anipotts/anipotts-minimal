import type { HTTPEvent } from "vinxi/http";
import { handlePasskeyError, verifyAuthentication } from "~/lib/passkey-auth";

export async function POST(event: HTTPEvent) {
  try {
    return await verifyAuthentication(event);
  } catch (error) {
    return handlePasskeyError(error);
  }
}
