import type { RiskLevel } from "./control-plane";

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

export const contentInventorySource = {
  source_doc: "docs/content-admin-editor-brief.md",
  architecture_doc: "docs/admin-v2-architecture.md",
  mode: "read_only_static_inventory",
  generated_from: "apps/www source files at main 31204f6",
};

export const contentInventory: ContentInventoryItem[] = [
  {
    id: "homepage.heading",
    surface: "homepage",
    title: "hero heading",
    source_ref: "apps/www/src/data/site.ts:homeContent.heading",
    current_value: "hi, i'm ani",
    editability: "ready",
    risk_level: "low",
    next_safe_action:
      "Expose as a future content field after the read-only inventory is proven.",
    required_authority: [],
    proof_ids: ["content.homepage.heading.source"],
  },
  {
    id: "homepage.summary",
    surface: "homepage",
    title: "hero summary",
    source_ref: "apps/www/src/data/site.ts:homeContent.summary",
    current_value:
      "Structured AI, Our Bad Habit, Atlantic Records, and agent workflow copy are source-backed in site config.",
    editability: "ready",
    risk_level: "medium",
    next_safe_action:
      "Model proposal preview before allowing edits because this is above-fold public copy.",
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
    source_ref: "apps/www/src/pages/index.astro:homeMakingSlugs",
    current_value:
      "quantercise-extension, saeshify, nyu-purity-test, and habittracker-obh are selected in source order.",
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
    title: "stale claude stats link",
    source_ref: "apps/www/src/content/writing/saturdays-are-for-claude-code.md",
    current_value:
      "Current main still links to /claude; draft PR #73 changes this to /orchestrating.",
    editability: "ready",
    risk_level: "low",
    next_safe_action:
      "Refresh or close PR #73 depending on whether Ani wants that public cleanup deployed.",
    required_authority: [],
    proof_ids: ["pr.73.public-cleanup.pending"],
  },
  {
    id: "newsletter.subscribe_copy",
    surface: "newsletter",
    title: "subscribe block copy",
    source_ref: "apps/www/src/components/NewsletterSubscribe.astro",
    current_value:
      "Default lede, CTA label, success text, error text, and Buttondown link live in the component props.",
    editability: "needs_schema",
    risk_level: "medium",
    next_safe_action:
      "Choose D1 page_content or site config as the editable source before adding save behavior.",
    required_authority: ["content.newsletter-source.owner-decision"],
    proof_ids: ["content.newsletter.component.defaults"],
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
