import type {
  AdminAttentionKind,
  AdminInboxDomain,
  InboxActionKind,
} from "./types";

type D1Result = { success?: boolean; meta?: unknown };

export type AdminInboxWriteStatement = {
  bind(...values: unknown[]): AdminInboxWriteStatement;
};

export type AdminInboxWriteDatabase = {
  prepare(query: string): AdminInboxWriteStatement;
  batch(statements: AdminInboxWriteStatement[]): Promise<D1Result[]>;
};

export type AdminInboxWriteAction = "upsert" | "resolve";

export type AdminInboxAttentionInput = {
  action?: AdminInboxWriteAction;
  domain: AdminInboxDomain;
  entity_ref: string;
  attention_kind: AdminAttentionKind;
  source: string;
  account?: string | null;
  title: string;
  summary: string;
  href?: string | null;
  urgency?: "low" | "normal" | "high" | "urgent";
  owner: string;
  expires_at?: string | null;
  observed_at?: string;
};

export type NormalizedAdminInboxAttention = {
  action: AdminInboxWriteAction;
  domain: AdminInboxDomain;
  entity_ref: string;
  attention_kind: AdminAttentionKind;
  source: string;
  account: string | null;
  title: string;
  summary: string;
  href: string | null;
  urgency: "low" | "normal" | "high" | "urgent";
  owner: string;
  expires_at: string | null;
  observed_at: string;
};

export type AdminInboxWriteResult = {
  ok: true;
  action: AdminInboxWriteAction;
  item_id: string;
  event_id: string;
  dedupe_key: string;
  status: "action_required" | "resolved";
};

const DOMAINS = new Set<AdminInboxDomain>([
  "work",
  "content",
  "life",
  "fleet",
  "system",
]);
const ATTENTION_KINDS = new Set<AdminAttentionKind>([
  "review",
  "approval",
  "decision",
  "deadline",
  "error",
  "verification",
]);
const URGENCIES = new Set(["low", "normal", "high", "urgent"]);
const INPUT_KEYS = new Set<keyof AdminInboxAttentionInput>([
  "action",
  "domain",
  "entity_ref",
  "attention_kind",
  "source",
  "account",
  "title",
  "summary",
  "href",
  "urgency",
  "owner",
  "expires_at",
  "observed_at",
]);

export class AdminInboxWriteError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function writeAdminInboxAttention(
  db: AdminInboxWriteDatabase,
  rawInput: unknown,
  actor: string,
): Promise<AdminInboxWriteResult> {
  const input = normalizeAdminInboxAttention(rawInput);
  const createdBy = cleanRequired(actor, 160, "actor");
  const dedupeKey = attentionDedupeKey(input);
  const itemId = await stableId("inbox", dedupeKey);
  const eventId = await stableId(
    "evt",
    [
      input.action,
      dedupeKey,
      input.observed_at,
      input.title,
      input.summary,
    ].join("\n"),
  );
  const status = input.action === "resolve" ? "resolved" : "action_required";
  const actionKind =
    input.action === "resolve"
      ? "none"
      : actionKindForAttention(input.attention_kind);
  const eventKind =
    input.action === "resolve" ? "attention.resolved" : "attention.observed";
  const eventRefs = JSON.stringify([eventId]);

  const event = db
    .prepare(
      `INSERT OR IGNORE INTO admin_events (
        schema_version, event_id, dedupe_key, source, provider, account, actor,
        kind, ts, privacy, title, summary, href, payload_ref, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      1,
      eventId,
      `${dedupeKey}:${input.action}:${input.observed_at}`,
      input.source,
      null,
      input.account,
      createdBy,
      eventKind,
      input.observed_at,
      "internal",
      input.title,
      input.summary,
      input.href,
      null,
      createdBy,
    );

  const projection = db
    .prepare(
      `INSERT INTO admin_inbox_items (
        item_id, dedupe_key, event_refs, domain, entity_ref, attention_kind,
        source, account, title, summary, href, status, urgency, owner,
        action_kind, expires_at, last_seen_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(dedupe_key) DO UPDATE SET
        event_refs = CASE
          WHEN EXISTS (
            SELECT 1
            FROM json_each(admin_inbox_items.event_refs)
            WHERE value = json_extract(excluded.event_refs, '$[0]')
          ) THEN admin_inbox_items.event_refs
          ELSE json_insert(
            admin_inbox_items.event_refs,
            '$[#]',
            json_extract(excluded.event_refs, '$[0]')
          )
        END,
        domain = excluded.domain,
        entity_ref = excluded.entity_ref,
        attention_kind = excluded.attention_kind,
        source = excluded.source,
        account = excluded.account,
        title = excluded.title,
        summary = excluded.summary,
        href = excluded.href,
        status = excluded.status,
        urgency = excluded.urgency,
        owner = excluded.owner,
        action_kind = excluded.action_kind,
        expires_at = excluded.expires_at,
        last_seen_at = excluded.last_seen_at,
        updated_at = excluded.updated_at`,
    )
    .bind(
      itemId,
      dedupeKey,
      eventRefs,
      input.domain,
      input.entity_ref,
      input.attention_kind,
      input.source,
      input.account,
      input.title,
      input.summary,
      input.href,
      status,
      input.urgency,
      input.owner,
      actionKind,
      input.expires_at,
      input.observed_at,
      input.observed_at,
    );

  const results = await db.batch([event, projection]);
  if (
    results.length !== 2 ||
    results.some((result) => result.success === false)
  ) {
    throw new AdminInboxWriteError(500, "inbox_write_batch_failed");
  }

  return {
    ok: true,
    action: input.action,
    item_id: itemId,
    event_id: eventId,
    dedupe_key: dedupeKey,
    status,
  };
}

export function normalizeAdminInboxAttention(
  rawInput: unknown,
): NormalizedAdminInboxAttention {
  if (!isPlainObject(rawInput)) {
    throw new AdminInboxWriteError(400, "object_required");
  }
  for (const key of Object.keys(rawInput)) {
    if (!INPUT_KEYS.has(key as keyof AdminInboxAttentionInput)) {
      throw new AdminInboxWriteError(400, `unknown_field:${key}`);
    }
  }

  const action = rawInput.action ?? "upsert";
  if (action !== "upsert" && action !== "resolve") {
    throw new AdminInboxWriteError(400, "invalid_action");
  }
  if (!DOMAINS.has(rawInput.domain as AdminInboxDomain)) {
    throw new AdminInboxWriteError(400, "invalid_domain");
  }
  if (!ATTENTION_KINDS.has(rawInput.attention_kind as AdminAttentionKind)) {
    throw new AdminInboxWriteError(400, "invalid_attention_kind");
  }
  const urgency = rawInput.urgency ?? "normal";
  if (!URGENCIES.has(String(urgency))) {
    throw new AdminInboxWriteError(400, "invalid_urgency");
  }

  const observedAt = cleanTimestamp(
    rawInput.observed_at ?? new Date().toISOString(),
    "observed_at",
  );

  return {
    action,
    domain: rawInput.domain as AdminInboxDomain,
    entity_ref: cleanEntityRef(rawInput.entity_ref),
    attention_kind: rawInput.attention_kind as AdminAttentionKind,
    source: cleanRequired(rawInput.source, 120, "source"),
    account: cleanOptional(rawInput.account, 160, "account"),
    title: cleanRequired(rawInput.title, 240, "title"),
    summary: cleanRequired(rawInput.summary, 2_000, "summary"),
    href: cleanHref(rawInput.href),
    urgency: urgency as NormalizedAdminInboxAttention["urgency"],
    owner: cleanRequired(rawInput.owner, 160, "owner"),
    expires_at:
      rawInput.expires_at == null
        ? null
        : cleanTimestamp(rawInput.expires_at, "expires_at"),
    observed_at: observedAt,
  };
}

export function attentionDedupeKey(
  input: Pick<
    NormalizedAdminInboxAttention,
    "domain" | "entity_ref" | "attention_kind"
  >,
): string {
  return `attention:${input.domain}:${input.entity_ref}:${input.attention_kind}`;
}

function actionKindForAttention(kind: AdminAttentionKind): InboxActionKind {
  switch (kind) {
    case "approval":
      return "approve";
    case "decision":
      return "decide";
    case "deadline":
      return "deadline";
    case "verification":
      return "verify";
    default:
      return "review";
  }
}

function cleanEntityRef(value: unknown): string {
  const clean = cleanRequired(value, 320, "entity_ref");
  if (/[\s\u0000-\u001f\u007f]/u.test(clean)) {
    throw new AdminInboxWriteError(400, "invalid_entity_ref");
  }
  return clean;
}

function cleanHref(value: unknown): string | null {
  const clean = cleanOptional(value, 1_000, "href");
  if (!clean) return null;
  if (clean.startsWith("/")) return clean;
  try {
    const url = new URL(clean);
    if (url.protocol === "https:") return clean;
  } catch {
    // handled below
  }
  throw new AdminInboxWriteError(400, "invalid_href");
}

function cleanTimestamp(value: unknown, field: string): string {
  const clean = cleanRequired(value, 64, field);
  const parsed = new Date(clean);
  if (Number.isNaN(parsed.valueOf()) || parsed.toISOString() !== clean) {
    throw new AdminInboxWriteError(400, `invalid_${field}`);
  }
  return clean;
}

function cleanRequired(value: unknown, max: number, field: string): string {
  if (typeof value !== "string") {
    throw new AdminInboxWriteError(400, `${field}_required`);
  }
  const clean = value.trim();
  if (
    !clean ||
    clean.length > max ||
    /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(clean)
  ) {
    throw new AdminInboxWriteError(400, `invalid_${field}`);
  }
  return clean;
}

function cleanOptional(
  value: unknown,
  max: number,
  field: string,
): string | null {
  if (value == null || value === "") return null;
  return cleanRequired(value, max, field);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype,
  );
}

async function stableId(prefix: string, value: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  const hex = [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  return `${prefix}-${hex.slice(0, 24)}`;
}
