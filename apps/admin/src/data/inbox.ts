import {
  newsletterDrafts,
  readContentOperationStore,
  readPageContentInventoryStore,
  readProofEntries,
  type ContentInventoryD1Database,
  type ContentOperationD1Database,
  type ProofD1Database,
  type RiskLevel,
} from "@anipotts/content/admin";
import { carouselPosts, carouselSummary } from "./carousels";
import { needsAniItems } from "./needs";
import { loadRuntimeOverlayResponse } from "./runtime";

type AdminInboxDb = ContentInventoryD1Database &
  ContentOperationD1Database &
  ProofD1Database;

export type AdminInboxItem = {
  id: string;
  source:
    | "auth"
    | "content"
    | "fleet"
    | "needs"
    | "deploy"
    | "newsletter"
    | "carousel"
    | "gmail";
  title: string;
  summary: string;
  status: string;
  risk: RiskLevel;
  category: "health" | "content" | "income" | "system";
  timeframe: "now" | "today" | "this week" | "waiting / gated";
  href: string;
  next_action: string;
  proof: string;
  updated_at: string;
};

export type AdminInboxReadState = {
  generated_at: string;
  mode: "ready" | "partial";
  counts: {
    total: number;
    high: number;
    medium: number;
    low: number;
  };
  items: AdminInboxItem[];
};

export async function readAdminInbox(
  db: AdminInboxDb | null | undefined,
): Promise<AdminInboxReadState> {
  const now = new Date().toISOString();
  const [proof, operations, pageContent, runtime] = await Promise.all([
    readProofEntries(db),
    readContentOperationStore(db),
    readPageContentInventoryStore(db),
    loadRuntimeOverlayResponse(),
  ]);

  const items: AdminInboxItem[] = [
    ...proof
      .filter((entry) => entry.status !== "verified")
      .map<AdminInboxItem>((entry) => ({
        id: entry.id,
        source: entry.kind === "auth" ? "auth" : "deploy",
        title: entry.title,
        summary: entry.summary,
        status: entry.status,
        risk: entry.status === "blocked" ? "high" : "medium",
        category: "system",
        timeframe: entry.status === "blocked" ? "waiting / gated" : "now",
        href: entry.kind === "auth" ? "/proof" : "/deploys",
        next_action: entry.next_safe_action,
        proof: entry.evidence_uri,
        updated_at: now,
      })),
    ...needsAniItems
      .filter((item) => item.status === "open")
      .map<AdminInboxItem>((item) => ({
        id: item.id,
        source: "needs",
        title: item.primary_action,
        summary: item.why,
        status: item.type,
        risk: item.bucket === "unblockable_now" ? "high" : "medium",
        category: categoryForNeed(item.owner, item.id),
        timeframe:
          item.bucket === "unblockable_now"
            ? "now"
            : item.bucket === "waiting_on_account_or_device"
              ? "waiting / gated"
              : "today",
        href: `/inbox#${categoryForNeed(item.owner, item.id)}`,
        next_action: item.ani_action,
        proof: item.proof,
        updated_at: item.expires_stale,
      })),
    ...operations.operations
      .filter((operation) =>
        ["draft", "previewed", "needs_ani", "blocked"].includes(
          operation.status,
        ),
      )
      .slice(0, 8)
      .map<AdminInboxItem>((operation) => ({
        id: operation.operation_id,
        source: "content",
        title: operation.field_path,
        summary: operation.reviewer_note ?? operation.proposed_value,
        status: operation.status,
        risk: operation.risk_level,
        category: "content",
        timeframe: operation.status === "blocked" ? "waiting / gated" : "today",
        href: operation.preview_targets[0] ?? "/content/drafts",
        next_action:
          operation.status === "blocked"
            ? operation.authority_state
            : "open preview, then publish only a selected published-visibility draft",
        proof: operation.proof_ids.join(", ") || operation.source_ref,
        updated_at: operation.updated_at,
      })),
    ...runtime.overlays
      .filter(
        (overlay) =>
          (overlay.ahead ?? 0) > 0 ||
          (overlay.behind ?? 0) > 0 ||
          (overlay.dirty_tracked_count ?? 0) > 0 ||
          (overlay.untracked_count ?? 0) > 0 ||
          !overlay.git_available,
      )
      .map<AdminInboxItem>((overlay) => ({
        id: overlay.repo_state_id,
        source: "fleet",
        title: `${overlay.repo} on ${overlay.machine}`,
        summary: `${overlay.branch ?? "no branch"} / dirty ${overlay.dirty_tracked_count ?? 0} / untracked ${overlay.untracked_count ?? 0}`,
        status: overlay.git_available
          ? overlay.deploy_impact
          : "git unavailable",
        risk: overlay.deploy_impact === "production" ? "high" : "medium",
        category: "system",
        timeframe: overlay.deploy_impact === "production" ? "now" : "today",
        href: "/fleet",
        next_action: overlay.notes,
        proof: overlay.live_runtime_role,
        updated_at: runtime.generated_at ?? now,
      })),
    ...runtime.gmail_sent_awareness.projections.inbox_items.map<AdminInboxItem>(
      (item) => ({
        id: item.item_id,
        source: "gmail",
        title: item.title,
        summary: item.summary,
        status: item.status,
        risk:
          item.urgency === "urgent" || item.urgency === "high"
            ? "high"
            : item.urgency === "low"
              ? "low"
              : "medium",
        category: "income",
        timeframe:
          item.urgency === "urgent" || item.urgency === "high"
            ? "now"
            : "today",
        href: item.href ?? "/inbox",
        next_action:
          item.action_kind === "none"
            ? "no action required"
            : "review the projected follow-up; sent-mail proof is event-only",
        proof: item.event_refs.join(", ") || item.dedupe_key,
        updated_at:
          item.last_seen_at ?? runtime.generated_at ?? item.expires_at ?? now,
      }),
    ),
    ...newsletterDrafts
      .filter((draft) => draft.status !== "ready_for_review")
      .slice(0, 4)
      .map<AdminInboxItem>((draft) => ({
        id: draft.id,
        source: "newsletter",
        title: draft.title,
        summary: draft.summary,
        status: draft.status,
        risk: draft.status === "blocked" ? "high" : "low",
        category: "content",
        timeframe: draft.status === "blocked" ? "waiting / gated" : "this week",
        href: `/newsletter/${draft.slug}`,
        next_action: draft.pipeline.next_action,
        proof: draft.source_fixture,
        updated_at: now,
      })),
    ...carouselPosts
      .filter((post) => post.staleCount > 0 || post.soundStatus !== "approved")
      .slice(0, 4)
      .map<AdminInboxItem>((post) => ({
        id: post.id,
        source: "carousel",
        title: post.title,
        summary: `${post.readyExports}/${post.slideCount * 2} exports ready; sound ${post.soundStatus}`,
        status: post.status,
        risk: post.staleCount > 0 ? "medium" : "low",
        category: "content",
        timeframe: "this week",
        href: "/content/carousels",
        next_action:
          carouselSummary.staleExports > 0
            ? "review stale crop outputs before export"
            : "review sound approval before platform prep",
        proof: "media carousel handoff manifest",
        updated_at: now,
      })),
  ];

  if (pageContent.mode !== "ready") {
    items.push({
      id: "content.page-content.unavailable",
      source: "content",
      title: "page_content read unavailable",
      summary:
        pageContent.mode === "read_failed"
          ? pageContent.error
          : "D1 binding is missing in this runtime.",
      status: pageContent.mode,
      risk: "medium",
      category: "content",
      timeframe: "today",
      href: "/content",
      next_action:
        "fix DB binding or local runtime before editing public content",
      proof: "D1 page_content",
      updated_at: now,
    });
  }

  const sorted = items.sort((a, b) => score(b) - score(a));

  return {
    generated_at: now,
    mode:
      pageContent.mode === "ready" && operations.mode !== "read_failed"
        ? "ready"
        : "partial",
    counts: {
      total: sorted.length,
      high: sorted.filter((item) => item.risk === "high").length,
      medium: sorted.filter((item) => item.risk === "medium").length,
      low: sorted.filter((item) => item.risk === "low").length,
    },
    items: sorted,
  };
}

function categoryForNeed(
  owner: string,
  id: string,
): AdminInboxItem["category"] {
  const ref = `${owner}:${id}`.toLowerCase();
  if (ref.includes("health")) return "health";
  if (
    ref.includes("business") ||
    ref.includes("jobs") ||
    ref.includes("payment") ||
    ref.includes("income")
  ) {
    return "income";
  }
  if (
    ref.includes("brand") ||
    ref.includes("site") ||
    ref.includes("content") ||
    ref.includes("newsletter") ||
    ref.includes("media")
  ) {
    return "content";
  }
  return "system";
}

function score(item: AdminInboxItem): number {
  const risk = item.risk === "high" ? 30 : item.risk === "medium" ? 20 : 10;
  const source = item.source === "auth" || item.source === "needs" ? 5 : 0;
  const timeframe =
    item.timeframe === "now" ? 4 : item.timeframe === "today" ? 2 : 0;
  return risk + source + timeframe;
}
