export type ProofStatus = "verified" | "blocked" | "pending";
export type ProofKind = "deploy" | "route" | "auth" | "repo" | "gate";

export type ProofEntry = {
  id: string;
  kind: ProofKind;
  status: ProofStatus;
  title: string;
  summary: string;
  evidence_uri: string;
  redaction: "public_metadata" | "metadata_only" | "protected_route";
  next_safe_action: string;
};

export const proofSource = {
  mode: "read_only_static_proof_log",
  generated_from:
    "GitHub runs, route probes, PR state, and D1-safe passkey metadata",
  live_writes: "disabled",
};

export const proofEntries: ProofEntry[] = [
  {
    id: "proof.admin.pr131.deploy",
    kind: "deploy",
    status: "verified",
    title: "PR #131 deployed admin only",
    summary:
      "Deploy run 28334470855 completed for admin. Www, admin-solid, ingest, newsletter, weekly-email, and state workers were skipped.",
    evidence_uri:
      "https://github.com/anipotts/anipotts.com/actions/runs/28334470855",
    redaction: "public_metadata",
    next_safe_action:
      "Keep deploy proof attached to admin route-level changes until proof rows move into D1.",
  },
  {
    id: "proof.site.pr128.deploy",
    kind: "deploy",
    status: "verified",
    title: "PR #128 deployed public site only",
    summary:
      "Deploy run 28334009441 completed for www after removing unused making content collections. Admin, admin-solid, ingest, newsletter, weekly-email, and state workers were skipped.",
    evidence_uri:
      "https://github.com/anipotts/anipotts.com/actions/runs/28334009441",
    redaction: "public_metadata",
    next_safe_action:
      "Keep public cleanup deploys scoped to www until content records replace static source edits.",
  },
  {
    id: "proof.repo.cleanup-prs",
    kind: "repo",
    status: "verified",
    title: "cleanup PRs merged without branch residue",
    summary:
      "PRs #128, #129, #130, and #131 merged through agent automerge. Local main is aligned with origin/main and no open site PRs or agent branches remain.",
    evidence_uri: "https://github.com/anipotts/anipotts.com/pulls",
    redaction: "public_metadata",
    next_safe_action:
      "Continue branch-per-slice work and keep main production-reflective.",
  },
  {
    id: "proof.site.public-routes",
    kind: "route",
    status: "verified",
    title: "public content routes answer",
    summary:
      "Live probes returned 200 for /writing/saturdays-are-for-claude-code and /orchestrating. The legacy /claude path returned 301.",
    evidence_uri: "https://anipotts.com/orchestrating",
    redaction: "public_metadata",
    next_safe_action:
      "Keep public smoke coverage on the stable route set before expanding content from D1.",
  },
  {
    id: "proof.admin.unauth-block",
    kind: "auth",
    status: "verified",
    title: "admin unauthenticated block holds",
    summary:
      "Unauthenticated probes returned 302 for /auth/passkey, /repos, and /api/admin/runtime-feed after PR #131 deployed. Full proof script still reports Cloudflare Access as the outer boundary for protected admin routes.",
    evidence_uri: "https://admin.anipotts.com/auth/passkey",
    redaction: "protected_route",
    next_safe_action:
      "After passkey enrollment, prove app-native login and then remove Cloudflare Access.",
  },
  {
    id: "proof.admin.passkey-enrollment",
    kind: "gate",
    status: "blocked",
    title: "passkey enrollment proof missing",
    summary:
      "Passkey schema exists in D1, but proof on 2026-06-28 showed zero active credentials, zero active sessions, and zero audit events. Access removal remains blocked until registration, login, logout, persistence, and revoked-credential denial are proven.",
    evidence_uri: "pnpm --silent proof:admin-passkey",
    redaction: "metadata_only",
    next_safe_action:
      "Register the first passkey behind Cloudflare Access, then record D1 credential, session, and audit evidence.",
  },
  {
    id: "proof.admin.write-paths",
    kind: "gate",
    status: "pending",
    title: "admin write paths remain inert",
    summary:
      "Content preview, review, operations, mutation, and destructive-operation routes expose no save, publish, send, or live-control endpoint.",
    evidence_uri: "apps/admin/src/pages",
    redaction: "metadata_only",
    next_safe_action:
      "Before adding writes, require audited D1 operation records, rollback, and route proof.",
  },
];

export const proofCounts = {
  total: proofEntries.length,
  verified: proofEntries.filter((entry) => entry.status === "verified").length,
  blocked: proofEntries.filter((entry) => entry.status === "blocked").length,
  pending: proofEntries.filter((entry) => entry.status === "pending").length,
};
