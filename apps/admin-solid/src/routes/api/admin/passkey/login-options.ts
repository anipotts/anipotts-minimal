import type { HTTPEvent } from "vinxi/http";
import { authenticationOptions, handlePasskeyError } from "~/lib/passkey-auth";

export async function POST(event: HTTPEvent) {
  try {
    return await authenticationOptions(event);
  } catch (error) {
    return handlePasskeyError(error);
  }
}
