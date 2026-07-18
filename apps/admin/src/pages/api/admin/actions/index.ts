import type { APIRoute } from "astro";
import {
  listAdminActions,
  proposeAdminAction,
  reviseAdminAction,
} from "../../../../lib/admin-actions";
import { assertSameOriginMutation } from "@anipotts/lib/admin";
import { handlePasskeyError, json } from "../../../../lib/passkey-auth";
export const GET: APIRoute = async (context) => {
  try {
    return await listAdminActions(context);
  } catch (error) {
    return handlePasskeyError(error);
  }
};
export const POST: APIRoute = async (context) => {
  try {
    return await proposeAdminAction(context);
  } catch (error) {
    return handlePasskeyError(error);
  }
};

export const PATCH: APIRoute = async (context) => {
  try {
    assertSameOriginMutation(context.request);
    const body = (await context.request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    const actionId =
      typeof body.action_id === "string" ? body.action_id.trim() : "";
    if (!/^[A-Za-z0-9_-]{1,128}$/.test(actionId)) {
      return json({ error: "action_id_invalid" }, { status: 400 });
    }
    return await reviseAdminAction(context, actionId, body);
  } catch (error) {
    return handlePasskeyError(error);
  }
};
