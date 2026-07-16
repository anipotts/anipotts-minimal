import type { APIRoute } from "astro";
import {
  listAdminActions,
  proposeAdminAction,
} from "../../../../lib/admin-actions";
import { handlePasskeyError } from "../../../../lib/passkey-auth";
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
