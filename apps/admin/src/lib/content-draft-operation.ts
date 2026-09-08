type D1PreparedStatement = {
  bind(...values: unknown[]): D1PreparedStatement;
  run(): Promise<{ success?: boolean; meta?: unknown }>;
};

export type DraftOperationD1Database = {
  prepare(query: string): D1PreparedStatement;
};

export type DraftOperationSaveInput = {
  page_key: string;
  field_path: string;
  proposed_value: string;
  source_ref?: string;
};

export type DraftOperationSaveResult = {
  ok: true;
  operation_id: string;
  status: "draft";
  next_safe_action: string;
};

const DRAFT_SAVE_PROOF_ID = "proof.admin.content-draft-save";
const MAX_PAGE_KEY_LENGTH = 160;
const MAX_FIELD_PATH_LENGTH = 320;
const MAX_PROPOSED_VALUE_LENGTH = 20_000;

export async function saveDraftOperation(
  db: DraftOperationD1Database,
  input: DraftOperationSaveInput,
): Promise<DraftOperationSaveResult> {
  const pageKey = cleanRequired(
    input.page_key,
    MAX_PAGE_KEY_LENGTH,
    "page_key",
  );
  const fieldPath = cleanRequired(
    input.field_path,
    MAX_FIELD_PATH_LENGTH,
    "field_path",
  );
  const proposedValue = cleanRequired(
    input.proposed_value,
    MAX_PROPOSED_VALUE_LENGTH,
    "proposed_value",
  );
  const sourceRef =
    cleanOptional(input.source_ref, 400) || `D1 page_content:${pageKey}`;
  const route = routeForPageKey(pageKey);
  const operationId = await draftOperationId(pageKey, fieldPath);
  const now = new Date().toISOString();
  const metadata = JSON.stringify({
    page_key: pageKey,
    field_path: fieldPath,
    write_scope: "draft_operation_only",
    save_surface: "/content/edit/:pageKey",
  });

  const result = await db
    .prepare(
      `INSERT INTO content_draft_operations (
        operation_id,
        kind,
        surface,
        route,
        source_ref,
        field_path,
        current_value_ref,
        proposed_value,
        status,
        risk_level,
        authority_state,
        required_approval_ids,
        allowed_actions,
        forbidden_actions,
        preview_targets,
        proof_ids,
        evidence_uri,
        redaction,
        created_by,
        created_at,
        updated_at,
        expires_at,
        rollback_ref,
        reviewer_note,
        metadata
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(operation_id) DO UPDATE SET
        source_ref = excluded.source_ref,
        route = excluded.route,
        proposed_value = excluded.proposed_value,
        status = excluded.status,
        authority_state = excluded.authority_state,
        allowed_actions = excluded.allowed_actions,
        forbidden_actions = excluded.forbidden_actions,
        preview_targets = excluded.preview_targets,
        proof_ids = excluded.proof_ids,
        evidence_uri = excluded.evidence_uri,
        redaction = excluded.redaction,
        updated_at = excluded.updated_at,
        expires_at = excluded.expires_at,
        rollback_ref = excluded.rollback_ref,
        reviewer_note = excluded.reviewer_note,
        metadata = excluded.metadata`,
    )
    .bind(
      operationId,
      "content_draft",
      surfaceForPageKey(pageKey),
      route,
      sourceRef,
      fieldPath,
      `page_content:${pageKey}.${fieldPath}`,
      proposedValue,
      "draft",
      riskForPageKey(pageKey),
      "passkey_draft_save_no_publish",
      "[]",
      JSON.stringify(["save_draft", "render_preview", "request_review"]),
      JSON.stringify([
        "publish",
        "deploy",
        "send",
        "sync_provider",
        "write_page_content",
        "write_source_file",
      ]),
      JSON.stringify(["/content/preview", route]),
      JSON.stringify([
        "admin.content.draft-save.passkey",
        "admin.content.write-path.draft-only",
      ]),
      `https://admin.anipotts.com/content/edit/${encodeURIComponent(pageKey)}`,
      "public_copy_only",
      "ani",
      now,
      now,
      null,
      `page_content:${pageKey}.${fieldPath}`,
      "Saved from the passkey-protected admin draft editor. No page_content, public route, publish event, send, deploy, or source file was changed.",
      metadata,
    )
    .run();

  if (result.success === false) {
    throw statusError(500, "draft_save_failed");
  }

  await writeDraftSaveProof(db, {
    operationId,
    pageKey,
    fieldPath,
    route,
    now,
  });

  return {
    ok: true,
    operation_id: operationId,
    status: "draft",
    next_safe_action:
      "review the draft preview; publish remains unavailable until the audited publish path exists",
  };
}

async function writeDraftSaveProof(
  db: DraftOperationD1Database,
  input: {
    operationId: string;
    pageKey: string;
    fieldPath: string;
    route: string;
    now: string;
  },
): Promise<void> {
  const metadata = JSON.stringify({
    operation_id: input.operationId,
    page_key: input.pageKey,
    field_path: input.fieldPath,
    route: input.route,
    write_scope: "draft_operation_only",
  });
  const summary = `Latest draft save wrote ${input.operationId} for ${input.pageKey}.${input.fieldPath} to content_draft_operations only. No page_content, public route, publish event, send, deploy, or source file was changed.`;

  const result = await db
    .prepare(
      `INSERT INTO admin_proof_events (
        id,
        kind,
        status,
        title,
        summary,
        evidence_uri,
        redaction,
        next_safe_action,
        source_ref,
        created_at,
        updated_at,
        metadata
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
        kind = excluded.kind,
        status = excluded.status,
        title = excluded.title,
        summary = excluded.summary,
        evidence_uri = excluded.evidence_uri,
        redaction = excluded.redaction,
        next_safe_action = excluded.next_safe_action,
        source_ref = excluded.source_ref,
        updated_at = excluded.updated_at,
        metadata = excluded.metadata`,
    )
    .bind(
      DRAFT_SAVE_PROOF_ID,
      "gate",
      "verified",
      "content draft saves are proof-backed",
      summary,
      "D1 anipotts-db content_draft_operations and admin_proof_events",
      "metadata_only",
      "review the saved draft operation from /content/drafts before any publish or public content write path exists",
      "apps/admin/src/lib/content-draft-operation.ts",
      input.now,
      input.now,
      metadata,
    )
    .run();

  if (result.success === false) {
    throw statusError(500, "draft_save_proof_failed");
  }
}

export function assertSameOriginRequest(request: Request, url: URL): void {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");

  if (origin) {
    if (origin !== url.origin) {
      throw statusError(403, "cross_origin_write_blocked");
    }
    return;
  }

  if (!referer) {
    throw statusError(403, "missing_origin");
  }

  try {
    const refererUrl = new URL(referer);
    if (refererUrl.origin !== url.origin) {
      throw statusError(403, "cross_origin_write_blocked");
    }
  } catch (error) {
    if (error instanceof Response) throw error;
    throw statusError(403, "invalid_referer");
  }
}

export function statusError(status: number, message: string): Response {
  return Response.json(
    {
      ok: false,
      error: message,
      next_safe_action: "retry from the admin page after passkey login",
    },
    {
      status,
      headers: { "cache-control": "no-store" },
    },
  );
}

function cleanRequired(
  value: unknown,
  maxLength: number,
  name: string,
): string {
  if (typeof value !== "string") {
    throw statusError(400, `${name}_must_be_string`);
  }
  const cleaned = value.trim();
  if (!cleaned) {
    throw statusError(400, `${name}_required`);
  }
  if (cleaned.length > maxLength) {
    throw statusError(400, `${name}_too_long`);
  }
  return cleaned;
}

function cleanOptional(value: unknown, maxLength: number): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

function routeForPageKey(pageKey: string): string {
  if (pageKey === "making" || pageKey === "projects") return "/work";
  if (pageKey === "home") return "/";
  if (pageKey === "newsletter_archive") return "/newsletter/archive";
  if (pageKey.startsWith("project:")) {
    return `/work/${pageKey.slice("project:".length)}`;
  }
  if (pageKey.startsWith("writing:")) {
    return `/writing/${pageKey.slice("writing:".length)}`;
  }
  return `/${pageKey}`;
}

function surfaceForPageKey(pageKey: string): "public_site" | "newsletter" {
  return pageKey.startsWith("newsletter") ? "newsletter" : "public_site";
}

function riskForPageKey(pageKey: string): "low" | "medium" {
  return pageKey === "newsletter_archive" || pageKey.startsWith("project:")
    ? "low"
    : "medium";
}

async function draftOperationId(
  pageKey: string,
  fieldPath: string,
): Promise<string> {
  const hash = await shortHash(`${pageKey}:${fieldPath}`);
  return `content-draft-save-${slugify(pageKey)}-${slugify(fieldPath).slice(
    0,
    48,
  )}-${hash}`;
}

async function shortHash(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)]
    .slice(0, 6)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "field"
  );
}
