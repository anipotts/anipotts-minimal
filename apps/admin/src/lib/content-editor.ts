import {
  normalizeCmsWriting,
  validateCmsWriting,
} from "@anipotts/content/public";
import { sourceContentRecords } from "../data/source-content";

type D1Result<T = unknown> = {
  results?: T[];
  success?: boolean;
  meta?: unknown;
};

type D1PreparedStatement = {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(): Promise<T | null>;
  all<T = unknown>(): Promise<D1Result<T>>;
  run(): Promise<D1Result>;
};

export type ContentEditorD1Database = {
  prepare(query: string): D1PreparedStatement;
  batch?(statements: D1PreparedStatement[]): Promise<D1Result[]>;
};

export type ContentVisibility = "private" | "draft" | "hidden" | "published";
export type ContentEditorKind = "writing" | "page";

export type ContentEditorPayload = {
  kind: ContentEditorKind;
  page_key: string;
  title: string;
  slug: string;
  summary: string;
  tags: string[];
  body: string;
  visibility: ContentVisibility;
  date: string;
  updated_by: string;
  updated_at: string;
  content: Record<string, unknown>;
};

export type ContentRevision = {
  id: string;
  source: "draft" | "published" | "publish_event";
  timestamp: string;
  author: string;
  status: string;
  summary: string;
  rollback_target: string;
  view_href: string;
};

export type ContentEditorState = {
  page_key: string;
  current: ContentEditorPayload;
  current_version: number;
  latest_draft: ContentRevision | null;
  revisions: ContentRevision[];
};

export type ContentEditorSaveInput = {
  action: "save_draft";
  kind?: string;
  page_key?: string;
  title?: string;
  slug?: string;
  summary?: string;
  tags?: string[] | string;
  body?: string;
  visibility?: string;
  date?: string;
};

export type ContentEditorPublishInput = {
  action: "publish";
  operation_id?: string;
};

export type ContentEditorActor = {
  id: string;
  display_name: string;
  credential_id_hint?: string | null;
};

type PageContentRow = {
  id: string;
  page_key: string;
  content: string;
  version: number | null;
  published: number | boolean | null;
  updated_at: string | null;
  updated_by: string | null;
  created_at: string | null;
  version_history: string | null;
};

type DraftOperationRow = {
  operation_id: string;
  surface: string;
  route: string;
  source_ref: string;
  field_path: string;
  proposed_value: string;
  status: string;
  risk_level: string;
  authority_state: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  rollback_ref: string;
  reviewer_note: string | null;
  metadata: string;
  page_key?: string | null;
  slug?: string | null;
  title?: string | null;
  visibility?: string | null;
  updated_by?: string | null;
  published_from_operation_id?: string | null;
};

type PublishEventRow = {
  id: string;
  operation_id: string | null;
  event_type: string;
  status: string;
  summary: string;
  rollback_ref: string;
  created_by: string;
  created_at: string;
};

const DEFAULT_AUTHOR = "ani";
const MAX_BODY_LENGTH = 50_000;
const MAX_SUMMARY_LENGTH = 600;
const MAX_TITLE_LENGTH = 160;
const RESERVED_WRITING_SLUGS = new Set([
  "new",
  "archive",
  "api",
  "feed",
  "feed-xml",
  "rss",
  "sitemap",
  "sitemap-xml",
]);

export async function readContentEditorState(
  db: ContentEditorD1Database | null | undefined,
  pageKey: string,
): Promise<ContentEditorState> {
  const cleanPageKey = normalizePageKey(pageKey || "writing:new");
  if (!db) {
    const current = payloadFromContent(null, cleanPageKey);
    return {
      page_key: cleanPageKey,
      current,
      current_version: 0,
      latest_draft: null,
      revisions: [],
    };
  }

  const [published, drafts, events] = await Promise.all([
    readPageRows(db, cleanPageKey),
    readDraftRows(db, cleanPageKey),
    readPublishEvents(db, cleanPageKey),
  ]);
  const currentRow =
    published.find((row) => isPublished(row.published)) ?? published[0] ?? null;
  const current = payloadFromContent(currentRow, cleanPageKey);
  const draftRevisions = drafts.map(draftRevisionFromRow);
  const publishedRevisions = published.map(publishedRevisionFromRow);
  const publishEventRevisions = events.map(publishEventRevisionFromRow);
  const revisions = [
    ...draftRevisions,
    ...publishedRevisions,
    ...publishEventRevisions,
  ].sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  return {
    page_key: cleanPageKey,
    current,
    current_version: Number(currentRow?.version ?? 0),
    latest_draft: draftRevisions[0] ?? null,
    revisions,
  };
}

export async function readDraftPreview(
  db: ContentEditorD1Database | null | undefined,
  operationId: string,
): Promise<ContentEditorPayload | null> {
  if (!db || !operationId.trim()) return null;
  const row = await db
    .prepare(
      `SELECT proposed_value
       FROM content_draft_operations
       WHERE operation_id = ?
       LIMIT 1`,
    )
    .bind(operationId.trim())
    .first<{ proposed_value: string }>();
  if (!row) return null;
  return parseEditorPayload(row.proposed_value);
}

export async function saveEditorDraft(
  db: ContentEditorD1Database,
  input: ContentEditorSaveInput,
  actor: ContentEditorActor = defaultActor(),
) {
  const payload = buildPayload(input, actor);
  await validatePayloadForSave(db, payload, input);
  const now = payload.updated_at;
  const operationId = `content-editor-${slugForId(payload.page_key)}-${Date.now().toString(36)}`;
  const route = routeForPayload(payload);
  const current = await latestPageContent(db, payload.page_key);
  const currentVersion = Number(current?.version ?? 0);
  const metadata = JSON.stringify({
    page_key: payload.page_key,
    title: payload.title,
    slug: payload.slug,
    visibility: payload.visibility,
    summary: payload.summary,
    tags: payload.tags,
    editor: "owner_writing_editor",
    author_id: actor.id,
    author_display_name: actor.display_name,
    credential_id_hint: actor.credential_id_hint ?? null,
  });
  const allowedActions = ["save_draft", "render_preview"];
  if (payload.visibility === "published") {
    allowedActions.push("publish_with_proof");
  }
  const forbiddenActions = [
    "send",
    "schedule_newsletter",
    "deploy",
    "write_source_file",
    "sync_provider",
  ];

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
        metadata,
        page_key,
        slug,
        title,
        visibility,
        updated_by,
        published_from_operation_id
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      operationId,
      "content_draft",
      "public_site",
      route,
      `D1 content_draft_operations:${operationId}`,
      `${payload.kind}.${payload.slug}.content`,
      current
        ? `page_content:${payload.page_key}@v${currentVersion}`
        : `page_content:${payload.page_key}:new`,
      JSON.stringify(payload),
      "draft",
      payload.visibility === "published" ? "medium" : "low",
      "passkey_owner_draft_saved_no_public_change",
      "[]",
      JSON.stringify(allowedActions),
      JSON.stringify(forbiddenActions),
      JSON.stringify([`/content/preview?operation_id=${operationId}`]),
      JSON.stringify([
        "admin.content.editor.draft",
        "admin.content.preview.d1",
      ]),
      `https://admin.anipotts.com/content/preview?operation_id=${operationId}`,
      "public_copy_only",
      actor.id,
      now,
      now,
      null,
      current
        ? `page_content:${payload.page_key}@v${currentVersion}`
        : `new_private_draft:${payload.page_key}`,
      "Saved from the passkey-protected owner editor. Public page_content is unchanged until explicit publish.",
      metadata,
      payload.page_key,
      payload.slug,
      payload.title,
      payload.visibility,
      actor.id,
      null,
    )
    .run();

  if (result.success === false) throw statusError(500, "draft_save_failed");

  return {
    ok: true,
    operation_id: operationId,
    page_key: payload.page_key,
    preview_href: `/content/preview?operation_id=${operationId}`,
    publishable: payload.visibility === "published",
    public_route: route,
    next_version: currentVersion + 1,
    rollback_ref: current
      ? `page_content:${payload.page_key}@v${currentVersion}`
      : `new_private_draft:${payload.page_key}`,
    visibility: payload.visibility,
    title: payload.title,
    slug: payload.slug,
  };
}

export async function publishEditorDraft(
  db: ContentEditorD1Database,
  input: ContentEditorPublishInput,
  actor: ContentEditorActor = defaultActor(),
) {
  const operationId = cleanRequired(input.operation_id, 220, "operation_id");
  const draft = await db
    .prepare(
      `SELECT *
       FROM content_draft_operations
       WHERE operation_id = ?
       LIMIT 1`,
    )
    .bind(operationId)
    .first<DraftOperationRow>();
  if (!draft) throw statusError(404, "draft_not_found");

  const payload = parseEditorPayload(draft.proposed_value);
  if (!payload) throw statusError(400, "draft_payload_invalid");
  if (payload.visibility !== "published") {
    throw statusError(409, "only_published_visibility_can_publish");
  }
  await validatePayloadForPublish(db, payload);

  const now = new Date().toISOString();
  const previous = await latestPageContent(db, payload.page_key);
  const nextVersion = Number(previous?.version ?? 0) + 1;
  const pageContentId = `page-content-${slugForId(payload.page_key)}-v${nextVersion}-${Date.now().toString(36)}`;
  const history = JSON.stringify([
    ...parseVersionHistory(previous?.version_history ?? null),
    ...(previous
      ? [
          {
            id: previous.id,
            version: previous.version ?? 0,
            status: isPublished(previous.published) ? "published" : "hidden",
            timestamp: previous.updated_at ?? previous.created_at ?? now,
            author: previous.updated_by ?? "unknown",
            rollback_target: `page_content:${previous.page_key}@v${previous.version ?? 0}`,
          },
        ]
      : []),
    {
      id: operationId,
      version: nextVersion,
      status: "published",
      timestamp: now,
      author: actor.id,
      rollback_target: draft.rollback_ref,
    },
  ]);

  const eventId = `content-publish-${slugForId(payload.page_key)}-${Date.now().toString(36)}`;
  const rollbackRef = previous
    ? `page_content:${payload.page_key}@v${previous.version ?? 0}`
    : `new_private_draft:${payload.page_key}`;
  const statements = [
    db
      .prepare(
        `UPDATE page_content
         SET published = 0
         WHERE page_key = ?
           AND published = 1`,
      )
      .bind(payload.page_key),
    db
      .prepare(
        `INSERT INTO page_content (
        id,
        page_key,
        content,
        version,
        published,
        updated_at,
        updated_by,
        created_at,
        version_history
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        pageContentId,
        payload.page_key,
        JSON.stringify(payload.content),
        nextVersion,
        1,
        now,
        actor.id,
        now,
        history,
      ),
    db
      .prepare(
        `INSERT INTO content_publish_events (
        id,
        operation_id,
        content_record_id,
        event_type,
        status,
        summary,
        proof_ids,
        rollback_ref,
        created_by,
        created_at,
        metadata
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        eventId,
        operationId,
        null,
        "publish_page_content",
        "verified",
        `Published ${payload.page_key} v${nextVersion} from draft ${operationId}.`,
        JSON.stringify([
          "admin.content.publish.passkey",
          "admin.content.publish.page-content",
        ]),
        rollbackRef,
        actor.id,
        now,
        JSON.stringify({
          page_key: payload.page_key,
          route: routeForPayload(payload),
          title: payload.title,
          previous_version: previous?.version ?? null,
          published_version: nextVersion,
          author_id: actor.id,
          credential_id_hint: actor.credential_id_hint ?? null,
        }),
      ),
    db
      .prepare(
        `UPDATE content_draft_operations
       SET status = ?,
           authority_state = ?,
           updated_at = ?,
           reviewer_note = ?,
           updated_by = ?,
           published_from_operation_id = ?
       WHERE operation_id = ?`,
      )
      .bind(
        "published",
        "published_to_page_content_with_proof",
        now,
        `Published to page_content:${payload.page_key}@v${nextVersion}; event ${eventId}. No source file, deploy, send, or provider sync ran.`,
        actor.id,
        operationId,
        operationId,
      ),
  ];

  if (!db.batch) {
    throw statusError(503, "publish_batch_required");
  }

  const results = await db.batch(statements);
  if (results.some((result) => result.success === false)) {
    throw statusError(500, "publish_batch_failed");
  }

  return {
    ok: true,
    page_key: payload.page_key,
    version: nextVersion,
    publish_event_id: eventId,
    public_route: routeForPayload(payload),
  };
}

async function validatePayloadForSave(
  db: ContentEditorD1Database,
  payload: ContentEditorPayload,
  input: ContentEditorSaveInput,
) {
  if (payload.kind !== "writing") return;

  assertWritingSlugAllowed(payload.slug);
  const requestedPageKey =
    typeof input.page_key === "string" && input.page_key.trim()
      ? normalizePageKey(input.page_key)
      : "";
  const isNewKey =
    !requestedPageKey ||
    requestedPageKey === "new" ||
    requestedPageKey === "writing:new";

  if (!isNewKey && requestedPageKey !== payload.page_key) {
    throw statusError(409, "slug_change_requires_new_private_draft");
  }

  if (!isNewKey) return;

  const sourceMatch = sourceContentRecords.find(
    (record) => record.surface === "writing" && record.slug === payload.slug,
  );
  if (sourceMatch) throw statusError(409, "duplicate_source_slug");

  const existing = await db
    .prepare(
      `SELECT page_key
       FROM page_content
       WHERE page_key = ?
       LIMIT 1`,
    )
    .bind(payload.page_key)
    .first<{ page_key: string }>();
  if (existing) throw statusError(409, "duplicate_public_slug");
}

async function validatePayloadForPublish(
  db: ContentEditorD1Database,
  payload: ContentEditorPayload,
) {
  if (payload.kind !== "writing") return;
  assertWritingSlugAllowed(payload.slug);
  const expectedPageKey = `writing:${payload.slug}`;
  if (payload.page_key !== expectedPageKey) {
    throw statusError(409, "page_key_slug_mismatch");
  }

  const sourceMatch = sourceContentRecords.find(
    (record) =>
      record.surface === "writing" &&
      record.slug === payload.slug &&
      payload.page_key !== `writing:${record.slug}`,
  );
  if (sourceMatch) throw statusError(409, "duplicate_source_slug");

  const conflicting = await db
    .prepare(
      `SELECT page_key
       FROM page_content
       WHERE json_extract(content, '$.slug') = ?
         AND page_key <> ?
       LIMIT 1`,
    )
    .bind(payload.slug, payload.page_key)
    .first<{ page_key: string }>();
  if (conflicting) throw statusError(409, "duplicate_public_slug");
}

function assertWritingSlugAllowed(slug: string) {
  if (RESERVED_WRITING_SLUGS.has(slug)) {
    throw statusError(409, "reserved_writing_slug");
  }
}

function defaultActor(): ContentEditorActor {
  return {
    id: DEFAULT_AUTHOR,
    display_name: DEFAULT_AUTHOR,
    credential_id_hint: null,
  };
}

function buildPayload(
  input: ContentEditorSaveInput,
  actor: ContentEditorActor,
): ContentEditorPayload {
  const kind = input.kind === "page" ? "page" : "writing";
  const title = cleanRequired(input.title, MAX_TITLE_LENGTH, "title");
  const slug = normalizeSlug(input.slug || title);
  const pageKey = normalizePageKey(
    input.page_key || (kind === "writing" ? `writing:${slug}` : slug),
  );
  const summary = cleanRequired(input.summary, MAX_SUMMARY_LENGTH, "summary");
  const body = cleanRequired(input.body, MAX_BODY_LENGTH, "body");
  const tags = normalizeTags(input.tags);
  const visibility = normalizeVisibility(input.visibility);
  const date = cleanOptional(input.date, 20) || isoDate(new Date());
  const now = new Date().toISOString();

  if (kind === "writing") {
    const writing = normalizeCmsWriting({
      slug,
      title,
      date,
      tags,
      preview: summary,
      body,
      visible: visibility === "published",
      order: 0,
      updated_at: now,
    });
    const validation = validateCmsWriting(writing);
    if (!validation.ok) throw statusError(400, validation.error ?? "invalid");
    return {
      kind,
      page_key: `writing:${writing.slug}`,
      title: writing.title,
      slug: writing.slug,
      summary: writing.preview,
      tags: writing.tags,
      body: writing.body,
      visibility,
      date: writing.date,
      updated_by: actor.id,
      updated_at: now,
      content: {
        ...writing,
        status: visibility === "published" ? "published" : "draft",
        visibility,
        published: visibility === "published",
        summary: writing.preview,
      },
    };
  }

  return {
    kind,
    page_key: pageKey,
    title,
    slug,
    summary,
    tags,
    body,
    visibility,
    date,
    updated_by: actor.id,
    updated_at: now,
    content: {
      slug,
      title,
      summary,
      preview: summary,
      tags,
      body,
      visible: visibility === "published",
      visibility,
      status: visibility === "published" ? "published" : "draft",
      updated_at: now,
    },
  };
}

function payloadFromContent(
  row: PageContentRow | null,
  pageKey: string,
): ContentEditorPayload {
  const raw = parseJsonObject(row?.content ?? null);
  const slug = normalizeSlug(
    typeof raw.slug === "string"
      ? raw.slug
      : pageKey.split(":").pop() || pageKey,
  );
  const title =
    cleanOptional(raw.title, MAX_TITLE_LENGTH) ||
    cleanOptional(raw.hero_title, MAX_TITLE_LENGTH) ||
    cleanOptional(raw.headline, MAX_TITLE_LENGTH) ||
    slug.replaceAll("-", " ");
  const summary =
    cleanOptional(raw.preview, MAX_SUMMARY_LENGTH) ||
    cleanOptional(raw.summary, MAX_SUMMARY_LENGTH) ||
    cleanOptional(raw.hero_summary, MAX_SUMMARY_LENGTH) ||
    cleanOptional(raw.description, MAX_SUMMARY_LENGTH) ||
    "";
  const body =
    cleanOptional(raw.body, MAX_BODY_LENGTH) ||
    cleanOptional(raw.content, MAX_BODY_LENGTH) ||
    JSON.stringify(raw, null, 2);
  const tags = normalizeTags(Array.isArray(raw.tags) ? raw.tags : []);
  const visible =
    typeof raw.visible === "boolean"
      ? raw.visible
      : isPublished(row?.published ?? false);

  return {
    kind: pageKey.startsWith("writing:") ? "writing" : "page",
    page_key: pageKey,
    title,
    slug,
    summary,
    tags,
    body,
    visibility: visible ? "published" : "hidden",
    date:
      cleanOptional(raw.date, 20) ||
      cleanOptional(raw.published_at, 20) ||
      isoDate(new Date()),
    updated_by: row?.updated_by ?? DEFAULT_AUTHOR,
    updated_at: row?.updated_at ?? new Date().toISOString(),
    content: raw,
  };
}

async function readPageRows(
  db: ContentEditorD1Database,
  pageKey: string,
): Promise<PageContentRow[]> {
  const rows = await db
    .prepare(
      `SELECT
         id,
         page_key,
         content,
         version,
         published,
         updated_at,
         updated_by,
         created_at,
         version_history
       FROM page_content
       WHERE page_key = ?
       ORDER BY version DESC, updated_at DESC
       LIMIT 20`,
    )
    .bind(pageKey)
    .all<PageContentRow>();
  return rows.results ?? [];
}

async function latestPageContent(
  db: ContentEditorD1Database,
  pageKey: string,
): Promise<PageContentRow | null> {
  return db
    .prepare(
      `SELECT
         id,
         page_key,
         content,
         version,
         published,
         updated_at,
         updated_by,
         created_at,
         version_history
       FROM page_content
       WHERE page_key = ?
       ORDER BY published DESC, version DESC, updated_at DESC
       LIMIT 1`,
    )
    .bind(pageKey)
    .first<PageContentRow>();
}

async function readDraftRows(
  db: ContentEditorD1Database,
  pageKey: string,
): Promise<DraftOperationRow[]> {
  const rows = await db
    .prepare(
      `SELECT
         operation_id,
         surface,
         route,
         source_ref,
         field_path,
         proposed_value,
         status,
         risk_level,
         authority_state,
         created_by,
         created_at,
         updated_at,
         rollback_ref,
         reviewer_note,
         metadata,
         page_key,
         slug,
         title,
         visibility,
         updated_by,
         published_from_operation_id
       FROM content_draft_operations
       WHERE page_key = ?
          OR metadata LIKE ?
          OR current_value_ref LIKE ?
          OR rollback_ref LIKE ?
       ORDER BY updated_at DESC
       LIMIT 30`,
    )
    .bind(
      pageKey,
      `%"page_key":"${escapeLike(pageKey)}"%`,
      `%page_content:${escapeLike(pageKey)}%`,
      `%page_content:${escapeLike(pageKey)}%`,
    )
    .all<DraftOperationRow>();
  return rows.results ?? [];
}

async function readPublishEvents(
  db: ContentEditorD1Database,
  pageKey: string,
): Promise<PublishEventRow[]> {
  const rows = await db
    .prepare(
      `SELECT
         id,
         operation_id,
         event_type,
         status,
         summary,
         rollback_ref,
         created_by,
         created_at
       FROM content_publish_events
       WHERE metadata LIKE ?
       ORDER BY created_at DESC
       LIMIT 20`,
    )
    .bind(`%"page_key":"${escapeLike(pageKey)}"%`)
    .all<PublishEventRow>();
  return rows.results ?? [];
}

function draftRevisionFromRow(row: DraftOperationRow): ContentRevision {
  const payload = parseEditorPayload(row.proposed_value);
  return {
    id: row.operation_id,
    source: "draft",
    timestamp: row.updated_at,
    author: row.updated_by || row.created_by,
    status: payload?.visibility ?? row.visibility ?? row.status,
    summary:
      payload?.summary || row.title || row.reviewer_note || row.field_path,
    rollback_target: row.rollback_ref,
    view_href: `/content/preview?operation_id=${encodeURIComponent(row.operation_id)}`,
  };
}

function publishedRevisionFromRow(row: PageContentRow): ContentRevision {
  const payload = payloadFromContent(row, row.page_key);
  return {
    id: row.id,
    source: "published",
    timestamp: row.updated_at ?? row.created_at ?? "",
    author: row.updated_by ?? "unknown",
    status: isPublished(row.published) ? "published" : "hidden",
    summary: payload.summary || payload.title,
    rollback_target: `page_content:${row.page_key}@v${row.version ?? 0}`,
    view_href: `/content/edit/${encodeURIComponent(row.page_key)}?version=${row.version ?? 0}`,
  };
}

function publishEventRevisionFromRow(row: PublishEventRow): ContentRevision {
  return {
    id: row.id,
    source: "publish_event",
    timestamp: row.created_at,
    author: row.created_by,
    status: row.status,
    summary: row.summary,
    rollback_target: row.rollback_ref,
    view_href: `/content/operations#${encodeURIComponent(row.id)}`,
  };
}

function parseEditorPayload(value: string): ContentEditorPayload | null {
  const parsed = parseJsonObject(value);
  if (typeof parsed.page_key !== "string") return null;
  if (typeof parsed.title !== "string") return null;
  if (typeof parsed.slug !== "string") return null;
  if (typeof parsed.summary !== "string") return null;
  if (typeof parsed.body !== "string") return null;
  return {
    kind: parsed.kind === "page" ? "page" : "writing",
    page_key: normalizePageKey(parsed.page_key),
    title: parsed.title,
    slug: normalizeSlug(parsed.slug),
    summary: parsed.summary,
    tags: normalizeTags(parsed.tags),
    body: parsed.body,
    visibility: normalizeVisibility(parsed.visibility),
    date:
      typeof parsed.date === "string" && parsed.date.trim()
        ? parsed.date.trim()
        : isoDate(new Date()),
    updated_by:
      typeof parsed.updated_by === "string"
        ? parsed.updated_by
        : DEFAULT_AUTHOR,
    updated_at:
      typeof parsed.updated_at === "string"
        ? parsed.updated_at
        : new Date().toISOString(),
    content:
      parsed.content && typeof parsed.content === "object"
        ? (parsed.content as Record<string, unknown>)
        : {},
  };
}

function parseJsonObject(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  if (typeof value !== "string") return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

function parseVersionHistory(value: string | null): unknown[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function normalizeVisibility(value: unknown): ContentVisibility {
  if (
    value === "private" ||
    value === "draft" ||
    value === "hidden" ||
    value === "published"
  ) {
    return value;
  }
  return "draft";
}

function normalizeTags(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .filter((tag): tag is string => typeof tag === "string")
      .flatMap((tag) => tag.split(","))
      .map((tag) => tag.trim().toLowerCase())
      .filter(Boolean)
      .slice(0, 12);
  }
  if (typeof value === "string") return normalizeTags(value.split(","));
  return [];
}

function normalizeSlug(value: string): string {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 96);
  if (!slug) throw statusError(400, "slug_required");
  return slug;
}

function normalizePageKey(value: string): string {
  const clean = value.trim().toLowerCase();
  if (!/^[a-z0-9:_-]+$/.test(clean)) {
    throw statusError(400, "page_key_invalid");
  }
  return clean.slice(0, 160);
}

function cleanRequired(
  value: unknown,
  maxLength: number,
  field: string,
): string {
  const clean = cleanOptional(value, maxLength);
  if (!clean) throw statusError(400, `${field}_required`);
  return clean;
}

function cleanOptional(value: unknown, maxLength: number): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

function isPublished(value: number | boolean | null | undefined): boolean {
  return value === true || value === 1;
}

function routeForPayload(payload: ContentEditorPayload): string {
  if (payload.page_key.startsWith("writing:"))
    return `/writing/${payload.slug}`;
  if (payload.page_key.startsWith("project:"))
    return `/projects/${payload.slug}`;
  if (payload.page_key === "home") return "/";
  return `/${payload.page_key.replaceAll("_", "/").replaceAll(":", "/")}`;
}

function slugForId(value: string): string {
  return value.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "");
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function escapeLike(value: string): string {
  return value.replaceAll("%", "\\%").replaceAll("_", "\\_");
}

export function statusError(status: number, message: string): Response {
  return Response.json(
    { ok: false, error: message },
    {
      status,
      headers: { "cache-control": "no-store" },
    },
  );
}
