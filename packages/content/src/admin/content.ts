export type RiskLevel = "low" | "medium" | "high";

export type ContentSurface = "homepage" | "projects" | "writing" | "newsletter";
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
  | "draft"
  | "preview"
  | "needs approval"
  | "blocked";

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
  summary: string;
  source_ref: string;
  updated_at: string;
  updated_by: string | null;
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
    "current tracked apps/www source files plus @anipotts/lib/cms page_content reader paths",
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
      "D1 page_content:home.sections.intro.heading seeded by drizzle/migrations/0010_seed_home_page_content.sql, fallback apps/www/src/data/site.ts:homeContent.heading",
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
      "D1 page_content:home.sections.intro.subheading, fallback apps/www/src/data/site.ts:homeContent.summary",
    current_value:
      "Homepage intro summary keeps the source-backed rich inline mentions unless D1 explicitly provides a plain subheading field.",
    editability: "ready",
    risk_level: "medium",
    next_safe_action:
      "Use the content operation model before allowing writes because this is above-fold public copy.",
    required_authority: [],
    proof_ids: ["content.homepage.summary.source"],
  },
  {
    id: "homepage.proof_cards",
    surface: "homepage",
    title: "proof cards",
    source_ref: "apps/www/src/data/site.ts:homeContent.proof",
    current_value:
      "Structured AI, Quantercise, Paragon Global Investments, and public tooling cards feed the homepage proof grid.",
    editability: "ready",
    risk_level: "medium",
    next_safe_action:
      "Expose card fields with source URL validation and preview-only proof before any save path.",
    required_authority: [],
    proof_ids: ["content.homepage.proof.source"],
  },
  {
    id: "homepage.making_selection",
    surface: "homepage",
    title: "homepage making selection",
    source_ref:
      "D1 page_content:home.sections.past_work plus apps/www/src/pages/index.astro:homeMakingSlugs",
    current_value:
      "D1 controls the making label, limit, and view-all link; project slugs remain source-backed in the Astro page.",
    editability: "needs_schema",
    risk_level: "medium",
    next_safe_action:
      "Keep source-backed until the editor has an ordered relation model for featured project cards.",
    required_authority: [],
    proof_ids: ["content.homepage.making.source"],
  },
  {
    id: "projects.card_fields",
    surface: "projects",
    title: "project card fields",
    source_ref: "apps/www/src/content/projects/*.md",
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
    id: "projects.detail_body",
    surface: "projects",
    title: "project detail body",
    source_ref: "apps/www/src/content/projects/*.md body",
    current_value:
      "Project bodies plus optional technical and roadmap arrays drive detail pages where present.",
    editability: "ready",
    risk_level: "medium",
    next_safe_action:
      "Add read-only markdown preview before body editing because detail pages carry public claims.",
    required_authority: [],
    proof_ids: ["content.projects.body.schema"],
  },
  {
    id: "projects.duplicate_source",
    surface: "projects",
    title: "project source duplication",
    source_ref: "docs/content-admin-editor-brief.md:open questions",
    current_value:
      "Markdown collections and package data have overlapping project facts that need a source-truth decision.",
    editability: "needs_owner",
    risk_level: "medium",
    next_safe_action:
      "Decide canonical project source before enabling writes that could split project state.",
    required_authority: ["content.project-source.owner-decision"],
    proof_ids: ["content.projects.source-truth.open-question"],
  },
  {
    id: "writing.frontmatter",
    surface: "writing",
    title: "writing frontmatter",
    source_ref: "apps/www/src/content/writing/*.md",
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
    id: "writing.body",
    surface: "writing",
    title: "writing body",
    source_ref: "apps/www/src/content/writing/*.md body",
    current_value:
      "Published article bodies are markdown files in the Astro writing collection.",
    editability: "ready",
    risk_level: "medium",
    next_safe_action:
      "Use preview-only diffs before edits; publishing and outbound syndication stay separate.",
    required_authority: [],
    proof_ids: ["content.writing.body.source"],
  },
  {
    id: "writing.claude_stats_link",
    surface: "writing",
    title: "orchestrating stats link",
    source_ref: "apps/www/src/content/writing/saturdays-are-for-claude-code.md",
    current_value:
      "The writing post now links to /orchestrating instead of the legacy /claude path.",
    editability: "ready",
    risk_level: "low",
    next_safe_action:
      "Keep this as the canonical route unless the public navigation changes again.",
    required_authority: [],
    proof_ids: ["content.writing.orchestrating-link.current"],
  },
  {
    id: "newsletter.subscribe_copy",
    surface: "newsletter",
    title: "subscribe block copy",
    source_ref:
      "D1 page_content:newsletter seeded by drizzle/migrations/0009_seed_newsletter_page_content.sql, fallback @anipotts/lib/cms DEFAULT_NEWSLETTER_CONTENT",
    current_value:
      "Headline, deck, CTA label, success text, error text, footer text, sender metadata, and archive URL use the @anipotts/lib/cms reader path with D1 page_content as the live source.",
    editability: "ready",
    risk_level: "medium",
    next_safe_action:
      "Add an audited draft operation before any save route writes the newsletter content record.",
    required_authority: [],
    proof_ids: [
      "content.newsletter.page-content.source",
      "content.newsletter.component.defaults",
    ],
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
  return {
    id: row.id,
    page_key: row.page_key,
    version: Number(row.version ?? 1),
    published: row.published === true || row.published === 1,
    field_count: countLeafFields(content),
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

function countLeafFields(value: unknown): number {
  if (Array.isArray(value)) {
    return value.reduce((sum, item) => sum + countLeafFields(item), 0);
  }
  if (value && typeof value === "object") {
    return Object.values(value).reduce(
      (sum, item) => sum + countLeafFields(item),
      0,
    );
  }
  return value === undefined || value === null ? 0 : 1;
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

export const contentPreviewItems: ContentPreviewItem[] = [
  {
    id: "preview.homepage.summary.tighten",
    inventory_id: "homepage.summary",
    surface: "homepage",
    title: "tighten homepage summary",
    status: "preview",
    risk_level: "medium",
    source_ref:
      "D1 page_content:home.sections.intro.subheading, fallback apps/www/src/data/site.ts:homeContent.summary",
    current_value:
      "homepage intro copy as rendered from the published `home` content record or source fallback.",
    proposed_value:
      "previously worked on real-time agent i/o at structured ai (YC F25) and our bad habit, an atlantic records venture. now i write about coding agent workflows and the systems around them.",
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
    source_ref: "apps/www/src/content/projects/*.md:subtitle",
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
    source_ref: "apps/www/src/content/writing/saturdays-are-for-claude-code.md",
    current_value:
      "You can see all of this on [my Claude stats page](/claude).",
    proposed_value:
      "You can see the broader agent workflow on [my orchestrating page](/orchestrating).",
    preview_route: "/writing/saturdays-are-for-claude-code",
    authority_state: "public_site_safe_lane_absorbed",
    required_approval_ids: [],
    proof_ids: ["content.writing.orchestrating-link.current"],
    blocked_actions: ["deploy without checks"],
    next_safe_action:
      "Keep the absorbed /orchestrating link as the canonical public-site route.",
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
