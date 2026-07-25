import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { assertSameOriginRequest } from "../../../../lib/content-draft-operation";
import {
  publishEditorDraft,
  saveEditorDraft,
  statusError,
  type ContentEditorPublishInput,
  type ContentEditorSaveInput,
} from "../../../../lib/content-editor";
import { getPasskeyActor } from "../../../../lib/passkey-auth";

export const POST: APIRoute = async (context) => {
  try {
    assertSameOriginRequest(context.request, context.url);

    const db = env.DB;
    if (!db) throw statusError(503, "db_binding_missing");

    const contentType = context.request.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().includes("application/json")) {
      throw statusError(415, "json_required");
    }

    const body = (await context.request.json()) as
      | ContentEditorSaveInput
      | ContentEditorPublishInput;
    const actor = await getPasskeyActor(context);

    if (body.action === "save_draft") {
      return Response.json(await saveEditorDraft(db, body, actor), {
        headers: { "cache-control": "no-store" },
      });
    }

    if (body.action === "publish") {
      return Response.json(await publishEditorDraft(db, body, actor), {
        headers: { "cache-control": "no-store" },
      });
    }

    throw statusError(400, "unknown_editor_action");
  } catch (error) {
    if (error instanceof Response) return error;
    return statusError(
      400,
      error instanceof Error ? error.message : "content_editor_failed",
    );
  }
};
