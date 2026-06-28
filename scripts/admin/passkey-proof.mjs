#!/usr/bin/env node

import { execFileSync } from "node:child_process";

const ADMIN_ORIGIN =
  process.env.ADMIN_ORIGIN?.replace(/\/$/, "") ?? "https://admin.anipotts.com";
const D1_DATABASE = process.env.ADMIN_D1_DATABASE ?? "anipotts-db";
const ROUTES = [
  "/auth/passkey",
  "/",
  "/content",
  "/content/review",
  "/content/preview",
  "/content/operations",
  "/needs-ani",
  "/newsletter",
  "/newsletter/first-thing-agents-need-control-plane",
  "/proof",
  "/repos",
  "/handoffs",
  "/fleet",
  "/mutations",
  "/ops/destructive",
];

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
WHERE revoked_at IS NULL AND expires_at > datetime('now')
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

const expectedTables = [
  "admin_passkey_audit",
  "admin_passkey_challenges",
  "admin_passkey_credentials",
  "admin_passkey_sessions",
];

const tables = runD1(tableSql).map((row) => String(row.name));
const counts = Object.fromEntries(
  runD1(countSql).map((row) => [String(row.table_name), Number(row.count)]),
);
const auditEvents = Object.fromEntries(
  runD1(auditSql).map((row) => [String(row.event_type), Number(row.count)]),
);
const routes = await Promise.all(ROUTES.map(probeRoute));

const schemaReady = expectedTables.every((table) => tables.includes(table));
const credentialCount = counts.credentials ?? 0;
const sessionCount = counts.sessions ?? 0;
const auditCount = counts.audit ?? 0;
const routeBoundary = summarizeBoundary(routes);

const proof = {
  checked_at: new Date().toISOString(),
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
  routes,
  route_boundary: routeBoundary,
  next_safe_action: nextSafeAction({
    schemaReady,
    credentialCount,
    sessionCount,
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
      cwd: new URL("../../", import.meta.url),
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

function nextSafeAction({
  schemaReady,
  credentialCount,
  sessionCount,
  routeBoundary,
}) {
  if (!schemaReady) {
    return "apply drizzle/migrations/0006_admin_passkeys.sql before enrollment";
  }
  if (credentialCount === 0) {
    return "open /auth/passkey behind Cloudflare Access and register the first platform passkey";
  }
  if (sessionCount === 0) {
    return "authenticate with the registered passkey and prove a durable app-native session";
  }
  if (routeBoundary === "cloudflare_access") {
    return "prove logout and failure paths, then remove Cloudflare Access and rerun this proof";
  }
  if (routeBoundary === "app_native_passkey") {
    return "record app-native unauthenticated block and authenticated route render proof";
  }
  return "inspect route boundary before changing Access";
}
