export type AdminInboxCategory =
  | "work"
  | "content"
  | "life"
  | "fleet"
  | "system";

export type InboxPolicyItem = {
  domain?: string;
  source: string;
  owner: string;
  account?: string | null;
  title: string;
  status: string;
  attention_kind?: string;
  action_kind: string;
};

const CLOSED_STATUSES = new Set([
  "archived",
  "closed",
  "complete",
  "completed",
  "resolved",
  "verified",
]);

const HUMAN_ATTENTION_KINDS = new Set([
  "approval",
  "decision",
  "deadline",
  "error",
  "review",
  "verification",
]);

const HUMAN_ACTION_KINDS = new Set([
  "approve",
  "decide",
  "deadline",
  "review",
  "verify",
]);

export function canonicalInboxDomain(
  item: Pick<
    InboxPolicyItem,
    "domain" | "source" | "owner" | "account" | "title"
  >,
): AdminInboxCategory {
  const domain = item.domain?.trim().toLowerCase() ?? "";

  if (
    ["work", "business", "jobs", "income", "finance", "mail"].includes(domain)
  ) {
    return "work";
  }
  if (["content", "brand", "media", "site", "newsletter"].includes(domain)) {
    return "content";
  }
  if (["life", "health", "vitals"].includes(domain)) return "life";
  if (domain === "fleet") return "fleet";
  if (["system", "admin", "infra", "proof"].includes(domain)) {
    return "system";
  }

  const ref = [item.source, item.owner, item.account, item.title]
    .filter(Boolean)
    .join(":")
    .toLowerCase();

  if (ref.includes("health") || ref.includes("vitals")) return "life";
  if (
    ref.includes("business") ||
    ref.includes("jobs") ||
    ref.includes("income") ||
    ref.includes("payment") ||
    ref.includes("gmail")
  ) {
    return "work";
  }
  if (
    ref.includes("brand") ||
    ref.includes("site") ||
    ref.includes("content") ||
    ref.includes("newsletter") ||
    ref.includes("media") ||
    ref.includes("carousel")
  ) {
    return "content";
  }
  if (ref.includes("fleet") || ref.includes("repo")) return "fleet";
  return "system";
}

export function isClosedInboxItem(
  item: Pick<InboxPolicyItem, "status">,
): boolean {
  return CLOSED_STATUSES.has(item.status.trim().toLowerCase());
}

export function requiresHumanInboxAttention(
  item: Pick<InboxPolicyItem, "status" | "attention_kind" | "action_kind">,
): boolean {
  if (isClosedInboxItem(item)) return false;

  const attention = item.attention_kind?.trim().toLowerCase() ?? "";
  const action = item.action_kind.trim().toLowerCase();
  const status = item.status.trim().toLowerCase();

  return (
    HUMAN_ATTENTION_KINDS.has(attention) ||
    HUMAN_ACTION_KINDS.has(action) ||
    ["blocked", "gated", "failed", "failure", "systemerror"].some((signal) =>
      status.includes(signal),
    )
  );
}

export function shouldPromoteRuntimeOverlay(item: {
  deploy_impact: string;
  git_available: boolean;
}): boolean {
  return (
    item.deploy_impact === "production" ||
    item.deploy_impact === "unknown" ||
    !item.git_available
  );
}

export function partitionInboxProjectionItems<
  T extends Pick<InboxPolicyItem, "status" | "attention_kind" | "action_kind">,
>(items: T[]): { open: T[]; history: T[] } {
  return {
    open: items.filter((item) => requiresHumanInboxAttention(item)),
    history: items.filter((item) => isClosedInboxItem(item)),
  };
}
