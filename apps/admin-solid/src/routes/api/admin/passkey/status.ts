import type { HTTPEvent } from "vinxi/http";
import { getPasskeyStatus, json } from "~/lib/passkey-auth";

export async function GET(event: HTTPEvent) {
  return json(await getPasskeyStatus(event));
}
