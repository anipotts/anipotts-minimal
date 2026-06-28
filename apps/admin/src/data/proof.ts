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
  generated_from: "GitHub runs, route probes, PR state, and D1-safe metadata",
  live_writes: "disabled",
};

export const proofEntries: ProofEntry[] = [
  {
    id: "proof.site.pr121.deploy",
    kind: "deploy",
    status: "verified",
    title: "PR #121 deployed admin only",
    summary:
      "Deploy run 28305779971 completed for admin. Www, admin-solid, ingest, newsletter, weekly-email, and state workers were skipped.",
    evidence_uri:
      "https://github.com/anipotts/anipotts.com/actions/runs/28305779971",
    redaction: "public_metadata",
    next_safe_action:
      "Keep deploy proof attached to route-level changes until proof rows move into D1.",
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
      "Unauthenticated probes returned 302 for /auth/passkey, /, /content, /content/review, /content/preview, /content/operations, /newsletter, the newsletter detail preview, /needs-ani, /proof, /repos, and /fleet.",
    evidence_uri: "https://admin.anipotts.com/auth/passkey",
    redaction: "protected_route",
    next_safe_action:
      "After passkey enrollment, prove app-native login and then remove Cloudflare Access.",
  },
  {
    id: "proof.repo.open-prs",
    kind: "repo",
    status: "verified",
    title: "no open site PRs",
    summary:
      "GitHub PR list returned no open pull requests after PR #121 merged.",
    evidence_uri: "https://github.com/anipotts/anipotts.com/pulls",
    redaction: "public_metadata",
    next_safe_action:
      "Continue branch-per-slice work with ready PRs as the default.",
  },
  {
    id: "proof.admin.passkey-enrollment",
    kind: "gate",
    status: "blocked",
    title: "passkey enrollment proof missing",
    summary:
      "Access removal remains blocked until biometric passkey registration, login, logout, persistence, and revoked-credential denial are proven.",
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
