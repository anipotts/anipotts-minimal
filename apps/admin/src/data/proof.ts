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

type D1PreparedStatement = {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(): Promise<T | null>;
  all<T = unknown>(): Promise<{ results?: T[] }>;
};

export type ProofD1Database = {
  prepare(query: string): D1PreparedStatement;
};

export const proofSource = {
  mode: "read_only_d1_plus_runtime_metadata",
  generated_from:
    "admin_proof_events, route probes, PR state, and read-only D1 metadata",
  live_writes: "disabled",
};

const baseProofEntries: ProofEntry[] = [
  {
    id: "proof.admin.agent-deploy-scope",
    kind: "deploy",
    status: "verified",
    title: "agent admin deploys stay scoped",
    summary:
      "Recent admin content platform PRs deployed the Astro admin target only. Www, admin-solid, ingest, newsletter, weekly-email, and state workers were skipped.",
    evidence_uri:
      "https://github.com/anipotts/anipotts.com/actions/workflows/deploy.yml",
    redaction: "public_metadata",
    next_safe_action:
      "Keep deploy proof attached to admin route-level changes until proof rows move into D1.",
  },
  {
    id: "proof.site.public-routes",
    kind: "route",
    status: "verified",
    title: "public content routes answer",
    summary:
      "Live public route probes have returned 200 for the current Astro site routes, while admin remains separately protected.",
    evidence_uri: "https://anipotts.com",
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
      "Unauthenticated admin probes return 302 to Cloudflare Access while app-native passkey proof is incomplete.",
    evidence_uri: "https://admin.anipotts.com/auth/passkey",
    redaction: "protected_route",
    next_safe_action:
      "After passkey enrollment, prove app-native login and then remove Cloudflare Access.",
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

const requiredPasskeyAuditEvents = [
  "passkey.credential.registered",
  "passkey.session.created",
  "passkey.session.revoked",
  "passkey.credential.revoked",
  "passkey.authentication.denied",
] as const;

type ProofEventRow = {
  id: string;
  kind: string;
  status: string;
  title: string;
  summary: string;
  evidence_uri: string;
  redaction: string;
  next_safe_action: string;
};

export async function readProofEntries(
  db: ProofD1Database | null | undefined,
): Promise<ProofEntry[]> {
  const durableProofEntries = await readDurableProofEntries(db);
  return [
    ...(durableProofEntries.length > 0
      ? durableProofEntries
      : baseProofEntries),
    await readContentOperationProof(db),
    await readPasskeyProof(db),
  ];
}

export function countProofEntries(entries: ProofEntry[]) {
  return {
    total: entries.length,
    verified: entries.filter((entry) => entry.status === "verified").length,
    blocked: entries.filter((entry) => entry.status === "blocked").length,
    pending: entries.filter((entry) => entry.status === "pending").length,
  };
}

async function readContentOperationProof(
  db: ProofD1Database | null | undefined,
): Promise<ProofEntry> {
  if (!db) {
    return {
      id: "proof.content-operation.d1",
      kind: "gate",
      status: "pending",
      title: "content operation D1 metadata unavailable",
      summary:
        "The admin runtime did not expose a D1 binding, so proof falls back to static metadata.",
      evidence_uri: "D1 anipotts-db",
      redaction: "metadata_only",
      next_safe_action:
        "Deploy admin with DB binding before relying on D1-backed proof.",
    };
  }

  try {
    const [publishedPages, records, drafts, events] = await Promise.all([
      countRows(db, "page_content", "WHERE published = 1"),
      countRows(db, "content_records"),
      countRows(db, "content_draft_operations"),
      countRows(db, "content_publish_events"),
    ]);
    return {
      id: "proof.content-operation.d1",
      kind: "repo",
      status:
        publishedPages > 0 && drafts > 0 && events === 0
          ? "verified"
          : "pending",
      title: "content state is D1-backed and writes remain inert",
      summary: `published_page_content=${publishedPages}, content_records=${records}, content_draft_operations=${drafts}, content_publish_events=${events}. Newsletter copy can render from page_content while draft operation rows remain review-only.`,
      evidence_uri: "D1 anipotts-db page_content and content operation tables",
      redaction: "metadata_only",
      next_safe_action:
        events === 0
          ? "Seed more public content into page_content before adding an audited write route."
          : "Review publish events before enabling more content writes.",
    };
  } catch (error) {
    return {
      id: "proof.content-operation.d1",
      kind: "gate",
      status: "blocked",
      title: "content operation D1 read failed",
      summary:
        error instanceof Error ? error.message : "unknown D1 read failure",
      evidence_uri: "D1 anipotts-db page_content and content operation tables",
      redaction: "metadata_only",
      next_safe_action:
        "Fix D1 schema or binding before relying on content operation proof.",
    };
  }
}

async function readDurableProofEntries(
  db: ProofD1Database | null | undefined,
): Promise<ProofEntry[]> {
  if (!db) return [];

  try {
    const result = await db
      .prepare(
        `SELECT
           id,
           kind,
           status,
           title,
           summary,
           evidence_uri,
           redaction,
           next_safe_action
         FROM admin_proof_events
         ORDER BY updated_at DESC, id ASC
         LIMIT 50`,
      )
      .all<ProofEventRow>();
    return (result.results ?? []).map(proofEntryFromRow);
  } catch {
    return [];
  }
}

async function readPasskeyProof(
  db: ProofD1Database | null | undefined,
): Promise<ProofEntry> {
  if (!db) {
    return {
      id: "proof.admin.passkey-enrollment",
      kind: "gate",
      status: "blocked",
      title: "passkey proof unavailable",
      summary:
        "The admin runtime did not expose a D1 binding, so passkey credential and session counts cannot be checked.",
      evidence_uri: "D1 anipotts-db admin passkey tables",
      redaction: "metadata_only",
      next_safe_action:
        "Deploy admin with DB binding before passkey proof can complete.",
    };
  }

  try {
    const now = new Date().toISOString();
    const [credentials, sessions, ...auditEventCounts] = await Promise.all([
      countRows(db, "admin_passkey_credentials", "WHERE revoked_at IS NULL"),
      countRows(
        db,
        "admin_passkey_sessions",
        "WHERE revoked_at IS NULL AND expires_at > ?",
        [now],
      ),
      ...requiredPasskeyAuditEvents.map((eventType) =>
        countRows(db, "admin_passkey_audit", "WHERE event_type = ?", [
          eventType,
        ]),
      ),
    ]);
    const auditSummary = requiredPasskeyAuditEvents.map(
      (eventType, index) => `${eventType}=${auditEventCounts[index] ?? 0}`,
    );
    const missingAuditEvents = requiredPasskeyAuditEvents.filter(
      (_eventType, index) => (auditEventCounts[index] ?? 0) === 0,
    );
    const proven =
      credentials > 0 && sessions > 0 && missingAuditEvents.length === 0;
    return {
      id: "proof.admin.passkey-enrollment",
      kind: "gate",
      status: proven ? "verified" : "blocked",
      title: proven
        ? "passkey removal checklist is D1-backed"
        : "passkey removal checklist is incomplete",
      summary: `active_credentials=${credentials}, active_sessions=${sessions}, ${auditSummary.join(", ")}. Cloudflare Access removal waits for register, login, logout, persistence, and revoked-credential denial proof.`,
      evidence_uri: "D1 anipotts-db admin passkey tables",
      redaction: "metadata_only",
      next_safe_action: proven
        ? "Run route-boundary proof, then remove Cloudflare Access and prove app-native blocking."
        : nextPasskeyProofAction(credentials, sessions, missingAuditEvents),
    };
  } catch (error) {
    return {
      id: "proof.admin.passkey-enrollment",
      kind: "gate",
      status: "blocked",
      title: "passkey proof D1 read failed",
      summary:
        error instanceof Error ? error.message : "unknown D1 read failure",
      evidence_uri: "D1 anipotts-db admin passkey tables",
      redaction: "metadata_only",
      next_safe_action:
        "Fix passkey schema or binding before Access removal proof.",
    };
  }
}

async function countRows(
  db: ProofD1Database,
  table: string,
  clause = "",
  binds: unknown[] = [],
): Promise<number> {
  const row = await db
    .prepare(`SELECT COUNT(*) AS count FROM ${table} ${clause}`)
    .bind(...binds)
    .first<{ count: number }>();
  return Number(row?.count ?? 0);
}

function proofEntryFromRow(row: ProofEventRow): ProofEntry {
  return {
    id: row.id,
    kind: parseProofKind(row.kind),
    status: parseProofStatus(row.status),
    title: row.title,
    summary: row.summary,
    evidence_uri: row.evidence_uri,
    redaction: parseRedaction(row.redaction),
    next_safe_action: row.next_safe_action,
  };
}

function nextPasskeyProofAction(
  credentials: number,
  sessions: number,
  missingAuditEvents: readonly string[],
): string {
  if (credentials === 0) {
    return "Register the first passkey behind Cloudflare Access.";
  }
  if (sessions === 0) {
    return "Authenticate with the registered passkey and prove a durable session.";
  }
  if (missingAuditEvents.includes("passkey.session.revoked")) {
    return "Logout once to record revocation, then authenticate again before Access removal.";
  }
  if (missingAuditEvents.includes("passkey.credential.revoked")) {
    return "Revoke the current passkey while Cloudflare Access remains active, then register a replacement.";
  }
  if (missingAuditEvents.includes("passkey.authentication.denied")) {
    return "Record revoked-credential denial proof while Cloudflare Access remains active.";
  }
  return `Record missing audit proof: ${missingAuditEvents.join(", ")}.`;
}

function parseProofKind(kind: string): ProofKind {
  if (
    kind === "deploy" ||
    kind === "route" ||
    kind === "auth" ||
    kind === "repo" ||
    kind === "gate"
  ) {
    return kind;
  }
  return "gate";
}

function parseProofStatus(status: string): ProofStatus {
  if (status === "verified" || status === "blocked" || status === "pending") {
    return status;
  }
  return "pending";
}

function parseRedaction(value: string): ProofEntry["redaction"] {
  if (
    value === "public_metadata" ||
    value === "metadata_only" ||
    value === "protected_route"
  ) {
    return value;
  }
  return "metadata_only";
}
