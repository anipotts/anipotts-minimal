/**
 * Drizzle ORM schema for anipotts-db (Cloudflare D1 / SQLite).
 *
 * THE canonical schema source. Defines all regular tables that exist in
 * the live database, including rate_limits (created by SQL migration, not
 * auto-created at runtime).
 *
 * Out-of-ORM objects (Drizzle cannot express them) live in the companion
 * migration drizzle/migrations/0003_reconcile.sql:
 *   - thoughts_fts (FTS5 virtual table)
 *   - thoughts_fts_insert / thoughts_fts_delete / thoughts_fts_update triggers
 * Companion migrations are applied manually via `wrangler d1 execute`,
 * never auto-run. See drizzle/README.md.
 */

import {
  sqliteTable,
  text,
  integer,
  index,
  primaryKey,
  real,
} from "drizzle-orm/sqlite-core";

// ---------------------------------------------------------------------------
// 1. thoughts (blog posts / content)
// ---------------------------------------------------------------------------

export const thoughts = sqliteTable(
  "thoughts",
  {
    id: text("id").primaryKey(),
    slug: text("slug").unique().notNull(),
    title: text("title").notNull(),
    summary: text("summary"),
    content: text("content"),
    tags: text("tags").default("[]"),
    created_at: text("created_at"),
    updated_at: text("updated_at"),
    views: integer("views").default(0),
    published: integer("published", { mode: "boolean" }).default(false),
    section: text("section"),

    // content hub fields
    content_type: text("content_type").default("article"),
    series_type: text("series_type"),
    status: text("status").default("draft"),
    artifact_url: text("artifact_url"),
    artifact_type: text("artifact_type"),
    platforms_targeted: text("platforms_targeted").default("[]"),
    platforms_posted: text("platforms_posted").default("[]"),
    voice_mode: text("voice_mode"),
    project: text("project"),
    published_at: text("published_at"),

    // scheduling
    scheduled_at: text("scheduled_at"),

    // distribution IDs (migration 003)
    buttondown_email_id: text("buttondown_email_id"),
    typefully_x_draft_id: text("typefully_x_draft_id"),
    typefully_linkedin_draft_id: text("typefully_linkedin_draft_id"),
  },
  (table) => [
    index("idx_thoughts_slug").on(table.slug),
    index("idx_thoughts_published").on(table.published, table.created_at),
    index("idx_thoughts_status").on(table.status),
    index("idx_thoughts_series_type").on(table.series_type),
    index("idx_thoughts_content_type").on(table.content_type),
    index("idx_thoughts_project").on(table.project),
  ],
);

// ---------------------------------------------------------------------------
// 2. atoms (platform-specific micro-content)
// ---------------------------------------------------------------------------

export const atoms = sqliteTable(
  "atoms",
  {
    id: text("id").primaryKey(),
    content_id: text("content_id").references(() => thoughts.id, {
      onDelete: "cascade",
    }),
    platform: text("platform").notNull(),
    atom_content: text("atom_content").notNull(),
    voice_mode: text("voice_mode"),
    hashtags: text("hashtags").default("[]"),
    status: text("status").default("draft"),
    typefully_draft_id: text("typefully_draft_id"),
    scheduled_at: text("scheduled_at"),
    posted_at: text("posted_at"),
    external_url: text("external_url"),
    created_at: text("created_at"),
    updated_at: text("updated_at"),
  },
  (table) => [
    index("idx_atoms_content_id").on(table.content_id),
    index("idx_atoms_platform").on(table.platform),
    index("idx_atoms_status").on(table.status),
  ],
);

// ---------------------------------------------------------------------------
// 3. projects (portfolio items)
// ---------------------------------------------------------------------------

export const projects = sqliteTable(
  "projects",
  {
    id: text("id").primaryKey(),
    slug: text("slug").unique().notNull(),
    title: text("title").notNull(),
    subtitle: text("subtitle"),
    description: text("description"),
    year: text("year"),
    category: text("category"),
    role: text("role"),
    duration: text("duration"),
    tags: text("tags").default("[]"),
    status: text("status"),
    featured: integer("featured", { mode: "boolean" }).default(false),
    icon: text("icon"),
    image_url: text("image_url"),
    thumbnail_url: text("thumbnail_url"),
    link_live: text("link_live"),
    link_repo: text("link_repo"),
    link_page: text("link_page"),
    sort_order: integer("sort_order").default(0),
    visible: integer("visible", { mode: "boolean" }).default(true),
    created_at: text("created_at"),
    updated_at: text("updated_at"),
  },
  (table) => [
    index("idx_projects_slug").on(table.slug),
    index("idx_projects_visible").on(table.visible, table.sort_order),
  ],
);

// ---------------------------------------------------------------------------
// 4. social_links
// ---------------------------------------------------------------------------

export const socialLinks = sqliteTable("social_links", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  icon: text("icon").notNull(),
  description: text("description"),
  sort_order: integer("sort_order").default(0),
  visible: integer("visible", { mode: "boolean" }).default(true),
  created_at: text("created_at"),
  updated_at: text("updated_at"),
});

// ---------------------------------------------------------------------------
// 5. page_content (CMS pages)
// ---------------------------------------------------------------------------

export const pageContent = sqliteTable(
  "page_content",
  {
    id: text("id").primaryKey(),
    page_key: text("page_key").notNull(),
    content: text("content").notNull(),
    version: integer("version").default(1),
    published: integer("published", { mode: "boolean" }).default(false),
    updated_at: text("updated_at"),
    updated_by: text("updated_by"),
    created_at: text("created_at"),
    version_history: text("version_history").default("[]"),
  },
  (table) => [
    index("idx_page_content_key").on(table.page_key, table.published),
  ],
);

// ---------------------------------------------------------------------------
// 6. site_settings (key-value config)
// ---------------------------------------------------------------------------

export const siteSettings = sqliteTable("site_settings", {
  id: text("id").primaryKey(),
  key: text("key").unique().notNull(),
  value: text("value").notNull(),
  created_at: text("created_at"),
  updated_at: text("updated_at"),
});

// ---------------------------------------------------------------------------
// 7. github_events (webhook storage)
// ---------------------------------------------------------------------------

export const githubEvents = sqliteTable(
  "github_events",
  {
    id: text("id").primaryKey(),
    event_type: text("event_type").notNull(),
    event_action: text("event_action"),
    repo: text("repo").notNull(),
    repo_url: text("repo_url"),
    payload: text("payload").notNull().default("{}"),
    github_delivery_id: text("github_delivery_id").unique(),
    github_timestamp: text("github_timestamp").notNull(),
    created_at: text("created_at"),
  },
  (table) => [
    index("idx_github_events_time").on(table.github_timestamp),
    index("idx_github_events_type").on(
      table.event_type,
      table.github_timestamp,
    ),
  ],
);

// ---------------------------------------------------------------------------
// 8. contact_submissions
// ---------------------------------------------------------------------------

export const contactSubmissions = sqliteTable("contact_submissions", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  message: text("message").notNull(),
  status: text("status").default("new"),
  created_at: text("created_at"),
});

// ---------------------------------------------------------------------------
// 9. content_config (YAML configs as JSON)
// ---------------------------------------------------------------------------

export const contentConfig = sqliteTable("content_config", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updated_at: text("updated_at"),
});

// ---------------------------------------------------------------------------
// 10. content_schedule (editorial calendar)
// ---------------------------------------------------------------------------

export const contentSchedule = sqliteTable(
  "content_schedule",
  {
    id: text("id").primaryKey(),
    content_id: text("content_id").references(() => thoughts.id, {
      onDelete: "set null",
    }),
    title: text("title").notNull(),
    series_type: text("series_type"),
    scheduled_date: text("scheduled_date").notNull(),
    scheduled_time: text("scheduled_time"),
    platform: text("platform"),
    status: text("status").default("planned"),
    notes: text("notes"),
    created_at: text("created_at"),
    updated_at: text("updated_at"),
  },
  (table) => [
    index("idx_content_schedule_date").on(table.scheduled_date),
    index("idx_content_schedule_status").on(table.status),
  ],
);

// ---------------------------------------------------------------------------
// 11. update_alerts (AI update tracking)
// ---------------------------------------------------------------------------

export const updateAlerts = sqliteTable(
  "update_alerts",
  {
    id: text("id").primaryKey(),
    source: text("source").notNull(),
    title: text("title").notNull(),
    url: text("url"),
    detected_at: text("detected_at"),
    content_opportunity_score: text("content_opportunity_score").default(
      "medium",
    ),
    content_id: text("content_id").references(() => thoughts.id, {
      onDelete: "set null",
    }),
    status: text("status").default("new"),
    raw_data: text("raw_data"),
    created_at: text("created_at"),
  },
  (table) => [
    index("idx_update_alerts_status").on(table.status, table.detected_at),
    index("idx_update_alerts_source").on(table.source),
  ],
);

// ---------------------------------------------------------------------------
// 12. metrics_cache (GitHub/WakaTime stats)
// ---------------------------------------------------------------------------

export const metricsCache = sqliteTable("metrics_cache", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updated_at: text("updated_at"),
});

// ---------------------------------------------------------------------------
// 13. status_checks (service monitoring)
// ---------------------------------------------------------------------------

export const statusChecks = sqliteTable(
  "status_checks",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    service_url: text("service_url").notNull(),
    service_name: text("service_name").notNull(),
    status_code: integer("status_code"),
    response_time_ms: integer("response_time_ms").notNull(),
    is_up: integer("is_up", { mode: "boolean" }).notNull(),
    checked_at: text("checked_at").notNull(),
    service_id: text("service_id"),
  },
  (table) => [
    index("idx_status_checks_lookup").on(table.service_url, table.checked_at),
    index("idx_status_checks_service_id").on(
      table.service_id,
      table.checked_at,
    ),
  ],
);

// ---------------------------------------------------------------------------
// 14. favorite_numbers (interactive feature)
// ---------------------------------------------------------------------------

export const favoriteNumbers = sqliteTable("favorite_numbers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  number: integer("number").notNull(),
  submitted_at: text("submitted_at"),
  user_ip: text("user_ip"),
});

// ---------------------------------------------------------------------------
// 15. business_data (YAML data synced from Mac Mini)
// ---------------------------------------------------------------------------

export const businessData = sqliteTable("business_data", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  source_file: text("source_file"),
  updated_at: text("updated_at"),
});

// ---------------------------------------------------------------------------
// 16. analytics_events (granular analytics from all platforms)
// ---------------------------------------------------------------------------

export const analyticsEvents = sqliteTable(
  "analytics_events",
  {
    id: text("id").primaryKey(),
    source: text("source").notNull(),
    metric: text("metric").notNull(),
    value: real("value").notNull(),
    dimensions: text("dimensions").default("{}"),
    period_start: text("period_start").notNull(),
    period_end: text("period_end").notNull(),
    fetched_at: text("fetched_at").notNull(),
  },
  (table) => [
    index("idx_analytics_source").on(
      table.source,
      table.metric,
      table.period_start,
    ),
    index("idx_analytics_period").on(table.period_start, table.period_end),
  ],
);

// ---------------------------------------------------------------------------
// 17. ops_snapshots (Mac Mini health data)
// ---------------------------------------------------------------------------

export const opsSnapshots = sqliteTable(
  "ops_snapshots",
  {
    key: text("key").notNull(),
    category: text("category").notNull(),
    value: text("value").notNull(),
    updated_at: text("updated_at"),
  },
  (table) => [
    primaryKey({ columns: [table.key, table.category] }),
    index("idx_ops_category").on(table.category),
  ],
);

// ---------------------------------------------------------------------------
// 18. code_health (repo status from Mac Mini)
// ---------------------------------------------------------------------------

export const codeHealth = sqliteTable("code_health", {
  repo: text("repo").primaryKey(),
  dirty: integer("dirty", { mode: "boolean" }).default(false),
  unpushed_count: integer("unpushed_count").default(0),
  stale_branches: integer("stale_branches").default(0),
  last_commit_at: text("last_commit_at"),
  last_commit_msg: text("last_commit_msg"),
  deployment_status: text("deployment_status"),
  updated_at: text("updated_at"),
});

// ---------------------------------------------------------------------------
// 19. daily_rollups (historical aggregates from Mini API, hourly push)
// ---------------------------------------------------------------------------

export const dailyRollups = sqliteTable(
  "daily_rollups",
  {
    id: text("id").primaryKey(),
    date: text("date").notNull(),
    hour: integer("hour").notNull(),
    metric: text("metric").notNull(),
    value: real("value").notNull(),
    created_at: text("created_at"),
  },
  (table) => [index("idx_rollups_date").on(table.date, table.metric)],
);

// ---------------------------------------------------------------------------
// 20. email_queue (failed emails for retry)
// ---------------------------------------------------------------------------

export const emailQueue = sqliteTable(
  "email_queue",
  {
    id: text("id").primaryKey(),
    subject: text("subject").notNull(),
    html: text("html").notNull(),
    to_address: text("to_address").notNull(),
    status: text("status").default("pending"),
    attempts: integer("attempts").default(0),
    last_error: text("last_error"),
    created_at: text("created_at"),
    updated_at: text("updated_at"),
  },
  (table) => [index("idx_email_queue_status").on(table.status)],
);

// ---------------------------------------------------------------------------
// 21. service_registry (declarative state for platform-managed services)
// ---------------------------------------------------------------------------
// First table authored via @anipotts/services-platform. Tracks one row per
// service (mini-api, reel, etc.). status_checks.service_id joins here.

export const serviceRegistry = sqliteTable(
  "service_registry",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull().unique(),
    hostname: text("hostname").notNull(),
    visibility: text("visibility").notNull(),
    owner: text("owner").notNull(),
    port: integer("port"),
    manifest_sha: text("manifest_sha"),
    manifest_path: text("manifest_path"),
    deployed_at: text("deployed_at"),
    retired_at: text("retired_at"),
    created_at: text("created_at"),
    updated_at: text("updated_at"),
  },
  (table) => [
    index("idx_service_registry_name").on(table.name),
    index("idx_service_registry_active").on(table.retired_at),
  ],
);

// ---------------------------------------------------------------------------
// 22. brands_emails (Gmail brand-outreach log from email-labeler Apps Script)
// ---------------------------------------------------------------------------
// Replaces Content/logs/brands.yaml. Apps Script POSTs to the ingest worker
// (category "brands_email") on every Brands-labeled email. Dedup on Gmail
// message_id; backfilled rows use synthetic IDs prefixed "bf:".

export const brandsEmails = sqliteTable(
  "brands_emails",
  {
    message_id: text("message_id").primaryKey(), // Gmail ID or "bf:<hash>" for backfill
    thread_id: text("thread_id").notNull(),
    received_at: text("received_at").notNull(), // ISO-8601 from Gmail
    from_addr: text("from_addr").notNull(),
    subject: text("subject").notNull(),
    label: text("label").notNull(), // "Brands", "Brands/Paid", etc.
    deal_slug: text("deal_slug"), // optional link to Content/deals/<slug>/
    status: text("status").default("inbox"), // inbox | responding | won | lost | ghosted
    notes: text("notes"),
    ingested_at: text("ingested_at").notNull(), // auto-set by ingest worker
  },
  (table) => [
    index("idx_brands_emails_received_at").on(table.received_at),
    index("idx_brands_emails_from_addr").on(table.from_addr),
    index("idx_brands_emails_status").on(table.status),
  ],
);

// ---------------------------------------------------------------------------
// 23. rate_limits (sliding-window rate limiting for newsletter subscribe)
// ---------------------------------------------------------------------------
// Created by SQL migration (supabase-era baseline), NOT auto-created at
// runtime. The runtime keeps using raw db.prepare for the sliding window;
// this definition exists so the table is visible in the typed schema.

export const rateLimits = sqliteTable(
  "rate_limits",
  {
    key: text("key").notNull(),
    ts: integer("ts").notNull(),
  },
  (table) => [index("idx_rate_limits_key_ts").on(table.key, table.ts)],
);

// ---------------------------------------------------------------------------
// 24. first-party newsletter system
// ---------------------------------------------------------------------------

export const newsletterSubscribers = sqliteTable(
  "newsletter_subscribers",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull().unique(),
    status: text("status").notNull().default("pending"),
    source: text("source").notNull().default("website"),
    tags: text("tags").notNull().default("[]"),
    metadata: text("metadata").notNull().default("{}"),
    subscribed_at: text("subscribed_at"),
    confirmed_at: text("confirmed_at"),
    unsubscribed_at: text("unsubscribed_at"),
    suppressed_at: text("suppressed_at"),
    suppression_reason: text("suppression_reason"),
    created_at: text("created_at").notNull(),
    updated_at: text("updated_at").notNull(),
  },
  (table) => [
    index("idx_newsletter_subscribers_status").on(table.status),
    index("idx_newsletter_subscribers_email").on(table.email),
  ],
);

export const newsletterPreferences = sqliteTable(
  "newsletter_preferences",
  {
    subscriber_id: text("subscriber_id")
      .notNull()
      .references(() => newsletterSubscribers.id),
    key: text("key").notNull(),
    value: text("value").notNull(),
    updated_at: text("updated_at").notNull(),
  },
  (table) => [primaryKey({ columns: [table.subscriber_id, table.key] })],
);

export const newsletterIssues = sqliteTable(
  "newsletter_issues",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    subject: text("subject").notNull(),
    summary: text("summary"),
    html: text("html"),
    text: text("text"),
    status: text("status").notNull().default("draft"),
    scheduled_at: text("scheduled_at"),
    published_at: text("published_at"),
    source_thought_id: text("source_thought_id"),
    buttondown_id: text("buttondown_id"),
    metadata: text("metadata").notNull().default("{}"),
    created_at: text("created_at").notNull(),
    updated_at: text("updated_at").notNull(),
  },
  (table) => [
    index("idx_newsletter_issues_status").on(table.status, table.scheduled_at),
  ],
);

export const newsletterDeliveries = sqliteTable(
  "newsletter_deliveries",
  {
    id: text("id").primaryKey(),
    issue_id: text("issue_id").references(() => newsletterIssues.id),
    subscriber_id: text("subscriber_id")
      .notNull()
      .references(() => newsletterSubscribers.id),
    email: text("email").notNull(),
    kind: text("kind").notNull(),
    status: text("status").notNull().default("queued"),
    resend_email_id: text("resend_email_id"),
    attempt_count: integer("attempt_count").notNull().default(0),
    last_error: text("last_error"),
    queued_at: text("queued_at").notNull(),
    sent_at: text("sent_at"),
    delivered_at: text("delivered_at"),
    opened_at: text("opened_at"),
    clicked_at: text("clicked_at"),
    bounced_at: text("bounced_at"),
    complained_at: text("complained_at"),
    unsubscribed_at: text("unsubscribed_at"),
    updated_at: text("updated_at").notNull(),
  },
  (table) => [
    index("idx_newsletter_deliveries_issue_status").on(
      table.issue_id,
      table.status,
    ),
    index("idx_newsletter_deliveries_subscriber").on(
      table.subscriber_id,
      table.updated_at,
    ),
    index("idx_newsletter_deliveries_resend_email").on(table.resend_email_id),
  ],
);

export const newsletterEvents = sqliteTable(
  "newsletter_events",
  {
    id: text("id").primaryKey(),
    subscriber_id: text("subscriber_id").references(
      () => newsletterSubscribers.id,
    ),
    issue_id: text("issue_id").references(() => newsletterIssues.id),
    delivery_id: text("delivery_id").references(() => newsletterDeliveries.id),
    email: text("email"),
    type: text("type").notNull(),
    provider: text("provider"),
    provider_event_id: text("provider_event_id"),
    provider_email_id: text("provider_email_id"),
    payload: text("payload").notNull().default("{}"),
    created_at: text("created_at").notNull(),
  },
  (table) => [
    index("idx_newsletter_events_type_created").on(
      table.type,
      table.created_at,
    ),
  ],
);

export const newsletterTokens = sqliteTable(
  "newsletter_tokens",
  {
    id: text("id").primaryKey(),
    subscriber_id: text("subscriber_id")
      .notNull()
      .references(() => newsletterSubscribers.id),
    email: text("email").notNull(),
    purpose: text("purpose").notNull(),
    token_hash: text("token_hash").notNull().unique(),
    expires_at: text("expires_at").notNull(),
    used_at: text("used_at"),
    created_at: text("created_at").notNull(),
  },
  (table) => [
    index("idx_newsletter_tokens_lookup").on(
      table.purpose,
      table.token_hash,
      table.expires_at,
    ),
  ],
);

export const newsletterSuppressions = sqliteTable(
  "newsletter_suppressions",
  {
    email: text("email").primaryKey(),
    subscriber_id: text("subscriber_id").references(
      () => newsletterSubscribers.id,
    ),
    reason: text("reason").notNull(),
    provider: text("provider"),
    provider_event_id: text("provider_event_id"),
    created_at: text("created_at").notNull(),
    metadata: text("metadata").notNull().default("{}"),
  },
  (table) => [
    index("idx_newsletter_suppressions_reason").on(
      table.reason,
      table.created_at,
    ),
  ],
);
