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
  | "waiting_on_agent"
  | "open"
  | "partially_absorbed"
  | "absorbed"
  | "current";

export type RiskLevel = "low" | "medium" | "high" | "critical";

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
    area: "delete" | "auth" | "secrets" | "dns" | "deploy" | "payment" | "account";
  };

export const topStrip: WorkCard[] = [
  {
    title: "safe",
    status: "safe",
    risk_level: "low",
    next_safe_action: "continue read-only checks and draft PR work",
    intent: "show work that can proceed without live mutation",
    authority_state: "not_required",
    operation_summary: "local validation and draft review",
    proof_ids: ["proof.validator.admin-contract.samples"],
  },
  {
    title: "needs approval",
    status: "needs approval",
    risk_level: "medium",
    next_safe_action: "ask for exact approval before merge, deploy, tunnel, env, or account changes",
    intent: "separate safe preparation from live authority",
    authority_state: "required",
    operation_summary: "approval-gated queue",
    proof_ids: ["appr.admin.readonly-build-slices.2026-06-23"],
  },
  {
    title: "running",
    status: "running",
    risk_level: "low",
    next_safe_action: "watch local validation and draft PR checks",
    intent: "track active non-live work",
    authority_state: "approved",
    operation_summary: "admin shell build and schema validation",
    proof_ids: ["op.site.admin-shell.local-build"],
  },
  {
    title: "blocked",
    status: "blocked",
    risk_level: "high",
    next_safe_action: "route mini tunnel and live collectors to gated Infra approval",
    intent: "stop work that needs live service authority",
    authority_state: "not_granted",
    operation_summary: "collector and tunnel checks paused",
    proof_ids: ["block.admin.live-collectors-not-yet-approved"],
  },
  {
    title: "stale",
    status: "stale",
    risk_level: "medium",
    next_safe_action: "refresh handoff absorption and repo snapshots before acting",
    intent: "keep old thread state visible",
    authority_state: "refresh_required",
    operation_summary: "handoff and repo-state freshness",
    proof_ids: ["handoff.admin-control-plane-build-map"],
  },
  {
    title: "destructive",
    status: "destructive",
    risk_level: "critical",
    next_safe_action: "show proof requirements only, no live controls",
    intent: "make dangerous operations inspectable without enabling execution",
    authority_state: "explicit_approval_required",
    operation_summary: "delete, auth, secrets, dns, deploy, payment, account",
    proof_ids: ["proof.handoff.admin-build-map"],
  },
];

export const workCards: WorkCard[] = [
  {
    title: "Build read-only admin control-plane shell",
    status: "approved",
    risk_level: "low",
    next_safe_action: "Use coord/admin/samples as mocked read model and render route skeletons.",
    intent: "Make admin.anipotts.com answer what is safe to do next using mocked control-plane data.",
    authority_state: "approved",
    operation_summary: "add read-only admin-solid routes on an agent branch",
    proof_ids: ["proof.handoff.admin-build-map"],
  },
  {
    title: "Claude review bot gate",
    status: "verified",
    risk_level: "medium",
    next_safe_action: "Rerun or update admin PR checks so Claude review can pass with the token-factory bot.",
    intent: "remove false review failure on agent PRs",
    authority_state: "approved_by_ani",
    operation_summary: "PR #74 merged before continuing admin shell",
    proof_ids: ["ac41a92da49c70fbecff799b47aca0ebec242980"],
  },
  {
    title: "Live collectors are intentionally out of scope",
    status: "blocked",
    risk_level: "high",
    next_safe_action: "After the read-only UI feels right, request separate approval for low-latency collectors.",
    intent: "protect live machine, auth, and service state while the UI model settles",
    authority_state: "not_approved",
    operation_summary: "collector wiring stopped before worker or service mutation",
    proof_ids: ["block.admin.live-collectors-not-yet-approved"],
  },
  {
    title: "Small public cleanup PR",
    status: "needs approval",
    risk_level: "medium",
    next_safe_action: "Keep PR #73 unmerged unless Ani explicitly wants that public cleanup deployed.",
    intent: "avoid bundling public-site deploy risk into admin shell work",
    authority_state: "approval_required",
    operation_summary: "draft public-site-only PR remains separate",
    proof_ids: ["pr-73-draft"],
  },
];

export const authorityCards: AuthorityCard[] = [
  {
    title: "Read-only admin control-plane build slices",
    status: "active",
    risk_level: "low",
    authority_state: "approved",
    required_approval_ids: ["appr.admin.readonly-build-slices.2026-06-23"],
    allowed_actions: ["read-only design", "sample data", "schemas", "local validation", "scoped agent branch"],
    forbidden_actions: ["deploy", "DNS", "env or secret mutation", "live worker mutation", "Cloudflare mutation"],
  },
  {
    title: "Admin live deployment",
    status: "needs approval",
    risk_level: "high",
    authority_state: "not_approved",
    required_approval_ids: ["approval.admin.live-deploy.required"],
    allowed_actions: ["draft PR prep", "local smoke tests", "static mock data"],
    forbidden_actions: ["merge admin PR to main", "deploy admin worker", "change auth", "wire destructive controls"],
  },
];

export const operations: OperationCard[] = [
  {
    title: "Build mocked admin shell in apps/admin-solid",
    status: "running",
    machine: "ap-mini",
    agent: "chief/site",
    phase: "local-ui-build",
    heartbeat_at: "2026-06-24T03:45:00Z",
    stop_path: "stop before deploy, DNS, env, worker, or production mutation",
    next_safe_action: "Run admin-solid typecheck, build, and local route smoke.",
  },
  {
    title: "Write admin contract schemas and samples",
    status: "verified",
    machine: "ap-mini",
    agent: "chief/infra",
    phase: "schema-and-sample-committed",
    heartbeat_at: "2026-06-24T03:40:00Z",
    stop_path: "no further Infra mutation needed for site slice",
    next_safe_action: "Consume coord/admin fields in the admin shell mock data.",
  },
  {
    title: "ap-pro review surface",
    status: "queued",
    machine: "ap-pro",
    agent: "Codex and Claude placeholders",
    phase: "browser-auth-and-final-review",
    heartbeat_at: "not wired in slice 1",
    stop_path: "stay read-only until browser auth and collector approvals exist",
    next_safe_action: "Show as placeholder until workers/state or an approved collector emits live proof.",
  },
];

export const proofs: ProofCard[] = [
  {
    title: "Admin control-plane build map exists",
    status: "valid",
    proof_ids: ["proof.handoff.admin-build-map"],
    evidence_uri: "/Users/anipotts/Infra/handoffs/2026-06-23-admin-control-plane-build-map.md",
    redaction: "none",
    summary: "Handoff defines product thesis, core objects, site slice, infra contract slice, and non-goals.",
  },
  {
    title: "Admin contract schemas and samples validate",
    status: "valid",
    proof_ids: ["proof.validator.admin-contract.samples"],
    evidence_uri: "python3 coord/admin/validate_admin_contract.py",
    redaction: "none",
    summary: "Validation parses schemas and samples, rejects undeclared fields, checks enums, and checks duplicate ids.",
  },
  {
    title: "Review automation gate merged",
    status: "valid",
    proof_ids: ["ac41a92da49c70fbecff799b47aca0ebec242980"],
    evidence_uri: "https://github.com/anipotts/anipotts.com/pull/74",
    redaction: "none",
    summary: "PR #74 merged after CI, security, Claude review, and CodeRabbit were green.",
  },
];

export const repos: RepoCard[] = [
  {
    repo: "anipotts-com",
    path: "/Users/anipotts/Code/projects/anipotts-com",
    branch: "codex/admin-control-plane-shell-2026-06-23",
    dirty_tracked: ["apps/admin-solid"],
    untracked_count: 7,
    deploy_impact: "none",
    status: "running",
    next_safe_action: "Finish local validation, commit the admin-only branch, and open a draft PR.",
    proof_ids: ["op.site.admin-shell.local-build"],
  },
  {
    repo: "Infra",
    path: "/Users/anipotts/Infra",
    branch: "main",
    dirty_tracked: [],
    untracked_count: 1,
    deploy_impact: "none",
    status: "verified",
    next_safe_action: "Use coord/admin samples as the local mock source for site slice 1.",
    proof_ids: ["b5fcc37"],
  },
  {
    repo: "vitals/health",
    path: "/Users/anipotts/Code/projects/vitals",
    branch: "runtime tree",
    dirty_tracked: [],
    untracked_count: 0,
    deploy_impact: "unknown",
    status: "blocked",
    next_safe_action: "Do not use for live admin heartbeat until chief/infra approves collector work.",
    proof_ids: ["block.admin.live-collectors-not-yet-approved"],
  },
];

export const handoffs: HandoffCard[] = [
  {
    title: "admin control plane build map",
    path: "/Users/anipotts/Infra/handoffs/2026-06-23-admin-control-plane-build-map.md",
    freshness: "current",
    absorbed_at: null,
    target_owner: "chief/site and chief/infra",
    status: "partially_absorbed",
    next_safe_action: "chief/site binds UI shell to matching sample ids, then reports exact checks.",
    proof_ids: ["proof.handoff.admin-build-map"],
  },
  {
    title: "fleet control plane goal",
    path: "/Users/anipotts/Infra/handoffs/2026-06-23-fleet-control-plane-goal.md",
    freshness: "current",
    absorbed_at: "2026-06-23T23:40:00Z",
    target_owner: "chief/site",
    status: "absorbed",
    next_safe_action: "Keep the product question visible on every route.",
    proof_ids: ["fleet-control-plane-goal-absorbed-2026-06-23"],
  },
  {
    title: "Rudy and kpanil account deletion closeout",
    path: "/Users/anipotts/Infra/handoffs/2026-06-23-rudy-kpanil-account-deletion-closeout.md",
    freshness: "current",
    absorbed_at: "2026-06-24T02:43:15Z",
    target_owner: "chief/infra",
    status: "verified",
    next_safe_action: "Display as completed destructive proof, with no new cleanup action unless fresh proof appears.",
    proof_ids: ["rudy-kpanil-account-deletion-closeout-2026-06-23"],
  },
  {
    title: "Live collector approval",
    path: "/Users/anipotts/Infra/coord/admin/source-map.md",
    freshness: "stale",
    absorbed_at: null,
    target_owner: "chief/infra",
    status: "blocked",
    next_safe_action: "Request separate approval before adding collectors or worker live feeds.",
    proof_ids: ["block.admin.live-collectors-not-yet-approved"],
  },
];

export const destructiveGates: DestructiveGate[] = [
  {
    area: "delete",
    title: "Delete source or local state",
    status: "destructive",
    risk_level: "critical",
    next_safe_action: "Require item-level approval, archive proof, checksum proof, and rollback note.",
    intent: "remove stale source or local state",
    authority_state: "explicit_approval_required",
    operation_summary: "archive, checksum, then delete",
    proof_ids: ["proof.delete.required"],
    required_approval_ids: ["approval.delete.item.required"],
    allowed_actions: ["read manifests", "prepare rollback packet"],
    forbidden_actions: ["delete files", "archive worktrees", "hide source"],
    evidence_uri: "pending approved cleanup packet",
    redaction: "metadata_only",
    summary: "No delete operation may run from this UI slice.",
  },
  {
    area: "auth",
    title: "Change access or account connection",
    status: "destructive",
    risk_level: "critical",
    next_safe_action: "Require exact auth approval and before/after policy proof.",
    intent: "change access or account connection",
    authority_state: "explicit_approval_required",
    operation_summary: "modify auth provider, session, or access policy",
    proof_ids: ["proof.auth.required"],
    required_approval_ids: ["approval.auth.required"],
    allowed_actions: ["read approved policy names", "prepare diff summary"],
    forbidden_actions: ["connect accounts", "change access policies", "rotate sessions"],
    evidence_uri: "pending approved auth packet",
    redaction: "metadata_only",
    summary: "Auth changes stay outside the read-only admin shell.",
  },
  {
    area: "secrets",
    title: "Change tokens or env values",
    status: "destructive",
    risk_level: "critical",
    next_safe_action: "Show secret names only and require separate env or secret approval.",
    intent: "change tokens or env values",
    authority_state: "explicit_approval_required",
    operation_summary: "rotate, set, or copy secret material",
    proof_ids: ["proof.secrets.required"],
    required_approval_ids: ["approval.secrets.required"],
    allowed_actions: ["verify secret presence without values"],
    forbidden_actions: ["print values", "copy values", "mutate env"],
    evidence_uri: "pending approved secret packet",
    redaction: "secret_value_omitted",
    summary: "Secret values are never part of admin feed samples.",
  },
  {
    area: "dns",
    title: "Change live route ownership",
    status: "destructive",
    risk_level: "critical",
    next_safe_action: "Require DNS approval, propagation plan, and rollback record.",
    intent: "change live route ownership",
    authority_state: "explicit_approval_required",
    operation_summary: "edit record, route, custom domain, or tunnel hostname",
    proof_ids: ["proof.dns.required"],
    required_approval_ids: ["approval.dns.required"],
    allowed_actions: ["read DNS target metadata"],
    forbidden_actions: ["edit DNS", "change tunnel hostname", "mutate custom domains"],
    evidence_uri: "pending approved DNS packet",
    redaction: "metadata_only",
    summary: "DNS is visible as a gate, not as a control.",
  },
  {
    area: "deploy",
    title: "Publish admin or public site",
    status: "destructive",
    risk_level: "high",
    next_safe_action: "Keep admin PR draft until Ani approves admin live deployment.",
    intent: "publish admin or public site",
    authority_state: "explicit_approval_required",
    operation_summary: "merge branch or dispatch deployment",
    proof_ids: ["proof.deploy.required"],
    required_approval_ids: ["approval.deploy.required"],
    allowed_actions: ["draft PR prep", "local build", "preview planning"],
    forbidden_actions: ["merge admin PR", "deploy worker", "dispatch production deploy"],
    evidence_uri: "pending approved deploy packet",
    redaction: "none",
    summary: "Deploy impact is none until merge or deploy is explicitly approved.",
  },
  {
    area: "payment",
    title: "Pay, invoice, or file revenue state",
    status: "destructive",
    risk_level: "critical",
    next_safe_action: "Route to Business with private-payload proof rules.",
    intent: "pay, invoice, or file revenue state",
    authority_state: "explicit_approval_required",
    operation_summary: "submit payment, mark paid, or file external state",
    proof_ids: ["proof.payment.required"],
    required_approval_ids: ["approval.payment.required"],
    allowed_actions: ["show metadata-only blockers"],
    forbidden_actions: ["pay", "invoice", "file", "print private payloads"],
    evidence_uri: "pending approved Business packet",
    redaction: "private_payload_omitted",
    summary: "Finance and filing actions remain display-only in admin.",
  },
  {
    area: "account",
    title: "Change user, machine, or external account state",
    status: "destructive",
    risk_level: "critical",
    next_safe_action: "Require account-specific approval and closeout proof.",
    intent: "change user, machine, or external account state",
    authority_state: "explicit_approval_required",
    operation_summary: "create, hide, delete, connect, or disconnect account",
    proof_ids: ["proof.account.required"],
    required_approval_ids: ["approval.account.required"],
    allowed_actions: ["read closeout handoff metadata"],
    forbidden_actions: ["create accounts", "delete accounts", "connect accounts"],
    evidence_uri: "pending approved account packet",
    redaction: "metadata_only",
    summary: "Account mutation requires its own approval and proof packet.",
  },
];
