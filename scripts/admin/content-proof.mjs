#!/usr/bin/env node

import { execFileSync } from "node:child_process";

const ADMIN_ORIGIN =
  process.env.ADMIN_ORIGIN?.replace(/\/$/, "") ?? "https://admin.anipotts.com";
const WWW_ORIGIN =
  process.env.WWW_ORIGIN?.replace(/\/$/, "") ?? "https://anipotts.com";
const D1_DATABASE = process.env.ADMIN_D1_DATABASE ?? "anipotts-db";

const REQUIRED_PAGE_KEYS = [
  "home",
  "making",
  "newsletter",
  "newsletter_archive",
  "orchestrating",
  "projects",
  "writing",
];
const LISTING_PAGE_PROOF = {
  making: { heroLink: false, search: false },
  newsletter_archive: { heroLink: false, search: false, sectionLabel: true },
  orchestrating: {
    heroLink: false,
    search: false,
    sectionLabel: true,
    panel: true,
  },
  projects: { heroLink: true, search: false },
  writing: { heroLink: false, search: true },
};
const REQUIRED_OPERATIONS = [
  "content-draft-homepage-summary-2026-06-28",
  "content-draft-newsletter-copy-2026-06-28",
  "content-draft-project-card-fields-2026-06-28",
  "content-draft-writing-newsletter-backfill-2026-06-28",
  "content-draft-making-index-copy-2026-06-29",
  "content-draft-projects-index-copy-2026-06-29",
  "content-draft-writing-index-copy-2026-06-29",
  "content-draft-newsletter-archive-copy-2026-06-29",
  "content-draft-orchestrating-hero-copy-2026-06-29",
];
const ADMIN_ROUTES = [
  "/content",
  "/content/review",
  "/content/preview",
  "/content/operations",
  "/proof",
];
const PUBLIC_ROUTES = [
  "/",
  "/newsletter",
  "/newsletter/archive",
  "/making",
  "/orchestrating",
  "/projects",
  "/writing",
];

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
    THEN coalesce(json_array_length(json_extract(content, '$.sections.intro.rich_summary')), 0)
    ELSE NULL
  END AS home_rich_summary_count,
  CASE
    WHEN page_key = 'home'
    THEN coalesce(json_array_length(json_extract(content, '$.sections.about.paragraphs')), 0)
    ELSE NULL
  END AS home_about_paragraph_count,
  CASE
    WHEN page_key = 'home'
    THEN coalesce(json_type(content, '$.sections.about.label'), 'missing')
    ELSE NULL
  END AS home_about_label_type,
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
  CASE
    WHEN page_key = 'home'
    THEN coalesce(json_array_length(json_extract(content, '$.sections.latest_thoughts.writing_slugs')), 0)
    ELSE NULL
  END AS home_writing_slug_count,
  CASE
    WHEN page_key = 'home'
    THEN coalesce((SELECT COUNT(*) FROM json_each(page_content.content, '$.mentions')), 0)
    ELSE NULL
  END AS home_mention_count,
  CASE
    WHEN page_key = 'home'
    THEN json_extract(content, '$.mentions.structuredAi.logoSrc')
    ELSE NULL
  END AS home_structured_ai_logo,
  json_extract(content, '$.headline') AS newsletter_headline,
  coalesce(json_type(content, '$.deck'), 'missing') AS newsletter_deck_type,
  coalesce(json_type(content, '$.cta_label'), 'missing') AS newsletter_cta_label_type,
  coalesce(json_type(content, '$.success_message'), 'missing') AS newsletter_success_message_type,
  coalesce(json_type(content, '$.error_message'), 'missing') AS newsletter_error_message_type,
  coalesce(json_type(content, '$.footer_text'), 'missing') AS newsletter_footer_text_type,
  json_extract(content, '$.buttondown_url') AS newsletter_buttondown_url,
  coalesce(json_type(content, '$.archive_label'), 'missing') AS newsletter_archive_label_type,
  coalesce(json_type(content, '$.archive_copy'), 'missing') AS newsletter_archive_copy_type,
  coalesce(json_type(content, '$.archive_link_label'), 'missing') AS newsletter_archive_link_label_type,
  json_extract(content, '$.archive_url') AS newsletter_archive_url,
  json_extract(content, '$.hero_title') AS listing_hero_title,
  coalesce(json_type(content, '$.description'), 'missing') AS listing_description_type,
  coalesce(json_type(content, '$.hero_summary'), 'missing') AS listing_hero_summary_type,
  coalesce(json_type(content, '$.section_label'), 'missing') AS listing_section_label_type,
  coalesce(json_type(content, '$.panel_label'), 'missing') AS listing_panel_label_type,
  coalesce(json_type(content, '$.panel_copy'), 'missing') AS listing_panel_copy_type,
  coalesce(json_type(content, '$.search_placeholder'), 'missing') AS listing_search_placeholder_type,
  coalesce(json_type(content, '$.hero_link_label'), 'missing') AS listing_hero_link_label_type,
  json_extract(content, '$.hero_link_href') AS listing_hero_link_href
FROM page_content
ORDER BY page_key ASC, version DESC;
`);

const operationRows = runD1(`
SELECT
  operation_id,
  field_path,
  source_ref,
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
const staleOperationSources = operationRows
  .filter((row) =>
    /homeContent|homeMakingSlugs|homeWritingSlugs/.test(String(row.source_ref)),
  )
  .map((row) => String(row.operation_id));
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
const homeRichSummaryCount = Number(
  pageRows.find(
    (row) => String(row.page_key) === "home" && Number(row.published) === 1,
  )?.home_rich_summary_count ?? 0,
);
const homeMakingSlugCount = Number(
  pageRows.find(
    (row) => String(row.page_key) === "home" && Number(row.published) === 1,
  )?.home_making_slug_count ?? 0,
);
const homeAboutParagraphCount = Number(
  pageRows.find(
    (row) => String(row.page_key) === "home" && Number(row.published) === 1,
  )?.home_about_paragraph_count ?? 0,
);
const homeAboutLabelType = String(
  pageRows.find(
    (row) => String(row.page_key) === "home" && Number(row.published) === 1,
  )?.home_about_label_type ?? "missing",
);
const homeWritingSlugCount = Number(
  pageRows.find(
    (row) => String(row.page_key) === "home" && Number(row.published) === 1,
  )?.home_writing_slug_count ?? 0,
);
const homeMentionCount = Number(
  pageRows.find(
    (row) => String(row.page_key) === "home" && Number(row.published) === 1,
  )?.home_mention_count ?? 0,
);
const homeSubheadingType = String(
  pageRows.find(
    (row) => String(row.page_key) === "home" && Number(row.published) === 1,
  )?.home_subheading_type ?? "missing",
);
const newsletterRow = pageRows.find(
  (row) => String(row.page_key) === "newsletter" && Number(row.published) === 1,
);
const newsletterFieldTypes = newsletterProofFieldTypes(newsletterRow);
const missingNewsletterFields = Object.entries(newsletterFieldTypes)
  .filter(([, type]) => type !== "text")
  .map(([field]) => `newsletter_${field}`);
const missingListingFields = Object.entries(LISTING_PAGE_PROOF).flatMap(
  ([pageKey, options]) => {
    const row = pageRows.find(
      (pageRow) =>
        String(pageRow.page_key) === pageKey && Number(pageRow.published) === 1,
    );
    return Object.entries(listingProofFieldTypes(row, options))
      .filter(([, type]) => type !== "text")
      .map(([field]) => `${pageKey}_${field}`);
  },
);

const missingProof = [
  ...missingPageKeys.map((pageKey) => `published_page_content:${pageKey}`),
  ...(homeSubheadingType === "text" ? [] : ["home_intro_subheading"]),
  ...(homeRichSummaryCount === 2 ? [] : ["home_rich_summary"]),
  ...(homeAboutParagraphCount === 2 && homeAboutLabelType === "text"
    ? []
    : ["home_about_section"]),
  ...(homeProofCardCount === 4 ? [] : ["home_proof_cards"]),
  ...(homeMakingSlugCount === 4 ? [] : ["home_making_slugs"]),
  ...(homeWritingSlugCount === 3 ? [] : ["home_writing_slugs"]),
  ...(homeMentionCount === 5 ? [] : ["home_mentions"]),
  ...missingNewsletterFields,
  ...missingListingFields,
  ...missingOperations.map((operationId) => `content_operation:${operationId}`),
  ...staleOperationSources.map(
    (operationId) => `stale_content_operation_source:${operationId}`,
  ),
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
    home_rich_summary_count:
      row.home_rich_summary_count === null ||
      row.home_rich_summary_count === undefined
        ? null
        : Number(row.home_rich_summary_count),
    home_about_paragraph_count:
      row.home_about_paragraph_count === null ||
      row.home_about_paragraph_count === undefined
        ? null
        : Number(row.home_about_paragraph_count),
    home_about_label_type: row.home_about_label_type ?? null,
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
    home_writing_slug_count:
      row.home_writing_slug_count === null ||
      row.home_writing_slug_count === undefined
        ? null
        : Number(row.home_writing_slug_count),
    home_mention_count:
      row.home_mention_count === null || row.home_mention_count === undefined
        ? null
        : Number(row.home_mention_count),
    home_structured_ai_logo: row.home_structured_ai_logo ?? null,
    newsletter_headline: row.newsletter_headline ?? null,
    newsletter_field_types:
      String(row.page_key) === "newsletter"
        ? newsletterProofFieldTypes(row)
        : null,
    listing_hero_title:
      String(row.page_key) in LISTING_PAGE_PROOF
        ? (row.listing_hero_title ?? null)
        : null,
    listing_field_types:
      String(row.page_key) in LISTING_PAGE_PROOF
        ? listingProofFieldTypes(row, LISTING_PAGE_PROOF[String(row.page_key)])
        : null,
  })),
  content_draft_operations: operationRows.map((row) => ({
    operation_id: String(row.operation_id),
    field_path: String(row.field_path),
    source_ref: String(row.source_ref),
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
    (contentCounts.content_draft_operations ?? 0) >= REQUIRED_OPERATIONS.length,
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

function newsletterProofFieldTypes(row) {
  return {
    headline:
      typeof row?.newsletter_headline === "string" &&
      row.newsletter_headline.trim().length > 0
        ? "text"
        : "missing",
    deck: String(row?.newsletter_deck_type ?? "missing"),
    cta_label: String(row?.newsletter_cta_label_type ?? "missing"),
    success_message: String(row?.newsletter_success_message_type ?? "missing"),
    error_message: String(row?.newsletter_error_message_type ?? "missing"),
    footer_text: String(row?.newsletter_footer_text_type ?? "missing"),
    buttondown_url:
      typeof row?.newsletter_buttondown_url === "string" &&
      row.newsletter_buttondown_url.startsWith("https://")
        ? "text"
        : "missing",
    archive_label: String(row?.newsletter_archive_label_type ?? "missing"),
    archive_copy: String(row?.newsletter_archive_copy_type ?? "missing"),
    archive_link_label: String(
      row?.newsletter_archive_link_label_type ?? "missing",
    ),
    archive_url:
      typeof row?.newsletter_archive_url === "string" &&
      isSafeProofHref(row.newsletter_archive_url)
        ? "text"
        : "missing",
  };
}

function listingProofFieldTypes(row, options) {
  const fields = {
    hero_title:
      typeof row?.listing_hero_title === "string" &&
      row.listing_hero_title.trim().length > 0
        ? "text"
        : "missing",
    description: String(row?.listing_description_type ?? "missing"),
    hero_summary: String(row?.listing_hero_summary_type ?? "missing"),
  };

  if (options.search) {
    fields.search_placeholder = String(
      row?.listing_search_placeholder_type ?? "missing",
    );
  }

  if (options.sectionLabel) {
    fields.section_label = String(row?.listing_section_label_type ?? "missing");
  }

  if (options.panel) {
    fields.panel_label = String(row?.listing_panel_label_type ?? "missing");
    fields.panel_copy = String(row?.listing_panel_copy_type ?? "missing");
  }

  if (options.heroLink) {
    fields.hero_link_label = String(
      row?.listing_hero_link_label_type ?? "missing",
    );
    fields.hero_link_href =
      typeof row?.listing_hero_link_href === "string" &&
      isSafeProofHref(row.listing_hero_link_href)
        ? "text"
        : "missing";
  }

  return fields;
}

function isSafeProofHref(href) {
  if (href.startsWith("/")) return !href.startsWith("//");
  return href.startsWith("https://") || href.startsWith("mailto:");
}
