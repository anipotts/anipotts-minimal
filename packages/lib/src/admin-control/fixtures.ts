import {
  ADMIN_EVENT_SCHEMA_VERSION,
  type AdminCapabilityState,
  type AdminControlContracts,
  type AdminControlProjections,
  type AdminDeployState,
  type AdminEventEnvelope,
  type AdminFleetStatus,
  type AdminInboxItem,
  type AdminPieceState,
  type AdminServiceRegistryViewItem,
} from "./types";
import {
  buildSentMailAwareness,
  buildSentMailMetadata,
  gmailSentDedupeKey,
} from "./sent-mail";

const NOW = "2026-07-02T16:45:00.000Z";
const RAYBAN_SENT_AT = "2026-07-08T00:00:00.000Z";

const raybanSentMail = buildSentMailMetadata({
  account: "hello@anipotts.com",
  sent_ref: "rayban-30-day-analytics-2026-07-08",
  subject: "Ray-Ban 30-day analytics",
  sent_at: RAYBAN_SENT_AT,
  has_attachments: "unknown",
  href: "metadata://gmail/sent/rayban-30-day-analytics-2026-07-08",
});

const raybanSentAwareness = buildSentMailAwareness(raybanSentMail, {
  completed: true,
  dedupe_key: gmailSentDedupeKey("rayban-30-day-analytics-2026-07-08"),
  event_id: "evt-gmail-sent-rayban-30-day-analytics-2026-07-08",
  privacy: "private",
});

const raybanPaymentFollowUp = buildSentMailAwareness(raybanSentMail, {
  completed: true,
  dedupe_key: gmailSentDedupeKey("rayban-30-day-analytics-2026-07-08"),
  event_id: "evt-gmail-sent-rayban-30-day-analytics-2026-07-08",
  privacy: "private",
  follow_up: {
    id: "inbox-rayban-payment-followup",
    dedupe_key: "brand:rayban-meta:payment-followup:2026-07-09",
    kind: "payment",
    title: "ray-ban payment follow-up",
    summary:
      "30-day sent mail and acknowledgement are proof; payment follow-up stays separate.",
    owner: "chief/brand",
    urgency: "normal",
    status: "waiting_payment_proof",
    href: raybanSentMail.href,
    last_seen_at: "2026-07-09T00:00:00.000Z",
  },
});

export const adminControlContracts: AdminControlContracts = {
  event_fields: [
    "schema_version",
    "event_id",
    "dedupe_key",
    "source",
    "provider",
    "account",
    "actor",
    "kind",
    "ts",
    "privacy",
    "title",
    "summary",
    "href",
    "payload_ref",
    "created_by",
  ],
  inbox_card_fields: [
    "item_id",
    "dedupe_key",
    "event_refs",
    "source",
    "account",
    "title",
    "summary",
    "href",
    "status",
    "urgency",
    "owner",
    "action_kind",
    "expires_at",
    "last_seen_at",
  ],
  sent_mail_metadata_fields: [
    "account",
    "sent_ref",
    "subject",
    "sent_at",
    "has_attachments",
    "href",
  ],
  sent_mail_card_policy: {
    dedupe: "gmail-message-id-derived-ref",
    completed_obligation: "event-only",
    followups: "separate-inbox-items",
    sync: "refresh-on-open-plus-light-polling",
    raw_identifiers: "omitted",
    snippet: "omitted",
  },
  piece_states: [
    "idea",
    "draft",
    "review",
    "export-ready",
    "publish-ready",
    "published",
    "archived",
  ],
  legal_piece_cycles: ["review -> draft", "published -> draft"],
};

export const fixtureEvents: AdminEventEnvelope[] = [
  {
    schema_version: ADMIN_EVENT_SCHEMA_VERSION,
    event_id: "evt-admin-contract-2026-07-02",
    dedupe_key: "admin:review:event-api-mcp-contract:2026-07-02",
    source: "fleet",
    provider: "admin",
    account: "admin.anipotts.com",
    actor: "codex",
    kind: "review.required",
    ts: NOW,
    privacy: "internal",
    title: "review event contract and read-only mcp",
    summary:
      "first review must cover event fields, projection api, mcp shape, retention, and inbox bento.",
    href: "/api/admin/projections",
    payload_ref: "r2://admin-event-payloads/2026/07/02/admin-contract.json",
    created_by: "codex",
  },
  raybanSentAwareness.event,
  {
    schema_version: ADMIN_EVENT_SCHEMA_VERSION,
    event_id: "evt-rayban-analytics-2026-07-02",
    dedupe_key: "brand:rayban-meta:analytics-reminder:2026-07-02",
    source: "brand",
    provider: "manual",
    account: "ray-ban meta",
    actor: "ani",
    kind: "deadline",
    ts: NOW,
    privacy: "private",
    title: "ray-ban analytics reminder",
    summary:
      "submit the 30-day analytics reminder so the deal closeout can move toward payment.",
    href: null,
    payload_ref: "r2://admin-event-payloads/2026/07/02/rayban-analytics.json",
    created_by: "codex",
  },
  {
    schema_version: ADMIN_EVENT_SCHEMA_VERSION,
    event_id: "evt-connect-topology-diff-2026-07-02",
    dedupe_key: "infra:connect:topology-diff:2026-07-02",
    source: "fleet",
    provider: "1password-connect",
    account: "agent-runtime",
    actor: "codex",
    kind: "approval.required",
    ts: NOW,
    privacy: "sensitive",
    title: "sign connect topology diff",
    summary:
      "value-serving and mcp write tools stay off until Ani signs the exact rule diff.",
    href: "/fleet",
    payload_ref:
      "r2://admin-event-payloads/2026/07/02/connect-topology-diff.json",
    created_by: "codex",
  },
  {
    schema_version: ADMIN_EVENT_SCHEMA_VERSION,
    event_id: "evt-notes-user-session-2026-07-02",
    dedupe_key: "notes:user-session-reader:todo-date:2026-07-02",
    source: "notes",
    provider: "apple-notes",
    account: "ap-pro",
    actor: "claude",
    kind: "adapter.scope",
    ts: NOW,
    privacy: "private",
    title: "daily notes reader stays user-session only",
    summary:
      "todo note import can read in a user session, never from launchd or background op.",
    href: null,
    payload_ref: "r2://admin-event-payloads/2026/07/02/notes-user-session.json",
    created_by: "codex",
  },
];

export const fixtureInboxItems: AdminInboxItem[] = [
  {
    item_id: "inbox-admin-contract-review",
    dedupe_key: "admin:review:event-api-mcp-contract:2026-07-02",
    event_refs: ["evt-admin-contract-2026-07-02"],
    source: "fleet",
    account: "admin.anipotts.com",
    title: "review api plus mcp contract",
    summary:
      "event schema, projection api, read-only mcp, retention, and inbox bento move together.",
    href: "/api/admin/projections",
    status: "review",
    urgency: "urgent",
    owner: "codex chief",
    action_kind: "review",
    expires_at: null,
    last_seen_at: null,
  },
  raybanPaymentFollowUp.inbox_item!,
  {
    item_id: "inbox-connect-topology",
    dedupe_key: "infra:connect:topology-diff:2026-07-02",
    event_refs: ["evt-connect-topology-diff-2026-07-02"],
    source: "fleet",
    account: "agent-runtime",
    title: "connect diff before value access",
    summary:
      "personal/business value-serving stays off; only the signed diff can open that lane.",
    href: "/fleet",
    status: "action required",
    urgency: "high",
    owner: "codex chief",
    action_kind: "approve",
    expires_at: null,
    last_seen_at: null,
  },
  {
    item_id: "inbox-notes-session-reader",
    dedupe_key: "notes:user-session-reader:todo-date:2026-07-02",
    event_refs: ["evt-notes-user-session-2026-07-02"],
    source: "notes",
    account: "ap-pro",
    title: "notes import is user-session only",
    summary:
      "daily todo notes can enter inbox through the session reader, never a launchd reader.",
    href: null,
    status: "scoped",
    urgency: "normal",
    owner: "claude",
    action_kind: "verify",
    expires_at: null,
    last_seen_at: null,
  },
];

export const fixturePieceStates: AdminPieceState[] = [
  {
    piece_id: "piece-newsletter-agent-control-plane",
    dedupe_key: "piece:newsletter:agent-control-plane",
    event_refs: ["evt-admin-contract-2026-07-02"],
    title: "first newsletter on agent control planes",
    state: "draft",
    channels: ["newsletter", "writing", "x-thread"],
    source_refs: ["apps/www/src/content/writing"],
    updated_at: NOW,
  },
  {
    piece_id: "piece-carousel-durable-agent-workflows",
    dedupe_key: "piece:carousel:durable-agent-workflows-v2",
    event_refs: ["evt-admin-contract-2026-07-02"],
    title: "durable agent workflows carousel",
    state: "review",
    channels: ["carousel", "instagram", "tiktok"],
    source_refs: ["apps/admin/src/data/static/carousels"],
    updated_at: NOW,
  },
];

export const fixtureFleetStatus: AdminFleetStatus[] = [
  {
    subject_id: "machine-ap-pro",
    kind: "machine",
    title: "ap-pro",
    status: "human editing",
    summary: "local preview and creation host for admin/site UI work.",
    owner: "ani",
    href: "/fleet",
    event_refs: ["evt-admin-contract-2026-07-02"],
    updated_at: NOW,
  },
  {
    subject_id: "machine-ap-mini",
    kind: "machine",
    title: "ap-mini",
    status: "runtime canonical",
    summary: "event core, projections, services, and clean mirrors live here.",
    owner: "codex chief",
    href: "/fleet",
    event_refs: ["evt-admin-contract-2026-07-02"],
    updated_at: NOW,
  },
];

export const fixtureDeployStates: AdminDeployState[] = [
  {
    deploy_id: "deploy-admin-only-green-check",
    target: "admin.anipotts.com",
    status: "approved after checks",
    scope: "admin-only diff classifier, typecheck, build, preview proof",
    href: "/deploys",
    last_run_at: null,
    event_refs: ["evt-admin-contract-2026-07-02"],
    updated_at: NOW,
  },
];

export const fixtureCapabilityStates: AdminCapabilityState[] = [
  {
    capability_id: "mcp-readonly-ap-pro",
    machine: "ap-pro",
    status: "planned",
    auth_model: "cloudflare-access-service-token-per-machine",
    write_enabled: false,
    summary: "read-only projections for local pro site agents.",
    event_refs: ["evt-admin-contract-2026-07-02"],
    updated_at: NOW,
  },
  {
    capability_id: "mcp-readonly-ap-mini",
    machine: "ap-mini",
    status: "planned",
    auth_model: "cloudflare-access-service-token-per-machine",
    write_enabled: false,
    summary: "read-only projections for runtime and fleet agents.",
    event_refs: ["evt-admin-contract-2026-07-02"],
    updated_at: NOW,
  },
  {
    capability_id: "gmail-metadata-nyu",
    machine: "ap-pro",
    status: "temporary",
    auth_model: "metadata-only",
    write_enabled: false,
    summary: "ap7564@nyu.edu metadata adapter expires 2026-08-31.",
    event_refs: ["evt-admin-contract-2026-07-02"],
    updated_at: NOW,
  },
];

export const fixtureServiceRegistryView: AdminServiceRegistryViewItem[] = [
  {
    service_id: "svc-admin-api",
    name: "admin api",
    hostname: "admin.anipotts.com",
    visibility: "protected",
    owner: "codex chief",
    status: "contract first",
    updated_at: NOW,
    event_refs: ["evt-admin-contract-2026-07-02"],
  },
];

export const fixtureProjections: AdminControlProjections = {
  inbox_items: fixtureInboxItems,
  piece_states: fixturePieceStates,
  fleet_status: fixtureFleetStatus,
  deploy_states: fixtureDeployStates,
  capability_states: fixtureCapabilityStates,
  service_registry_view: fixtureServiceRegistryView,
};
