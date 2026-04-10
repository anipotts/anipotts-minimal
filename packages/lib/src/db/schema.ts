/**
 * Drizzle ORM schema for anipotts-db (Cloudflare D1 / SQLite).
 *
 * Covers all 18 regular tables from d1-schema.sql.
 * FTS5 virtual tables and rate_limits are excluded (unsupported by Drizzle / managed separately).
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
  },
  (table) => [
    index("idx_status_checks_lookup").on(table.service_url, table.checked_at),
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
// 19. email_queue (failed emails for retry)
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
