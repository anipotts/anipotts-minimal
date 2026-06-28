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

export const contentInventorySource = {
  source_doc: "docs/content-admin-editor-brief.md",
  architecture_doc: "docs/admin-v2-architecture.md",
  mode: "read_only_static_inventory",
  generated_from:
    "current tracked apps/www source files plus @anipotts/lib/cms page_content reader paths",
};

export const contentInventory: ContentInventoryItem[] = [
  {
    id: "homepage.heading",
    surface: "homepage",
    title: "hero heading",
    source_ref:
      "D1 page_content:home.sections.intro.heading, fallback apps/www/src/data/site.ts:homeContent.heading",
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
      "Homepage intro copy uses the @anipotts/lib/cms reader path, with source defaults rendering until a published D1 record exists.",
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
      "D1 page_content:newsletter, fallback @anipotts/lib/cms DEFAULT_NEWSLETTER_CONTENT and component props",
    current_value:
      "Headline, deck, CTA label, success text, error text, footer text, and archive URL use the @anipotts/lib/cms reader path, with fallback defaults rendering until a published D1 record exists.",
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
      "Newsletter copy already has a `newsletter` content reader path, with source defaults as fallback.",
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
