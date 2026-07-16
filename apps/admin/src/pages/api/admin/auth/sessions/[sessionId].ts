import type { APIRoute } from "astro";
import { revokeNativeSession } from "../../../../../lib/native-auth";
import { handlePasskeyError, json } from "../../../../../lib/passkey-auth";

export const POST: APIRoute = async (context) => {
  const sessionId = context.params.sessionId;
  if (!sessionId)
    return json({ error: "session_id_required" }, { status: 400 });
  try {
    return await revokeNativeSession(context, sessionId);
  } catch (error) {
    return handlePasskeyError(error);
  }
};
