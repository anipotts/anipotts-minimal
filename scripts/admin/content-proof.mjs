#!/usr/bin/env node

import { execFileSync } from "node:child_process";

const ADMIN_ORIGIN =
  process.env.ADMIN_ORIGIN?.replace(/\/$/, "") ?? "https://admin.anipotts.com";
const WWW_ORIGIN =
  process.env.WWW_ORIGIN?.replace(/\/$/, "") ?? "https://anipotts.com";
const D1_DATABASE = process.env.ADMIN_D1_DATABASE ?? "anipotts-db";

const REQUIRED_PAGE_KEYS = ["home", "newsletter"];
const REQUIRED_OPERATIONS = [
  "content-draft-homepage-summary-2026-06-28",
  "content-draft-newsletter-copy-2026-06-28",
  "content-draft-project-card-fields-2026-06-28",
  "content-draft-writing-newsletter-backfill-2026-06-28",
];
const ADMIN_ROUTES = [
  "/content",
  "/content/review",
  "/content/preview",
  "/content/operations",
  "/proof",
];
const PUBLIC_ROUTES = ["/", "/newsletter", "/making", "/writing"];

const checkedAt = new Date().toISOString();

const pageRows = runD1(`
SELECT
  page_key,
  version,
  published,
  json_extract(content, '$.sections.intro.heading') AS home_heading,
  coalesce(json_type(content, '$.sections.intro.subheading'), 'missing') AS home_subheading_type,
  CASE
    WHEN page_key = 'home'
    THEN coalesce(json_array_length(json_extract(content, '$.proof_cards')), 0)
    ELSE NULL
  END AS home_proof_card_count,
  CASE
    WHEN page_key = 'home'
    THEN coalesce(json_array_length(json_extract(content, '$.sections.past_work.project_slugs')), 0)
    ELSE NULL
  END AS home_making_slug_count,
  json_extract(content, '$.headline') AS newsletter_headline
FROM page_content
ORDER BY page_key ASC, version DESC;
`);

const operationRows = runD1(`
SELECT
  operation_id,
  field_path,
  status,
  risk_level,
  authority_state
FROM content_draft_operations
ORDER BY operation_id;
`);

const contentCounts = Object.fromEntries(
  runD1(`
SELECT 'page_content' AS table_name, COUNT(*) AS count FROM page_content
UNION ALL
SELECT 'published_page_content', COUNT(*) FROM page_content WHERE published = 1
UNION ALL
SELECT 'content_records', COUNT(*) FROM content_records
UNION ALL
SELECT 'content_draft_operations', COUNT(*) FROM content_draft_operations
UNION ALL
SELECT 'content_publish_events', COUNT(*) FROM content_publish_events;
`).map((row) => [String(row.table_name), Number(row.count)]),
);

const [adminRoutes, publicRoutes] = await Promise.all([
  Promise.all(ADMIN_ROUTES.map((path) => probeRoute(ADMIN_ORIGIN, path))),
  Promise.all(PUBLIC_ROUTES.map((path) => probeRoute(WWW_ORIGIN, path))),
]);

const publishedPageKeys = pageRows
  .filter((row) => Number(row.published) === 1)
  .map((row) => String(row.page_key));
const operationIds = operationRows.map((row) => String(row.operation_id));
const missingPageKeys = REQUIRED_PAGE_KEYS.filter(
  (pageKey) => !publishedPageKeys.includes(pageKey),
);
const missingOperations = REQUIRED_OPERATIONS.filter(
  (operationId) => !operationIds.includes(operationId),
);
const publicRouteFailures = publicRoutes.filter(
  (route) => route.status !== 200,
);
const adminBoundary = summarizeBoundary(adminRoutes);
const publishEvents = contentCounts.content_publish_events ?? 0;
const contentRecords = contentCounts.content_records ?? 0;
const homeProofCardCount = Number(
  pageRows.find(
    (row) => String(row.page_key) === "home" && Number(row.published) === 1,
  )?.home_proof_card_count ?? 0,
);
const homeMakingSlugCount = Number(
  pageRows.find(
    (row) => String(row.page_key) === "home" && Number(row.published) === 1,
  )?.home_making_slug_count ?? 0,
);

const missingProof = [
  ...missingPageKeys.map((pageKey) => `published_page_content:${pageKey}`),
  ...(homeProofCardCount === 4 ? [] : ["home_proof_cards"]),
  ...(homeMakingSlugCount === 4 ? [] : ["home_making_slugs"]),
  ...missingOperations.map((operationId) => `content_operation:${operationId}`),
  ...(publishEvents === 0 ? [] : ["content_publish_events_should_be_empty"]),
  ...(contentRecords === 0 ? [] : ["content_records_should_be_empty"]),
  ...publicRouteFailures.map((route) => `public_route:${route.path}`),
  ...(adminBoundary === "cloudflare_access" ||
  adminBoundary === "app_native_passkey"
    ? []
    : ["admin_route_boundary"]),
];

const proof = {
  checked_at: checkedAt,
  admin_origin: ADMIN_ORIGIN,
  www_origin: WWW_ORIGIN,
  d1_database: D1_DATABASE,
  counts: contentCounts,
  page_content: pageRows.map((row) => ({
    page_key: String(row.page_key),
    version: Number(row.version),
    published: Number(row.published) === 1,
    home_heading: row.home_heading ?? null,
    home_subheading_type: row.home_subheading_type ?? null,
    home_proof_card_count:
      row.home_proof_card_count === null ||
      row.home_proof_card_count === undefined
        ? null
        : Number(row.home_proof_card_count),
    home_making_slug_count:
      row.home_making_slug_count === null ||
      row.home_making_slug_count === undefined
        ? null
        : Number(row.home_making_slug_count),
    newsletter_headline: row.newsletter_headline ?? null,
  })),
  content_draft_operations: operationRows.map((row) => ({
    operation_id: String(row.operation_id),
    field_path: String(row.field_path),
    status: String(row.status),
    risk_level: String(row.risk_level),
    authority_state: String(row.authority_state),
  })),
  admin_routes: adminRoutes,
  public_routes: publicRoutes,
  route_boundary: adminBoundary,
  writes_inert: contentRecords === 0 && publishEvents === 0,
  ready_for_write_path_design:
    missingProof.length === 0 &&
    (contentCounts.content_draft_operations ?? 0) >= 4,
  missing_proof: missingProof,
  next_safe_action:
    missingProof.length === 0
      ? "keep content writes disabled until passkey proof and audited save route design are complete"
      : `resolve missing content proof: ${missingProof.join(", ")}`,
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
    throw new Error(`D1 content proof query failed for ${D1_DATABASE}`);
  }
  return firstResult.results ?? [];
}

async function probeRoute(origin, path) {
  const response = await fetch(`${origin}${path}`, {
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
