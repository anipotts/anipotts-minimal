import feedJson from "./static/admin-feed.sample.json";

export type ControlState =
  | "safe"
  | "needs approval"
  | "running"
  | "blocked"
  | "stale"
  | "destructive"
  | "proposed"
  | "approved"
  | "verified"
  | "queued"
  | "active"
  | "valid"
  | "waiting"
  | "waiting_on_agent"
  | "waiting_on_ani"
  | "open"
  | "partially_absorbed"
  | "absorbed"
  | "current";

export type RiskLevel = "low" | "medium" | "high" | "critical";

type SourceRef = {
  kind: string;
  path: string;
  ref?: string;
  summary: string;
};

type ApprovalRow = {
  approval_id: string;
  title: string;
  status: string;
  risk_level: string;
  allowed: string[];
  forbidden: string[];
  proof_required: string[];
  mutation_ids: string[];
  source_refs: SourceRef[];
};

type BlockerRow = {
  blocker_id: string;
  title: string;
  status: string;
  severity: string;
  owner: string;
  domain: string;
  requires_ani: boolean;
  next_action: string;
  related_ids: string[];
};

type HandoffRow = {
  handoff_id: string;
  title: string;
  path: string;
  freshness: string;
  absorbed_at: string | null;
  target_owner: string;
  status: string;
  next_action: string;
  proof_ids: string[];
};

type MutationRow = {
  mutation_id: string;
  title: string;
  status: string;
  risk_level: string;
  intent: string;
  authority_state: string;
  allowed_actions: string[];
  forbidden_actions: string[];
  required_approval_ids: string[];
  next_safe_action: string;
  target_surface: string;
  proof_ids: string[];
  blocker_ids: string[];
  domain: string;
  repo: string;
};

type OperationRow = {
  operation_id: string;
  title: string;
  status: string;
  machine: string;
  agent: string;
  phase: string;
  heartbeat_at: string;
  stop_path: string;
  next_safe_action: string;
  proof_ids: string[];
  repo: string;
};

type ProofRow = {
  proof_id: string;
  title: string;
  status: string;
  evidence_uri: string;
  redaction: "none" | "metadata_only" | "secret_value_omitted" | "private_payload_omitted";
  summary: string;
};

type RepoStateRow = {
  repo_state_id: string;
  repo: string;
  path: string;
  branch: string;
  dirty_tracked: string[];
  untracked_count: number;
  deploy_impact: "none" | "local_only" | "preview" | "production" | "unknown";
  status?: string;
  worktree_state: string;
  next_safe_action: string;
  proof_ids: string[];
  blocker_ids: string[];
  canonical_role: string;
};

type AdminFeed = {
  counts: Record<string, number>;
  model: string;
  question: string;
  snapshot_type: string;
  source: {
    generated_by: string;
    mode: string;
    path: string;
    repo: string;
  };
  version: number;
  objects: {
    approvals: ApprovalRow[];
    blockers: BlockerRow[];
    handoffs: HandoffRow[];
    mutations: MutationRow[];
    operations: OperationRow[];
    proofs: ProofRow[];
    repo_states: RepoStateRow[];
  };
};

export type WorkCard = {
  title: string;
  status: ControlState;
  risk_level: RiskLevel;
  next_safe_action: string;
  intent: string;
  authority_state: string;
  operation_summary: string;
  proof_ids: string[];
};

export type AuthorityCard = {
  title: string;
  status: ControlState;
  risk_level: RiskLevel;
  authority_state: string;
  required_approval_ids: string[];
  allowed_actions: string[];
  forbidden_actions: string[];
};

export type OperationCard = {
  title: string;
  status: ControlState;
  machine: string;
  agent: string;
  phase: string;
  heartbeat_at: string;
  stop_path: string;
  next_safe_action: string;
};

export type ProofCard = {
  title: string;
  status: ControlState;
  proof_ids: string[];
  evidence_uri: string;
  redaction: "none" | "metadata_only" | "secret_value_omitted" | "private_payload_omitted";
  summary: string;
};

export type RepoCard = {
  repo: string;
  path: string;
  branch: string;
  dirty_tracked: string[];
  untracked_count: number;
  deploy_impact: "none" | "local_only" | "preview" | "production" | "unknown";
  status: ControlState;
  next_safe_action: string;
  proof_ids: string[];
};

export type RuntimeRepoOverlay = {
  repo_state_id: string;
  repo: string;
  repo_root_label: string;
  machine: string;
  git_available: boolean;
  branch: string | null;
  head_sha: string | null;
  upstream: string | null;
  upstream_sha: string | null;
  ahead: number | null;
  behind: number | null;
  dirty_tracked_count: number | null;
  untracked_count: number | null;
  deploy_impact: "none" | "local_only" | "preview" | "production" | "unknown";
  live_runtime_role: string;
  notes: string;
};

export type RuntimeOverlayResponse = {
  available: boolean;
  mode: "local_dev" | "disabled" | "missing" | "error";
  generated_at: string | null;
  machine: string | null;
  source_path: string;
  safety: {
    dirty_filenames_included: boolean;
    file_contents_included: boolean;
    health_payloads_included: boolean;
    mode: string;
    secret_values_included: boolean;
  } | null;
  overlays: RuntimeRepoOverlay[];
  error?: string;
};

export type HandoffCard = {
  title: string;
  path: string;
  freshness: "current" | "stale" | "unknown";
  absorbed_at: string | null;
  target_owner: string;
  status: ControlState;
  next_safe_action: string;
  proof_ids: string[];
};

export type DestructiveGate = WorkCard &
  AuthorityCard &
  ProofCard & {
    area: string;
  };

export const adminFeed = feedJson as AdminFeed;

export const feedSource = {
  infra_commit: "c26959c",
  copied_from: "/Users/anipotts/Infra/coord/admin/static/admin-feed.sample.json",
  generated_by: adminFeed.source.generated_by,
  snapshot_type: adminFeed.snapshot_type,
  version: adminFeed.version,
};

const {
  approvals,
  blockers,
  handoffs: handoffRows,
  mutations,
  operations: operationRows,
  proofs: proofRows,
  repo_states: repoStateRows,
} = adminFeed.objects;

export const workCards: WorkCard[] = [
  ...mutations.map(toMutationWorkCard),
  ...blockers.map(toBlockerWorkCard),
];

export const coverageCards: WorkCard[] = [
  coverageCard("site/admin shell state", hasDomain("site"), "mut.site.admin-shell.readonly.slice1"),
  coverageCard("health rename blocker", hasDomain("health"), "block.health.rename.execution-approval"),
  coverageCard("jobs feed state", hasDomain("jobs"), "proof.jobs.admin-feed.commit"),
  coverageCard("brand/business operating layers", hasDomain("brand") && hasDomain("business"), "proof.brand.phase1.commit, proof.business.secretary-layer.commit"),
  coverageCard("repo states", repoStateRows.length > 0, "repo.anipotts-com.admin-solid"),
];

export const authorityCards: AuthorityCard[] = [
  ...approvals.map(toApprovalAuthorityCard),
  ...mutations.map(toMutationAuthorityCard),
];

export const operations: OperationCard[] = operationRows.map((operation) => ({
  title: operation.title,
  status: normalizeStatus(operation.status),
  machine: operation.machine,
  agent: operation.agent,
  phase: operation.phase,
  heartbeat_at: operation.heartbeat_at,
  stop_path: operation.stop_path,
  next_safe_action: operation.next_safe_action,
}));

export const proofs: ProofCard[] = proofRows.map((proof) => ({
  title: proof.title,
  status: normalizeStatus(proof.status),
  proof_ids: [proof.proof_id],
  evidence_uri: proof.evidence_uri,
  redaction: proof.redaction,
  summary: proof.summary,
}));

export const repos: RepoCard[] = repoStateRows.map((repo) => ({
  repo: repo.repo,
  path: repo.path,
  branch: repo.branch,
  dirty_tracked: repo.dirty_tracked,
  untracked_count: repo.untracked_count,
  deploy_impact: repo.deploy_impact,
  status: repoStatus(repo),
  next_safe_action: repo.next_safe_action,
  proof_ids: repo.proof_ids,
}));

export const handoffs: HandoffCard[] = handoffRows.map((handoff) => ({
  title: handoff.title,
  path: handoff.path,
  freshness: normalizeFreshness(handoff.freshness),
  absorbed_at: handoff.absorbed_at,
  target_owner: handoff.target_owner,
  status: normalizeStatus(handoff.status),
  next_safe_action: handoff.next_action,
  proof_ids: handoff.proof_ids,
}));

export const destructiveGates: DestructiveGate[] = [
  "delete",
  "auth",
  "secrets",
  "dns",
  "deploy",
  "payment",
  "account",
].map(toDestructiveGate);

export const topStrip: WorkCard[] = [
  stateSummary("safe", "safe", safeCount(), "read-only work and no-deploy repo rows"),
  stateSummary("needs approval", "needs approval", needsApprovalCount(), "approval-linked mutations and Ani-gated blockers"),
  stateSummary("running", "running", runningCount(), "running, queued, or waiting operations"),
  stateSummary("blocked", "blocked", blockedCount(), "blockers and blocked mutations"),
  stateSummary("stale", "stale", staleCount(), "missing static feed coverage or stale handoffs"),
  stateSummary("destructive", "destructive", destructiveGates.length, "gated operation classes with proof requirements"),
];

function toMutationWorkCard(mutation: MutationRow): WorkCard {
  return {
    title: mutation.title,
    status: normalizeStatus(mutation.status),
    risk_level: normalizeRisk(mutation.risk_level),
    next_safe_action: mutation.next_safe_action,
    intent: mutation.intent,
    authority_state: mutation.authority_state,
    operation_summary: mutation.target_surface,
    proof_ids: mutation.proof_ids,
  };
}

function toBlockerWorkCard(blocker: BlockerRow): WorkCard {
  return {
    title: blocker.title,
    status: normalizeStatus(blocker.status),
    risk_level: normalizeRisk(blocker.severity),
    next_safe_action: blocker.next_action,
    intent: blocker.title,
    authority_state: blocker.requires_ani ? "requires_ani" : "agent_can_continue",
    operation_summary: `${blocker.owner} / ${blocker.domain}`,
    proof_ids: blocker.related_ids,
  };
}

function toApprovalAuthorityCard(approval: ApprovalRow): AuthorityCard {
  return {
    title: approval.title,
    status: normalizeStatus(approval.status),
    risk_level: normalizeRisk(approval.risk_level),
    authority_state: approval.status,
    required_approval_ids: [approval.approval_id],
    allowed_actions: approval.allowed,
    forbidden_actions: approval.forbidden,
  };
}

function toMutationAuthorityCard(mutation: MutationRow): AuthorityCard {
  return {
    title: mutation.title,
    status: normalizeStatus(mutation.status),
    risk_level: normalizeRisk(mutation.risk_level),
    authority_state: mutation.authority_state,
    required_approval_ids: mutation.required_approval_ids,
    allowed_actions: mutation.allowed_actions,
    forbidden_actions: mutation.forbidden_actions,
  };
}

function coverageCard(title: string, present: boolean, proofId: string): WorkCard {
  return {
    title,
    status: present ? "verified" : "stale",
    risk_level: present ? "low" : "medium",
    next_safe_action: present
      ? `Render from the static feed bundle copied from Infra ${feedSource.infra_commit}.`
      : `No object for this layer exists in the ${feedSource.infra_commit} static feed; add a repo exporter or sample row before live collector work.`,
    intent: present ? "confirm static feed coverage" : "show missing static feed coverage without inventing state",
    authority_state: "static_sample_only",
    operation_summary: `${adminFeed.snapshot_type} / ${feedSource.infra_commit}`,
    proof_ids: [proofId],
  };
}

function stateSummary(
  title: string,
  status: ControlState,
  count: number,
  detail: string,
): WorkCard {
  return {
    title,
    status,
    risk_level: status === "destructive" ? "critical" : status === "blocked" ? "high" : "low",
    next_safe_action: `${count} ${detail}`,
    intent: adminFeed.question,
    authority_state: "static_sample_only",
    operation_summary: `${adminFeed.model} / ${feedSource.infra_commit}`,
    proof_ids: ["admin-feed.sample.json"],
  };
}

function toDestructiveGate(area: string): DestructiveGate {
  const matchingForbidden = allForbiddenActions().filter((action) => matchesArea(area, action));
  const relatedMutation = mutations.find((mutation) =>
    mutation.forbidden_actions.some((action) => matchesArea(area, action)),
  );
  const relatedBlocker = blockers.find((blocker) =>
    blocker.next_action.toLowerCase().includes(area),
  );
  const proof = proofRows.find((row) => row.proof_id === relatedMutation?.proof_ids[0]) ?? proofRows[0];
  const sourceAuthority = relatedMutation
    ? toMutationAuthorityCard(relatedMutation)
    : approvals[0]
      ? toApprovalAuthorityCard(approvals[0])
      : fallbackAuthorityCard();

  return {
    area,
    title: `${area} gate`,
    status: "destructive",
    risk_level: area === "deploy" || area === "dns" || area === "secrets" ? "critical" : "high",
    next_safe_action:
      relatedMutation?.next_safe_action ??
      relatedBlocker?.next_action ??
      "Use the static feed to inspect proof requirements only; do not execute.",
    intent: relatedMutation?.intent ?? `Keep ${area} operations gated in the read-only admin shell.`,
    authority_state: sourceAuthority.authority_state,
    operation_summary: matchingForbidden.join(", ") || `${area} operation class is hard-gated`,
    proof_ids: relatedMutation?.proof_ids ?? [proof?.proof_id ?? "admin-feed.sample.json"],
    required_approval_ids: sourceAuthority.required_approval_ids,
    allowed_actions: sourceAuthority.allowed_actions,
    forbidden_actions: matchingForbidden.length > 0 ? matchingForbidden : sourceAuthority.forbidden_actions,
    evidence_uri: proof?.evidence_uri ?? feedSource.copied_from,
    redaction: proof?.redaction ?? "metadata_only",
    summary: proof?.summary ?? "Static feed copied from Infra without secret or private payload values.",
  };
}

function allForbiddenActions(): string[] {
  return [
    ...approvals.flatMap((approval) => approval.forbidden),
    ...mutations.flatMap((mutation) => mutation.forbidden_actions),
  ];
}

function fallbackAuthorityCard(): AuthorityCard {
  return {
    title: "Static feed authority missing",
    status: "blocked",
    risk_level: "high",
    authority_state: "missing_static_authority",
    required_approval_ids: ["admin-feed.authority.missing"],
    allowed_actions: ["inspect static feed metadata"],
    forbidden_actions: ["execute destructive operations", "deploy", "mutate live state"],
  };
}

function matchesArea(area: string, action: string): boolean {
  const haystack = action.toLowerCase();
  const matchers: Record<string, RegExp> = {
    delete: /delete|cleanup|source\/personal/,
    auth: /auth|access/,
    secrets: /secret|env/,
    dns: /dns|endpoint|port|tailscale|firewall/,
    deploy: /deploy|worker|service|launchd|restart|rename/,
    payment: /payment|filing|invoice|revenue/,
    account: /account|user/,
  };
  return matchers[area]?.test(haystack) ?? false;
}

function hasDomain(domain: string): boolean {
  const needle = domain.toLowerCase();
  return (
    mutations.some((row) => row.domain.toLowerCase() === needle || row.repo.toLowerCase() === needle) ||
    blockers.some((row) => row.domain.toLowerCase() === needle) ||
    repoStateRows.some((row) => row.repo.toLowerCase() === needle || row.canonical_role.toLowerCase() === needle)
  );
}

function safeCount(): number {
  return approvals.filter((row) => row.status === "active").length +
    repoStateRows.filter((row) => row.deploy_impact === "none").length;
}

function needsApprovalCount(): number {
  return mutations.filter((row) => row.required_approval_ids.length > 0).length +
    blockers.filter((row) => row.requires_ani).length;
}

function runningCount(): number {
  return operationRows.filter((row) => ["running", "queued", "waiting"].includes(row.status)).length;
}

function blockedCount(): number {
  return blockers.length + mutations.filter((row) => row.status === "blocked").length;
}

function staleCount(): number {
  return coverageCards.filter((row) => row.status === "stale").length +
    handoffRows.filter((row) => row.freshness === "stale").length;
}

function repoStatus(repo: RepoStateRow): ControlState {
  if (repo.blocker_ids.length > 0) return "blocked";
  if (repo.deploy_impact === "none") return "safe";
  if (repo.deploy_impact === "local_only") return "needs approval";
  return "stale";
}

function normalizeRisk(value: string): RiskLevel {
  if (value === "critical" || value === "high" || value === "medium" || value === "low") {
    return value;
  }
  return "medium";
}

function normalizeStatus(value: string): ControlState {
  if (
    value === "safe" ||
    value === "needs approval" ||
    value === "running" ||
    value === "blocked" ||
    value === "stale" ||
    value === "destructive" ||
    value === "proposed" ||
    value === "approved" ||
    value === "verified" ||
    value === "queued" ||
    value === "active" ||
    value === "valid" ||
    value === "waiting" ||
    value === "waiting_on_agent" ||
    value === "waiting_on_ani" ||
    value === "open" ||
    value === "partially_absorbed" ||
    value === "absorbed" ||
    value === "current"
  ) {
    return value;
  }
  return "stale";
}

function normalizeFreshness(value: string): "current" | "stale" | "unknown" {
  if (value === "current" || value === "stale") return value;
  return "unknown";
}
