#!/usr/bin/env node

import { execFileSync } from "node:child_process";

const REPO_ROOT = new URL("../../", import.meta.url);
execFileSync("pnpm", ["--filter", "@anipotts/content", "build"], {
  cwd: REPO_ROOT,
  stdio: "ignore",
});
const {
  expectedPasskeyTables,
  manualPasskeyEnrollmentSequence,
  missingRequiredPasskeyAuditEvents,
  nextPasskeyProofAction,
  passkeyAccessRemovalBlockers,
  passkeyMissingProofItems,
  REQUIRED_PASSKEY_AUDIT_EVENTS,
} = await import(
  new URL("../../packages/content/dist/admin/index.js", import.meta.url).href
);

const ADMIN_ORIGIN =
  process.env.ADMIN_ORIGIN?.replace(/\/$/, "") ?? "https://admin.anipotts.com";
const D1_DATABASE = process.env.ADMIN_D1_DATABASE ?? "anipotts-db";
const ROUTES = [
  "/auth/passkey",
  "/",
  "/content",
  "/content/review",
  "/content/drafts",
  "/content/edit/home",
  "/api/admin/content/draft-operation",
  "/content/preview",
  "/content/operations",
  "/needs-ani",
  "/newsletter",
  "/newsletter/first-thing-agents-need-control-plane",
  "/proof",
  "/deploys",
  "/repos",
  "/handoffs",
  "/fleet",
  "/mutations",
  "/ops/destructive",
];

const checkedAt = new Date().toISOString();

const tableSql = `
SELECT name
FROM sqlite_master
WHERE type='table' AND name LIKE 'admin_passkey_%'
ORDER BY name;
`;

const countSql = `
SELECT 'credentials' AS table_name, COUNT(*) AS count
FROM admin_passkey_credentials
WHERE revoked_at IS NULL
UNION ALL
SELECT 'sessions', COUNT(*)
FROM admin_passkey_sessions
WHERE revoked_at IS NULL AND expires_at > '${checkedAt}'
UNION ALL
SELECT 'audit', COUNT(*)
FROM admin_passkey_audit;
`;

const auditSql = `
SELECT event_type, COUNT(*) AS count
FROM admin_passkey_audit
GROUP BY event_type
ORDER BY event_type;
`;

const tables = runD1(tableSql).map((row) => String(row.name));
const counts = Object.fromEntries(
  runD1(countSql).map((row) => [String(row.table_name), Number(row.count)]),
);
const auditEvents = Object.fromEntries(
  runD1(auditSql).map((row) => [String(row.event_type), Number(row.count)]),
);
const routes = await Promise.all(ROUTES.map(probeRoute));

const schemaReady = expectedPasskeyTables.every((table) =>
  tables.includes(table),
);
const credentialCount = counts.credentials ?? 0;
const sessionCount = counts.sessions ?? 0;
const auditCount = counts.audit ?? 0;
const routeBoundary = summarizeBoundary(routes);
const missingAuditEvents = missingRequiredPasskeyAuditEvents(auditEvents);
const removalBlockers = passkeyAccessRemovalBlockers({
  schemaReady,
  credentialCount,
  sessionCount,
  auditEvents,
});
const cloudflareAccessStillActive = routeBoundary === "cloudflare_access";
const appNativeRouteBoundaryReady = routeBoundary === "app_native_passkey";
const missingProof = passkeyMissingProofItems({
  accessRemovalBlockers: removalBlockers,
  routeBoundary,
});

const proof = {
  checked_at: checkedAt,
  admin_origin: ADMIN_ORIGIN,
  d1_database: D1_DATABASE,
  schema_ready: schemaReady,
  tables,
  counts: {
    active_credentials: credentialCount,
    active_sessions: sessionCount,
    audit_events: auditCount,
  },
  audit_events: auditEvents,
  required_audit_events: Object.fromEntries(
    REQUIRED_PASSKEY_AUDIT_EVENTS.map((eventType) => [
      eventType,
      Number(auditEvents[eventType] ?? 0),
    ]),
  ),
  access_removal_blockers: removalBlockers,
  cloudflare_access_still_active: cloudflareAccessStillActive,
  missing_proof: missingProof,
  ready_for_access_removal:
    removalBlockers.length === 0 && cloudflareAccessStillActive,
  post_access_removal_verified:
    removalBlockers.length === 0 && appNativeRouteBoundaryReady,
  manual_enrollment: {
    url: `${ADMIN_ORIGIN}/auth/passkey`,
    requires_browser_passkey_prompt: removalBlockers.length > 0,
    sequence: manualPasskeyEnrollmentSequence,
  },
  routes,
  route_boundary: routeBoundary,
  next_safe_action: nextPasskeyProofAction({
    schemaReady,
    credentialCount,
    sessionCount,
    missingAuditEvents,
    routeBoundary,
  }),
};

console.log(JSON.stringify(proof, null, 2));

function runD1(command) {
  const output = execFileSync(
    "pnpm",
    [
      "exec",
      "wrangler",
      "d1",
      "execute",
      D1_DATABASE,
      "--remote",
      "--json",
      "--command",
      command,
    ],
    {
      cwd: REPO_ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  const payload = JSON.parse(output);
  const firstResult = payload[0];
  if (!firstResult?.success) {
    throw new Error(`D1 proof query failed for ${D1_DATABASE}`);
  }
  return firstResult.results ?? [];
}

async function probeRoute(path) {
  const response = await fetch(`${ADMIN_ORIGIN}${path}`, {
    method: "HEAD",
    redirect: "manual",
  });
  const location = response.headers.get("location");
  return {
    path,
    status: response.status,
    boundary: classifyBoundary(location),
    location: safeLocation(location),
  };
}

function classifyBoundary(location) {
  if (!location) return "rendered_or_blocked_without_location";
  if (location.startsWith("/auth/passkey")) return "app_native_passkey";
  try {
    const url = new URL(location);
    if (url.hostname.endsWith("cloudflareaccess.com")) {
      return "cloudflare_access";
    }
    if (url.pathname.startsWith("/auth/passkey")) {
      return "app_native_passkey";
    }
    return "external_redirect";
  } catch {
    return "unknown_redirect";
  }
}

function safeLocation(location) {
  if (!location) return null;
  if (location.startsWith("/")) return location;
  try {
    const url = new URL(location);
    return `${url.origin}${url.pathname}`;
  } catch {
    return "unparseable";
  }
}

function summarizeBoundary(routes) {
  const boundaries = new Set(routes.map((route) => route.boundary));
  if (boundaries.has("cloudflare_access")) return "cloudflare_access";
  if (boundaries.has("app_native_passkey")) return "app_native_passkey";
  return "unknown";
}
