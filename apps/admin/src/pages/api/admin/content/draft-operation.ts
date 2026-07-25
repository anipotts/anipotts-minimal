import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import {
  assertSameOriginRequest,
  saveDraftOperation,
  statusError,
  type DraftOperationSaveInput,
} from "../../../../lib/content-draft-operation";

export const POST: APIRoute = async (context) => {
  try {
    assertSameOriginRequest(context.request, context.url);

    const db = env.DB;
    if (!db) {
      throw statusError(503, "db_binding_missing");
    }

    const contentType = context.request.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().includes("application/json")) {
      throw statusError(415, "json_required");
    }

    const body = (await context.request.json()) as DraftOperationSaveInput;
    return Response.json(await saveDraftOperation(db, body), {
      headers: { "cache-control": "no-store" },
    });
  } catch (error) {
    if (error instanceof Response) return error;
    return statusError(
      400,
      error instanceof Error ? error.message : "draft_save_failed",
    );
  }
};
