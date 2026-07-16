import type { APIRoute } from "astro";
import { claimAdminAction } from "../../../../../lib/admin-actions";
import { requireMachineToken } from "../../../../../lib/native-auth";
import { handlePasskeyError, json } from "../../../../../lib/passkey-auth";
export const POST: APIRoute = async (context) => {
  if (!context.params.actionId)
    return json({ error: "action_id_required" }, { status: 400 });
  const token = await requireMachineToken(context, "actions:claim");
  if (token instanceof Response) return token;
  try {
    return await claimAdminAction(context, context.params.actionId, token.id);
  } catch (error) {
    return handlePasskeyError(error);
  }
};
