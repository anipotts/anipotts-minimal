import type { RiskLevel } from "./content";

export type ContentOperationKind =
  | "content_record"
  | "content_draft"
  | "content_publish";

export type ContentOperationStatus =
  | "draft"
  | "previewed"
  | "needs_ani"
  | "blocked"
  | "approved"
  | "publishing"
  | "published"
  | "verified"
  | "reverted";

export type ContentOperationSurface = "public_site" | "newsletter" | "admin";

export type ContentOperation = {
  operation_id: string;
  kind: ContentOperationKind;
  surface: ContentOperationSurface;
  route: string;
  source_ref: string;
  field_path: string;
  current_value_ref: string;
  proposed_value: string;
  status: ContentOperationStatus;
  risk_level: RiskLevel;
  authority_state: string;
  required_approval_ids: string[];
  allowed_actions: string[];
  forbidden_actions: string[];
  preview_targets: string[];
  proof_ids: string[];
  evidence_uri?: string;
  redaction: string;
  created_by: "agent" | "ani" | "system";
  created_at: string;
  updated_at: string;
  expires_at?: string;
  rollback_ref: string;
  reviewer_note?: string;
};

export type ContentOperationTable = {
  table:
    | "content_records"
    | "content_draft_operations"
    | "content_publish_events";
  purpose: string;
  write_state: "schema_only" | "inert_preview" | "future_publish";
  blocked_actions: string[];
};

export const contentOperationSchemaSource = {
  source_doc: "docs/admin-content-draft-operations.md",
  migration: "drizzle/migrations/0007_content_operations.sql",
  schema: "packages/lib/src/db/schema.ts",
  mode: "d1_schema_no_write_endpoint",
};

export const contentOperationTables: ContentOperationTable[] = [
  {
    table: "content_records",
    purpose:
      "future published field overrides for public-site and newsletter copy",
    write_state: "schema_only",
    blocked_actions: ["browser save", "public-site runtime read", "publish"],
  },
  {
    table: "content_draft_operations",
    purpose:
      "draft and preview operations with authority, proof, rollback, and blocked action metadata",
    write_state: "inert_preview",
    blocked_actions: ["hidden api write", "direct source edit", "auto deploy"],
  },
  {
    table: "content_publish_events",
    purpose:
      "future immutable proof trail for approved publish and rollback events",
    write_state: "future_publish",
    blocked_actions: ["send", "schedule", "publish without proof"],
  },
];

export const contentOperationTemplates: ContentOperation[] = [
  {
    operation_id: "content-draft-homepage-summary-2026-06-27",
    kind: "content_draft",
    surface: "public_site",
    route: "/",
    source_ref: "apps/www/src/data/site.ts:homeContent.summary",
    field_path: "homepage.summary",
    current_value_ref: "source_default",
    proposed_value:
      "previously worked on real-time agent i/o at structured ai (YC F25) and our bad habit, an atlantic records venture. now i write about coding agent workflows and the systems around them.",
    status: "previewed",
    risk_level: "medium",
    authority_state: "preview_only_no_write",
    required_approval_ids: [],
    allowed_actions: ["render_preview", "request_review"],
    forbidden_actions: ["save", "publish", "deploy", "send"],
    preview_targets: ["/content/preview", "/"],
    proof_ids: [
      "content.homepage.summary.source",
      "admin.content.preview.local",
    ],
    evidence_uri: "repo://apps/www/src/data/site.ts",
    redaction: "public_copy_only",
    created_by: "agent",
    created_at: "2026-06-27T00:00:00Z",
    updated_at: "2026-06-27T00:00:00Z",
    expires_at: "2026-07-27T00:00:00Z",
    rollback_ref: "source_default",
  },
  {
    operation_id: "content-draft-newsletter-block-source-2026-06-27",
    kind: "content_draft",
    surface: "newsletter",
    route: "/newsletter",
    source_ref: "apps/www/src/components/NewsletterSubscribe.astro",
    field_path: "newsletter.subscribe_copy",
    current_value_ref: "component_default",
    proposed_value:
      "model newsletter headline, deck, CTA, success text, and error text as content records before enabling saves",
    status: "blocked",
    risk_level: "medium",
    authority_state: "needs_source_truth_decision",
    required_approval_ids: ["content.newsletter-source.owner-decision"],
    allowed_actions: ["render_preview", "request_review"],
    forbidden_actions: ["save", "publish", "send", "sync_provider"],
    preview_targets: ["/content/preview", "/newsletter"],
    proof_ids: ["content.newsletter.component.defaults"],
    evidence_uri: "repo://apps/www/src/components/NewsletterSubscribe.astro",
    redaction: "public_copy_only",
    created_by: "agent",
    created_at: "2026-06-27T00:00:00Z",
    updated_at: "2026-06-27T00:00:00Z",
    expires_at: "2026-07-27T00:00:00Z",
    rollback_ref: "component_default",
  },
];
