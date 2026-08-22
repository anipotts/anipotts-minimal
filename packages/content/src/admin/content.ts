export type RiskLevel = "low" | "medium" | "high";

export type ContentSurface =
  "homepage" | "projects" | "writing" | "newsletter" | "systems";
export type ContentEditability = "ready" | "needs_schema" | "needs_owner";

export type ContentInventoryItem = {
  id: string;
  surface: ContentSurface;
  title: string;
  source_ref: string;
  current_value: string;
  editability: ContentEditability;
  risk_level: RiskLevel;
  next_safe_action: string;
  required_authority: string[];
  proof_ids: string[];
};

export type ContentPreviewStatus =
  "draft" | "preview" | "needs approval" | "blocked";

export type ContentPreviewItem = {
  id: string;
  inventory_id: string;
  surface: ContentSurface;
  title: string;
  status: ContentPreviewStatus;
  risk_level: RiskLevel;
  source_ref: string;
  current_value: string;
  proposed_value: string;
  preview_route: string;
  authority_state: string;
  required_approval_ids: string[];
  proof_ids: string[];
  blocked_actions: string[];
  next_safe_action: string;
};

type D1Result<T = unknown> = {
  results?: T[];
  success?: boolean;
};

type D1PreparedStatement = {
  first<T = unknown>(): Promise<T | null>;
  all<T = unknown>(): Promise<D1Result<T>>;
};

export type ContentInventoryD1Database = {
  prepare(query: string): D1PreparedStatement;
};

export type PageContentInventoryRow = {
  id: string;
  page_key: string;
  version: number;
  published: boolean;
  field_count: number;
  fields: PageContentInventoryField[];
  source_backed_fields: string[];
  summary: string;
  source_ref: string;
  updated_at: string;
  updated_by: string | null;
};

export type PageContentInventoryField = {
  path: string;
  value: string;
  raw_value: string;
  kind: string;
};

export type PageContentInventoryReadState =
  | {
      mode: "ready";
      row_count: number;
      published_count: number;
      rows: PageContentInventoryRow[];
    }
  | {
      mode: "missing_db";
      row_count: number;
      published_count: number;
      rows: PageContentInventoryRow[];
    }
  | {
      mode: "read_failed";
      row_count: number;
      published_count: number;
      rows: PageContentInventoryRow[];
      error: string;
    };

type PageContentD1Row = {
  id: string;
  page_key: string;
  content: string;
  version: number | null;
  published: number | boolean | null;
  updated_at: string | null;
  updated_by: string | null;
};

export const contentInventorySource = {
  source_doc: "docs/content-admin-editor-brief.md",
  architecture_doc: "docs/admin-v2-architecture.md",
  mode: "read_only_static_plus_d1_page_content",
  generated_from:
    "canonical content/public source files, generated Admin projection, and versioned D1 page_content runtime overrides",
};

export async function readPageContentInventoryStore(
  db: ContentInventoryD1Database | null | undefined,
): Promise<PageContentInventoryReadState> {
  if (!db) {
    return {
      mode: "missing_db",
      row_count: 0,
      published_count: 0,
      rows: [],
    };
  }

  try {
    const [rowCount, publishedCount, rows] = await Promise.all([
      countPageContentRows(db),
      countPageContentRows(db, "WHERE published = 1"),
      db
        .prepare(
          `SELECT
             id,
             page_key,
             content,
             version,
             published,
             updated_at,
             updated_by
           FROM page_content
           ORDER BY page_key ASC, published DESC, version DESC
           LIMIT 50`,
        )
        .all<PageContentD1Row>(),
    ]);

    return {
      mode: "ready",
      row_count: rowCount,
      published_count: publishedCount,
      rows: (rows.results ?? []).map(pageContentInventoryFromRow),
    };
  } catch (error) {
    return {
      mode: "read_failed",
      row_count: 0,
      published_count: 0,
      rows: [],
      error: error instanceof Error ? error.message : "unknown read failure",
    };
  }
}

export const contentInventory: ContentInventoryItem[] = [
  {
    id: "homepage.heading",
    surface: "homepage",
    title: "hero heading",
    source_ref:
      "D1 page_content:home.sections.intro.heading seeded by drizzle/migrations/0010_seed_home_page_content.sql, fallback @anipotts/content/public DEFAULT_HOMEPAGE_CONTENT",
    current_value: "hi, i'm ani",
    editability: "ready",
    risk_level: "low",
    next_safe_action:
      "Draft the homepage content record through an audited operation before adding a save path.",
    required_authority: [],
    proof_ids: ["content.homepage.heading.source"],
  },
  {
    id: "homepage.summary",
    surface: "homepage",
    title: "hero summary",
    source_ref:
      "D1 page_content:home.sections.intro.rich_summary seeded by drizzle/migrations/0016_seed_homepage_rich_summary.sql, fallback @anipotts/content/public DEFAULT_HOMEPAGE_CONTENT",
    current_value:
      "Homepage intro summary uses structured D1 text and mention keys when present.",
    editability: "ready",
    risk_level: "medium",
    next_safe_action:
      "Preview rich-summary segment edits before any save path touches above-fold public copy.",
    required_authority: [],
    proof_ids: ["content.homepage.summary.source"],
  },
  {
    id: "homepage.mentions",
    surface: "homepage",
    title: "homepage mention metadata",
    source_ref:
      "D1 page_content:home.mentions seeded by drizzle/migrations/0017_seed_homepage_mentions.sql, fallback @anipotts/content/public DEFAULT_HOMEPAGE_CONTENT",
    current_value:
      "Structured AI, YC F25, Our Bad Habit, Atlantic Records, and Business Insider labels, links, and local logo paths are now structured homepage content.",
    editability: "ready",
    risk_level: "medium",
    next_safe_action:
      "Preview mention label, link, and local logo-path edits before any save path touches above-fold public copy.",
    required_authority: [],
    proof_ids: ["content.homepage.mentions.page-content"],
  },
  {
    id: "homepage.proof_cards",
    surface: "homepage",
    title: "proof cards",
    source_ref:
      "D1 page_content:home.proof_cards seeded by drizzle/migrations/0013_seed_homepage_proof_cards.sql, fallback @anipotts/content/public DEFAULT_HOMEPAGE_CONTENT",
    current_value:
      "Structured AI, Quantercise, Paragon Global Investments, and public tooling cards feed the homepage proof grid from D1 when present.",
    editability: "ready",
    risk_level: "medium",
    next_safe_action:
      "Use the normalized D1 proof card schema for preview before any save path.",
    required_authority: [],
    proof_ids: ["content.homepage.proof.page-content"],
  },
  {
    id: "homepage.making_selection",
    surface: "homepage",
    title: "homepage making selection",
    source_ref:
      "D1 page_content:home.sections.past_work.project_slugs seeded by drizzle/migrations/0014_seed_homepage_making_slugs.sql, fallback @anipotts/content/public DEFAULT_HOMEPAGE_CONTENT",
    current_value:
      "D1 controls the making label, limit, view-all link, and ordered homepage project slugs when present.",
    editability: "ready",
    risk_level: "medium",
    next_safe_action:
      "Preview ordered project selections from D1 before any save path edits the home content record.",
    required_authority: [],
    proof_ids: ["content.homepage.making.page-content"],
  },
  {
    id: "homepage.writing_selection",
    surface: "homepage",
    title: "homepage writing selection",
    source_ref:
      "D1 page_content:home.sections.latest_thoughts.writing_slugs seeded by drizzle/migrations/0015_seed_homepage_writing_slugs.sql, fallback @anipotts/content/public DEFAULT_HOMEPAGE_CONTENT",
    current_value:
      "D1 controls the writing label, limit, view-all link, and ordered homepage writing slugs when present.",
    editability: "ready",
    risk_level: "medium",
    next_safe_action:
      "Preview ordered writing selections from D1 before any save path edits the home content record.",
    required_authority: [],
    proof_ids: ["content.homepage.writing.page-content"],
  },
  {
    id: "projects.card_fields",
    surface: "projects",
    title: "project card fields",
    source_ref: "content/public/projects/*.md",
    current_value:
      "title, subtitle, description, year, category, role, duration, status, visibility, sort order, links, and tags.",
    editability: "ready",
    risk_level: "low",
    next_safe_action:
      "Render markdown frontmatter in admin first; writes should remain gated behind content operation proposals.",
    required_authority: [],
    proof_ids: ["content.projects.frontmatter.schema"],
  },
  {
    id: "projects.index_copy",
    surface: "projects",
    title: "making index copy",
    source_ref:
      "D1 page_content:making seeded by drizzle/migrations/0023_seed_making_index_page_content.sql and 0035_seed_making_bucket_copy.sql, fallback @anipotts/content/public DEFAULT_MAKING_INDEX_CONTENT",
    current_value:
      "The /making title, meta description, hero title, hero summary, and project bucket labels/notes use structured page_content when present.",
    editability: "ready",
    risk_level: "low",
    next_safe_action:
      "Preview index and bucket copy changes before any save path edits the making page content record.",
    required_authority: [],
    proof_ids: ["content.projects.index.page-content"],
  },
  {
    id: "projects.archive_index_copy",
    surface: "projects",
    title: "project archive index copy",
    source_ref:
      "D1 page_content:projects seeded by drizzle/migrations/0024_seed_projects_index_page_content.sql, fallback @anipotts/content/public DEFAULT_PROJECTS_INDEX_CONTENT",
    current_value:
      "The /projects title, meta description, hero title, hero summary, and /making hero link use structured page_content when present.",
    editability: "ready",
    risk_level: "low",
    next_safe_action:
      "Preview archive index copy changes before any save path edits the projects page content record.",
    required_authority: [],
    proof_ids: ["content.projects.archive-index.page-content"],
  },
  {
    id: "projects.detail_body",
    surface: "projects",
    title: "project detail body",
    source_ref:
      "D1 page_content:project:<slug> seeded by drizzle/migrations/0031_seed_detail_page_content.sql and drizzle/migrations/0032_seed_remaining_detail_page_content.sql, fallback content/public/projects/*.md body",
    current_value:
      "Every tracked project detail record now has a structured page_content row. Visible rows publish to public routes; hidden rows remain available for admin review only.",
    editability: "ready",
    risk_level: "medium",
    next_safe_action:
      "Review detail page_content rows in admin before replacing markdown fallback or adding any save path, because detail pages carry public claims.",
    required_authority: [],
    proof_ids: [
      "content.projects.body.schema",
      "content.projects.detail.page-content",
    ],
  },
  {
    id: "writing.frontmatter",
    surface: "writing",
    title: "writing frontmatter",
    source_ref: "content/public/writing/*.md",
    current_value:
      "title, summary, tags, status, dates, content type, project, and artifact fields are already schema-backed.",
    editability: "ready",
    risk_level: "low",
    next_safe_action:
      "Show published and draft rows read-only before proposing status or scheduling edits.",
    required_authority: [],
    proof_ids: ["content.writing.frontmatter.schema"],
  },
  {
    id: "writing.index_copy",
    surface: "writing",
    title: "writing index copy",
    source_ref:
      "D1 page_content:writing seeded by drizzle/migrations/0022_seed_writing_index_page_content.sql, fallback @anipotts/content/public DEFAULT_WRITING_INDEX_CONTENT",
    current_value:
      "The /writing title, meta description, hero summary, and search placeholder use structured page_content when present.",
    editability: "ready",
    risk_level: "low",
    next_safe_action:
      "Preview index copy changes before any save path edits the writing page content record.",
    required_authority: [],
    proof_ids: ["content.writing.index.page-content"],
  },
  {
    id: "writing.body",
    surface: "writing",
    title: "writing body",
    source_ref:
      "D1 page_content:writing:<slug> seeded by drizzle/migrations/0031_seed_detail_page_content.sql and drizzle/migrations/0032_seed_remaining_detail_page_content.sql, fallback content/public/writing/*.md body",
    current_value:
      "Every tracked writing detail record now has a structured page_content row. Published rows render on public routes; the draft row remains unpublished for admin review only.",
    editability: "ready",
    risk_level: "medium",
    next_safe_action:
      "Review writing detail page_content rows in admin before replacing markdown fallback or adding any save/send path.",
    required_authority: [],
    proof_ids: [
      "content.writing.body.source",
      "content.writing.detail.page-content",
    ],
  },
  {
    id: "writing.claude_stats_link",
    surface: "writing",
    title: "systems essay link",
    source_ref: "content/public/writing/saturdays-are-for-claude-code.md",
    current_value:
      "The writing post links to /systems as the canonical agent-method route.",
    editability: "ready",
    risk_level: "low",
    next_safe_action:
      "Keep this as the canonical route unless the public navigation changes again.",
    required_authority: [],
    proof_ids: ["content.writing.systems-link.current"],
  },
  {
    id: "newsletter.subscribe_copy",
    surface: "newsletter",
    title: "subscribe block copy",
    source_ref:
      "D1 page_content:newsletter seeded by drizzle/migrations/0009_seed_newsletter_page_content.sql and updated by drizzle/migrations/0026_seed_newsletter_archive_cta_content.sql, fallback @anipotts/content/public DEFAULT_NEWSLETTER_CONTENT",
    current_value:
      "Headline, deck, CTA label, success text, error text, footer text, sender metadata, archive label, archive copy, and archive URL use D1 page_content as the live source with @anipotts/content/public as the fallback contract.",
    editability: "ready",
    risk_level: "medium",
    next_safe_action:
      "Review draft operations before any page_content write or newsletter publish path exists.",
    required_authority: [],
    proof_ids: [
      "content.newsletter.page-content.source",
      "content.newsletter.component.defaults",
    ],
  },
  {
    id: "newsletter.archive_copy",
    surface: "newsletter",
    title: "newsletter archive copy",
    source_ref:
      "D1 page_content:newsletter_archive seeded by drizzle/migrations/0025_seed_newsletter_archive_page_content.sql, fallback @anipotts/content/public DEFAULT_NEWSLETTER_ARCHIVE_CONTENT",
    current_value:
      "The /newsletter/archive title, meta description, section label, and hero summary use structured page_content when present.",
    editability: "ready",
    risk_level: "low",
    next_safe_action:
      "Preview archive copy changes before any save path edits the newsletter archive page content record.",
    required_authority: [],
    proof_ids: ["content.newsletter.archive.page-content"],
  },
  {
    id: "newsletter.backfill",
    surface: "newsletter",
    title: "newsletter backfill candidates",
    source_ref:
      "docs/content-admin-editor-brief.md:newsletter backfill options",
    current_value:
      "Existing writing can seed newsletter planning, but nothing should auto-send from admin.",
    editability: "needs_owner",
    risk_level: "high",
    next_safe_action:
      "Keep as read-only planning until newsletter ownership and outbound-send authority are explicit.",
    required_authority: ["newsletter.publish.owner-decision"],
    proof_ids: ["content.newsletter.backfill.plan"],
  },
  {
    id: "systems.hero_copy",
    surface: "systems",
    title: "systems page copy",
    source_ref:
      "D1 page_content:systems seeded by drizzle/migrations/0044_public_identity_systems.sql, fallback @anipotts/content/public DEFAULT_SYSTEMS_CONTENT",
    current_value:
      "The /systems title, description, hero, operating principles, featured writing, and public tools use structured page_content when present.",
    editability: "ready",
    risk_level: "medium",
    next_safe_action:
      "Preview systems copy changes before any save path edits the page content record.",
    required_authority: [],
    proof_ids: ["content.systems.hero.page-content"],
  },
];

function countPageContentRows(
  db: ContentInventoryD1Database,
  clause = "",
): Promise<number> {
  return db
    .prepare(`SELECT COUNT(*) AS count FROM page_content ${clause}`)
    .first<{ count: number }>()
    .then((row) => Number(row?.count ?? 0));
}

function pageContentInventoryFromRow(
  row: PageContentD1Row,
): PageContentInventoryRow {
  const content = parseJsonObject(row.content);
  const fields = listLeafFields(content);
  return {
    id: row.id,
    page_key: row.page_key,
    version: Number(row.version ?? 1),
    published: row.published === true || row.published === 1,
    field_count: fields.length,
    fields,
    source_backed_fields: sourceBackedFields(row.page_key, content),
    summary: summarizePageContent(row.page_key, content),
    source_ref: `D1 page_content:${row.page_key}`,
    updated_at: row.updated_at ?? "",
    updated_by: row.updated_by,
  };
}

function parseJsonObject(raw: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

function listLeafFields(
  value: unknown,
  path = "",
): PageContentInventoryField[] {
  if (Array.isArray(value)) {
    return value.flatMap((item, index) =>
      listLeafFields(item, `${path}[${index}]`),
    );
  }

  if (value && typeof value === "object") {
    return Object.entries(value as Record<string, unknown>).flatMap(
      ([key, item]) => listLeafFields(item, path ? `${path}.${key}` : key),
    );
  }

  if (value === undefined || value === null) {
    return [];
  }

  return [
    {
      path: path || "value",
      value: formatFieldValue(value),
      raw_value: formatRawFieldValue(value),
      kind: Array.isArray(value) ? "array" : typeof value,
    },
  ];
}

function formatFieldValue(value: unknown): string {
  if (typeof value === "string") {
    return value.length > 96 ? `${value.slice(0, 93)}...` : value;
  }
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }
  if (typeof value === "number") {
    return String(value);
  }
  return JSON.stringify(value) ?? String(value);
}

function formatRawFieldValue(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }
  if (typeof value === "number") {
    return String(value);
  }
  return JSON.stringify(value, null, 2) ?? String(value);
}

function sourceBackedFields(
  pageKey: string,
  content: Record<string, unknown>,
): string[] {
  if (pageKey !== "home") {
    return [];
  }

  const gaps: string[] = [];

  if (
    !hasNestedField(content, ["sections", "intro", "rich_summary"]) &&
    !hasNestedField(content, ["sections", "intro", "subheading"])
  ) {
    gaps.unshift("sections.intro.rich_summary");
  }

  if (!hasNestedField(content, ["proof_cards"])) {
    gaps.push("proof_cards");
  }

  if (!hasNestedField(content, ["sections", "past_work", "project_slugs"])) {
    gaps.push("sections.past_work.project_slugs");
  }

  if (
    !hasNestedField(content, ["sections", "latest_thoughts", "writing_slugs"])
  ) {
    gaps.push("sections.latest_thoughts.writing_slugs");
  }

  return gaps;
}

function hasNestedField(
  value: Record<string, unknown>,
  path: string[],
): boolean {
  let current: unknown = value;

  for (const key of path) {
    if (!current || typeof current !== "object" || Array.isArray(current)) {
      return false;
    }
    const record = current as Record<string, unknown>;
    if (!(key in record)) {
      return false;
    }
    current = record[key];
  }

  return current !== undefined && current !== null;
}

function summarizePageContent(
  pageKey: string,
  content: Record<string, unknown>,
): string {
  if (pageKey === "newsletter") {
    return compactSummary([
      ["headline", content.headline],
      ["deck", content.deck],
      ["cta", content.cta_label],
    ]);
  }

  if (
    pageKey === "writing" ||
    pageKey === "making" ||
    pageKey === "projects" ||
    pageKey === "newsletter_archive" ||
    pageKey === "systems"
  ) {
    return compactSummary([
      ["title", content.hero_title ?? content.title],
      ["label", content.section_label],
      ["summary", content.hero_summary],
      ["panel", content.panel_copy],
      ["loop", summarizeArray(content.loop_cards)],
      ["tools", summarizeArray(content.public_tools)],
      ["link", content.hero_link_href],
      ["search", content.search_placeholder],
    ]);
  }

  const sections = content.sections;
  if (
    pageKey === "home" &&
    sections &&
    typeof sections === "object" &&
    !Array.isArray(sections)
  ) {
    const intro = (sections as Record<string, unknown>).intro;
    if (intro && typeof intro === "object" && !Array.isArray(intro)) {
      return compactSummary([
        ["heading", (intro as Record<string, unknown>).heading],
        ["subheading", (intro as Record<string, unknown>).subheading],
      ]);
    }
  }

  return Object.keys(content).slice(0, 6).join(", ") || "empty content object";
}

function compactSummary(fields: [string, unknown][]): string {
  const parts = fields
    .filter((field): field is [string, string] => typeof field[1] === "string")
    .map(([label, value]) => `${label}: ${value}`);
  return parts.join(" / ") || "no text fields";
}

function summarizeArray(value: unknown): string | undefined {
  if (!Array.isArray(value)) return undefined;
  return `${value.length} items`;
}

export const contentPreviewItems: ContentPreviewItem[] = [
  {
    id: "preview.homepage.summary.tighten",
    inventory_id: "homepage.summary",
    surface: "homepage",
    title: "tighten homepage summary",
    status: "preview",
    risk_level: "medium",
    source_ref:
      "D1 page_content:home.sections.intro.rich_summary and home.mentions",
    current_value:
      "homepage intro copy as rendered from the published `home` content record or source fallback.",
    proposed_value:
      "i build with agents and write about the systems that keep the work coherent. business insider has covered how i work; previously, i worked on real-time agent i/o at structured ai (YC F25) and our bad habit, an atlantic records venture.",
    preview_route: "/",
    authority_state: "preview_only_no_write",
    required_approval_ids: [],
    proof_ids: [
      "content.homepage.summary.source",
      "admin.content.preview.local",
    ],
    blocked_actions: ["save content", "publish content", "deploy public site"],
    next_safe_action:
      "Review tone and layout in admin only; do not write this copy to a content store.",
  },
  {
    id: "preview.projects.card-summary",
    inventory_id: "projects.card_fields",
    surface: "projects",
    title: "normalize project card summary field",
    status: "draft",
    risk_level: "low",
    source_ref: "content/public/projects/*.md:subtitle",
    current_value:
      "Project cards currently use subtitle plus description, with `summary` reserved for future editor wording.",
    proposed_value:
      "Expose `summary` in admin while mapping it to existing markdown `subtitle` until the schema is renamed.",
    preview_route: "/making",
    authority_state: "model_only",
    required_approval_ids: [],
    proof_ids: ["content.projects.frontmatter.schema"],
    blocked_actions: ["rename markdown schema", "rewrite project files"],
    next_safe_action:
      "Keep as a model decision until a migration PR can update the public site schema safely.",
  },
  {
    id: "preview.writing.claude-link",
    inventory_id: "writing.claude_stats_link",
    surface: "writing",
    title: "replace stale claude stats link",
    status: "preview",
    risk_level: "low",
    source_ref: "content/public/writing/saturdays-are-for-claude-code.md",
    current_value:
      "You can see all of this on [my Claude stats page](/claude).",
    proposed_value:
      "You can see the broader agent method on [my systems page](/systems).",
    preview_route: "/writing/saturdays-are-for-claude-code",
    authority_state: "public_site_safe_lane_absorbed",
    required_approval_ids: [],
    proof_ids: ["content.writing.systems-link.current"],
    blocked_actions: ["deploy without checks"],
    next_safe_action: "Keep /systems as the canonical public-site route.",
  },
  {
    id: "preview.newsletter.copy-source",
    inventory_id: "newsletter.subscribe_copy",
    surface: "newsletter",
    title: "choose newsletter copy source",
    status: "preview",
    risk_level: "medium",
    source_ref: "D1 page_content:newsletter",
    current_value:
      "Newsletter copy has a published `newsletter` page_content seed and source defaults as fallback.",
    proposed_value:
      "Render the newsletter content record in admin and require an audited content operation before writes.",
    preview_route: "/newsletter",
    authority_state: "source_truth_resolved_preview_only",
    required_approval_ids: [],
    proof_ids: [
      "content.newsletter.page-content.source",
      "content.newsletter.component.defaults",
    ],
    blocked_actions: [
      "save newsletter copy",
      "sync newsletter provider",
      "send email",
    ],
    next_safe_action:
      "Keep read-only until a content operation write route is audited and logged.",
  },
];
