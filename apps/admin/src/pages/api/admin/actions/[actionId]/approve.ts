import type { APIRoute } from "astro";
import { approveAdminAction } from "../../../../../lib/admin-actions";
import { handlePasskeyError, json } from "../../../../../lib/passkey-auth";
export const POST: APIRoute = async (context) => {
  if (!context.params.actionId)
    return json({ error: "action_id_required" }, { status: 400 });
  try {
    return await approveAdminAction(context, context.params.actionId);
  } catch (error) {
    return handlePasskeyError(error);
  }
};
