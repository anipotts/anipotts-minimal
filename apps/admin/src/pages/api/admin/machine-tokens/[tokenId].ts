import type { APIRoute } from "astro";
import { revokeMachineToken } from "../../../../lib/native-auth";
import { handlePasskeyError, json } from "../../../../lib/passkey-auth";

export const DELETE: APIRoute = async (context) => {
  const tokenId = context.params.tokenId;
  if (!tokenId) return json({ error: "token_id_required" }, { status: 400 });
  try {
    return await revokeMachineToken(context, tokenId);
  } catch (error) {
    return handlePasskeyError(error);
  }
};
