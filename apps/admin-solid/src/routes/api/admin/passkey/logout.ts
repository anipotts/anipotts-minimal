import type { HTTPEvent } from "vinxi/http";
import { handlePasskeyError, logout } from "~/lib/passkey-auth";

export async function POST(event: HTTPEvent) {
  try {
    return await logout(event);
  } catch (error) {
    return handlePasskeyError(error);
  }
}
