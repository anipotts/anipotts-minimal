import { adminControlContracts } from "./contracts";
import {
  ADMIN_EVENT_SCHEMA_VERSION,
  type AdminCapabilityState,
  type AdminControlProjections,
  type AdminControlFixtureData,
  type AdminControlSnapshot,
  type AdminControlSourceMode,
  type AdminDeployState,
  type AdminEventEnvelope,
  type AdminFleetStatus,
  type AdminInboxItem,
  type AdminKnowledgeCard,
  type AdminPieceState,
  type AdminServiceRegistryViewItem,
} from "./types";

type D1Result<T> = { results?: T[] };

export type AdminControlStatement = {
  bind(...values: unknown[]): AdminControlStatement;
  all<T = unknown>(): Promise<D1Result<T>>;
};

export type AdminControlDatabase =
  | {
      prepare(query: string): AdminControlStatement;
    }
  | null
  | undefined;

type ReadResult<T> = {
  rows: T[];
  usedFallback: boolean;
  error: string | null;
};

const SYNC_CONTRACT = {
  v1: "refresh-on-open-plus-light-polling",
  push_swappable: true,
  target: "durable-objects-websocket-hibernation",
} as const;

const RETENTION_CONTRACT = {
  event_store: "d1",
  payload_store: "r2",
  payload_ref_required: true,
  archive_target: "r2",
  archive_policy:
    "payload_ref blobs are external from day one; aged d1 envelopes archive to r2 without projection contract changes",
} as const;

const AUTH_CONTRACT = {
  ui: "passkey-session",
  mcp: "cloudflare-access-service-token-per-machine",
  write_tools: "disabled-until-broker-and-signed-connect-diff",
} as const;

export async function loadAdminControlSnapshot(
  db: AdminControlDatabase,
  fixture?: AdminControlFixtureData,
): Promise<AdminControlSnapshot> {
  const [
    events,
    inboxItems,
    pieceStates,
    fleetStatus,
    deployStates,
    capabilityStates,
    serviceRegistryView,
    knowledgeCards,
  ] = await Promise.all([
    readAdminEvents(db, fixture?.events),
    readInboxItems(db, fixture?.projections.inbox_items),
    readPieceStates(db, fixture?.projections.piece_states),
    readFleetStatus(db, fixture?.projections.fleet_status),
    readDeployStates(db, fixture?.projections.deploy_states),
    readCapabilityStates(db, fixture?.projections.capability_states),
    readServiceRegistryView(db, fixture?.projections.service_registry_view),
    readKnowledgeCards(db, fixture?.projections.knowledge_cards),
  ]);

  const reads = [
    events,
    inboxItems,
    pieceStates,
    fleetStatus,
    deployStates,
    capabilityStates,
    serviceRegistryView,
    knowledgeCards,
  ];

  const projections: AdminControlProjections = {
    inbox_items: sortInbox(inboxItems.rows),
    piece_states: pieceStates.rows,
    fleet_status: fleetStatus.rows,
    deploy_states: deployStates.rows,
    capability_states: capabilityStates.rows,
    service_registry_view: serviceRegistryView.rows,
    knowledge_cards: knowledgeCards.rows,
  };

  return {
    schema_version: ADMIN_EVENT_SCHEMA_VERSION,
    generated_at: new Date().toISOString(),
    source_mode: sourceMode(
      db,
      reads.map((read) => read.usedFallback),
    ),
    sync: SYNC_CONTRACT,
    retention: RETENTION_CONTRACT,
    auth: AUTH_CONTRACT,
    contracts: adminControlContracts,
    events: events.rows,
    projections,
    errors: reads.flatMap((read) => (read.error ? [read.error] : [])),
  };
}

async function readAdminEvents(
  db: AdminControlDatabase,
  fallback: AdminEventEnvelope[] | undefined,
): Promise<ReadResult<AdminEventEnvelope>> {
  return readRows(
    db,
    "admin_events",
    `SELECT schema_version, event_id, dedupe_key, source, provider, account,
            actor, kind, ts, privacy, title, summary, href, payload_ref,
            created_by
       FROM admin_events
      ORDER BY ts DESC
      LIMIT 80`,
    fallback,
    (row) => ({
      schema_version: toNumber(row.schema_version, ADMIN_EVENT_SCHEMA_VERSION),
      event_id: asString(row.event_id),
      dedupe_key: asString(row.dedupe_key),
      source: asString(row.source),
      provider: nullableString(row.provider),
      account: nullableString(row.account),
      actor: asString(row.actor),
      kind: asString(row.kind),
      ts: asString(row.ts),
      privacy: asString(row.privacy),
      title: asString(row.title),
      summary: asString(row.summary),
      href: nullableString(row.href),
      payload_ref: nullableString(row.payload_ref),
      created_by: asString(row.created_by),
    }),
  );
}

async function readInboxItems(
  db: AdminControlDatabase,
  fallback: AdminInboxItem[] | undefined,
): Promise<ReadResult<AdminInboxItem>> {
  return readRows(
    db,
    "admin_inbox_items",
    `SELECT item_id, dedupe_key, event_refs, domain, entity_ref, attention_kind,
            source, account, title, summary, href, status, urgency, owner,
            action_kind, expires_at, last_seen_at
       FROM admin_inbox_items
      ORDER BY
        CASE urgency
          WHEN 'urgent' THEN 0
          WHEN 'high' THEN 1
          WHEN 'normal' THEN 2
          ELSE 3
        END,
        COALESCE(expires_at, last_seen_at, '9999-12-31T23:59:59Z') ASC`,
    fallback,
    (row) => ({
      item_id: asString(row.item_id),
      dedupe_key: asString(row.dedupe_key),
      event_refs: parseStringArray(row.event_refs),
      domain: asString(row.domain) as AdminInboxItem["domain"],
      entity_ref: asString(row.entity_ref),
      attention_kind: asString(
        row.attention_kind,
      ) as AdminInboxItem["attention_kind"],
      source: asString(row.source),
      account: nullableString(row.account),
      title: asString(row.title),
      summary: asString(row.summary),
      href: nullableString(row.href),
      status: asString(row.status),
      urgency: asString(row.urgency),
      owner: asString(row.owner),
      action_kind: asString(row.action_kind),
      expires_at: nullableString(row.expires_at),
      last_seen_at: nullableString(row.last_seen_at),
    }),
  );
}

async function readPieceStates(
  db: AdminControlDatabase,
  fallback: AdminPieceState[] | undefined,
): Promise<ReadResult<AdminPieceState>> {
  return readRows(
    db,
    "admin_piece_states",
    `SELECT piece_id, dedupe_key, event_refs, title, state, channels,
            source_refs, updated_at
       FROM admin_piece_states
      ORDER BY updated_at DESC`,
    fallback,
    (row) => ({
      piece_id: asString(row.piece_id),
      dedupe_key: asString(row.dedupe_key),
      event_refs: parseStringArray(row.event_refs),
      title: asString(row.title),
      state: asString(row.state),
      channels: parseStringArray(row.channels),
      source_refs: parseStringArray(row.source_refs),
      updated_at: nullableString(row.updated_at),
    }),
  );
}

async function readFleetStatus(
  db: AdminControlDatabase,
  fallback: AdminFleetStatus[] | undefined,
): Promise<ReadResult<AdminFleetStatus>> {
  return readRows(
    db,
    "admin_fleet_status",
    `SELECT subject_id, kind, title, status, summary, owner, href, event_refs,
            updated_at
       FROM admin_fleet_status
      ORDER BY updated_at DESC`,
    fallback,
    (row) => ({
      subject_id: asString(row.subject_id),
      kind: asString(row.kind),
      title: asString(row.title),
      status: asString(row.status),
      summary: asString(row.summary),
      owner: asString(row.owner),
      href: nullableString(row.href),
      event_refs: parseStringArray(row.event_refs),
      updated_at: nullableString(row.updated_at),
    }),
  );
}

async function readDeployStates(
  db: AdminControlDatabase,
  fallback: AdminDeployState[] | undefined,
): Promise<ReadResult<AdminDeployState>> {
  return readRows(
    db,
    "admin_deploy_states",
    `SELECT deploy_id, target, status, scope, href, last_run_at, event_refs,
            updated_at
       FROM admin_deploy_states
      ORDER BY COALESCE(last_run_at, updated_at) DESC`,
    fallback,
    (row) => ({
      deploy_id: asString(row.deploy_id),
      target: asString(row.target),
      status: asString(row.status),
      scope: asString(row.scope),
      href: nullableString(row.href),
      last_run_at: nullableString(row.last_run_at),
      event_refs: parseStringArray(row.event_refs),
      updated_at: nullableString(row.updated_at),
    }),
  );
}

async function readCapabilityStates(
  db: AdminControlDatabase,
  fallback: AdminCapabilityState[] | undefined,
): Promise<ReadResult<AdminCapabilityState>> {
  return readRows(
    db,
    "admin_capability_states",
    `SELECT capability_id, machine, status, auth_model, write_enabled, summary,
            event_refs, updated_at
       FROM admin_capability_states
      ORDER BY machine ASC, capability_id ASC`,
    fallback,
    (row) => ({
      capability_id: asString(row.capability_id),
      machine: asString(row.machine),
      status: asString(row.status),
      auth_model: asString(row.auth_model),
      write_enabled: toBoolean(row.write_enabled),
      summary: asString(row.summary),
      event_refs: parseStringArray(row.event_refs),
      updated_at: nullableString(row.updated_at),
    }),
  );
}

async function readServiceRegistryView(
  db: AdminControlDatabase,
  fallback: AdminServiceRegistryViewItem[] | undefined,
): Promise<ReadResult<AdminServiceRegistryViewItem>> {
  return readRows(
    db,
    "service_registry",
    `SELECT id AS service_id, name, hostname, visibility, owner,
            CASE WHEN retired_at IS NULL THEN 'active' ELSE 'retired' END AS status,
            updated_at
       FROM service_registry
      ORDER BY COALESCE(updated_at, created_at) DESC
      LIMIT 80`,
    fallback,
    (row) => ({
      service_id: asString(row.service_id),
      name: asString(row.name),
      hostname: asString(row.hostname),
      visibility: asString(row.visibility),
      owner: asString(row.owner),
      status: asString(row.status),
      updated_at: nullableString(row.updated_at),
      event_refs: [],
    }),
  );
}

async function readKnowledgeCards(
  db: AdminControlDatabase,
  fallback: AdminKnowledgeCard[] | undefined,
): Promise<ReadResult<AdminKnowledgeCard>> {
  return readRows(
    db,
    "admin_knowledge_cards",
    `SELECT card_id, entity_ref, domain, kind, title, summary, source_system,
            source_locator, source_native_id, canonical_host, canonical_path,
            sensitivity, reveal_policy, freshness_state, observed_at,
            stale_after_seconds, content_hash, proof_refs, lineage_refs,
            related_card_ids, retrieval_instructions, context_budget_tokens,
            event_refs, indexed_at
       FROM admin_knowledge_cards
      ORDER BY domain ASC, title ASC`,
    fallback,
    (row) => ({
      card_id: asString(row.card_id),
      entity_ref: asString(row.entity_ref),
      domain: asString(row.domain) as AdminKnowledgeCard["domain"],
      kind: asString(row.kind) as AdminKnowledgeCard["kind"],
      title: asString(row.title),
      summary: asString(row.summary),
      source_system: asString(row.source_system),
      source_locator: asString(row.source_locator),
      source_native_id: nullableString(row.source_native_id),
      canonical_host: asString(
        row.canonical_host,
      ) as AdminKnowledgeCard["canonical_host"],
      canonical_path: nullableString(row.canonical_path),
      sensitivity: asString(
        row.sensitivity,
      ) as AdminKnowledgeCard["sensitivity"],
      reveal_policy: asString(
        row.reveal_policy,
      ) as AdminKnowledgeCard["reveal_policy"],
      freshness_state: asString(
        row.freshness_state,
      ) as AdminKnowledgeCard["freshness_state"],
      observed_at: nullableString(row.observed_at),
      stale_after_seconds:
        row.stale_after_seconds == null
          ? null
          : toNumber(row.stale_after_seconds, 0),
      content_hash: asString(row.content_hash),
      proof_refs: parseStringArray(row.proof_refs),
      lineage_refs: parseStringArray(row.lineage_refs),
      related_card_ids: parseStringArray(row.related_card_ids),
      retrieval_instructions: asString(row.retrieval_instructions),
      context_budget_tokens: toNumber(row.context_budget_tokens, 200),
      event_refs: parseStringArray(row.event_refs),
      indexed_at: asString(row.indexed_at),
    }),
  );
}

async function readRows<T>(
  db: AdminControlDatabase,
  tableName: string,
  query: string,
  fallback: T[] | undefined,
  mapRow: (row: Record<string, unknown>) => T,
): Promise<ReadResult<T>> {
  if (!db) {
    if (!fallback) {
      return {
        rows: [],
        usedFallback: false,
        error: "d1 unavailable; no development fixture was requested",
      };
    }
    return {
      rows: fallback,
      usedFallback: true,
      error: "d1 unavailable; using static admin-control fixture",
    };
  }

  try {
    const result = await db.prepare(query).all<Record<string, unknown>>();
    const rows = Array.isArray(result.results)
      ? result.results.map(mapRow)
      : [];
    return {
      rows,
      usedFallback: false,
      error: null,
    };
  } catch (error) {
    return {
      rows: [],
      usedFallback: false,
      error: `${tableName} read failed: ${String(error)}`,
    };
  }
}

function sourceMode(
  db: AdminControlDatabase,
  fallbacks: boolean[],
): AdminControlSourceMode {
  if (!db && fallbacks.every((fallback) => !fallback)) return "disconnected";
  if (fallbacks.every(Boolean)) return "fixture";
  if (fallbacks.some(Boolean)) return "mixed";
  return "d1";
}

function sortInbox(items: AdminInboxItem[]): AdminInboxItem[] {
  const rank = new Map([
    ["urgent", 0],
    ["high", 1],
    ["normal", 2],
    ["low", 3],
  ]);
  return [...items].sort((a, b) => {
    const urgency = (rank.get(a.urgency) ?? 4) - (rank.get(b.urgency) ?? 4);
    if (urgency !== 0) return urgency;
    return (a.expires_at ?? "9999").localeCompare(b.expires_at ?? "9999");
  });
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : value == null ? "" : String(value);
}

function nullableString(value: unknown): string | null {
  const text = asString(value);
  return text.length > 0 ? text : null;
}

function toNumber(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toBoolean(value: unknown): boolean {
  return value === true || value === 1 || value === "1" || value === "true";
}

function parseStringArray(value: unknown): string[] {
  if (Array.isArray(value))
    return value.filter((item) => typeof item === "string");
  if (typeof value !== "string" || value.length === 0) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((item) => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}
