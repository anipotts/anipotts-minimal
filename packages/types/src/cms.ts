import type { Project, ProjectCategory, ProjectStatus } from "./project";

// ---------------------------------------------------------------------------
// Generic page content wrapper
// ---------------------------------------------------------------------------

export interface PageContent<T = unknown> {
  id: string;
  page_key: string;
  content: T;
  version: number;
  published: boolean;
  updated_at: string;
  updated_by: string | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Homepage content schema
// ---------------------------------------------------------------------------

export interface HomepageSection {
  visible: boolean;
  label: string;
  heading: string;
  subheading?: string;
  rich_summary?: HomepageRichSummarySentence[];
  mention_keys?: string[];
  paragraphs?: string[];
  links?: { label: string; href: string }[];
  limit?: number;
  view_all?: string;
  writing_slugs?: string[];
}

export type HomepageRichSummarySimpleSegment =
  | {
      kind: "text";
      text: string;
    }
  | {
      kind: "mention";
      key: string;
      suffix?: string;
    };

export type HomepageRichSummarySegment =
  | HomepageRichSummarySimpleSegment
  | {
      kind: "cluster";
      segments: HomepageRichSummarySegment[];
    }
  | {
      kind: "parens";
      segments: HomepageRichSummarySimpleSegment[];
    };

export interface HomepageRichSummarySentence {
  segments: HomepageRichSummarySegment[];
}

export interface HomepageMention {
  label: string;
  href?: string;
  icon?: string;
  mark?: string;
  logoSrc?: string;
  logoAlt?: string;
  logoTone?: "native" | "white";
  logoShape?: "square" | "wide" | "mark" | "large";
  badgeSrc?: string;
  badgeAlt?: string;
  visualLabel?: string;
  visualPrefix?: string;
  visualSuffix?: string;
  presentation?: "brand" | "facet";
}

export interface HomepageContent {
  sections: {
    intro: HomepageSection;
    about?: HomepageSection;
    past_work: HomepageSection;
    latest_thoughts: HomepageSection;
  };
  section_order: ("intro" | "past_work" | "latest_thoughts")[];
  mentions: Record<string, HomepageMention>;
}

// ---------------------------------------------------------------------------
// Owner editor schemas
// ---------------------------------------------------------------------------

export interface CmsEditorMeta {
  source: "cms" | "d1" | "fallback";
  updated_at: string | null;
  version: number | null;
}

export interface CmsEditorLink {
  label: string;
  url: string;
}

export interface CmsProjectMedia {
  kind: "image" | "gif" | "video";
  src: string;
  alt: string;
  caption?: string;
  fit?: "cover" | "contain";
}

export interface CmsProjectStorySection {
  title: string;
  paragraphs: string[];
  media?: CmsProjectMedia;
}

export interface CmsProjectContent {
  id?: string;
  slug: string;
  title: string;
  status: "live" | "wip" | "archived";
  year: string;
  range: string;
  tags: string[];
  summary: string;
  body: string;
  links: CmsEditorLink[];
  order: number;
  kind: "experience" | "project";
  public_state: "featured" | "listed" | "hidden";
  homepage_placement: "experience" | "making" | "none";
  catalog_group: "active" | "past" | "taken_down";
  homepage_order: number;
  card_copy: string;
  detail_path: string;
  identity: {
    logo_src?: string;
    logo_alt?: string;
    logo_tone?: "default" | "light" | "adaptive";
    icon?: string;
  };
  preview_media: CmsProjectMedia | null;
  story: CmsProjectStorySection[];
  updated_at?: string | null;
}

export interface CmsWritingContent {
  id?: string;
  slug: string;
  title: string;
  date: string;
  tags: string[];
  preview: string;
  body: string;
  sourceLinks: CmsEditorLink[];
  visible: boolean;
  order: number;
  updated_at?: string | null;
}

export interface NewsletterContent {
  headline: string;
  deck: string;
  cta_label: string;
  success_message: string;
  error_message: string;
  footer_text: string;
  buttondown_url: string;
  archive_label: string;
  archive_copy: string;
  archive_link_label: string;
  archive_url: string;
  sender_name: string;
  sender_email: string;
  reply_to: string;
}

export interface ListingBucketContent {
  id: string;
  label: string;
  note: string;
}

export interface ListingPageContent {
  title: string;
  description: string;
  hero_title: string;
  hero_summary: string;
  section_label?: string;
  hero_link_label?: string;
  hero_link_href?: string;
  search_placeholder?: string;
  buckets?: ListingBucketContent[];
}

export interface OrchestratingPageContent {
  title: string;
  description: string;
  section_label: string;
  hero_title: string;
  hero_summary: string;
  panel_label: string;
  panel_copy: string;
  sections: OrchestratingSectionLabels;
  loop_cards: OrchestratingLoopCard[];
  public_tools: OrchestratingLinkCard[];
}

export interface OrchestratingSectionLabels {
  systems: string;
  loop: string;
  public_tools: string;
  public_tools_note: string;
  status: string;
  status_note: string;
  records: string;
  plugin: string;
  hooks: string;
  playbooks: string;
  sessions: string;
}

export interface OrchestratingLoopCard {
  label: string;
  title: string;
  detail: string;
}

export interface OrchestratingLinkCard {
  title: string;
  href: string;
  detail: string;
}

export interface SystemsPrinciple {
  label: string;
  title: string;
  detail: string;
}

export interface SystemsLinkCard {
  title: string;
  href: string;
  detail: string;
}

export type SystemsMapSourceId =
  | "gmail"
  | "linkedin"
  | "x"
  | "instagram"
  | "github"
  | "nyu"
  | "chrome"
  | "apple_books"
  | "withings"
  | "zocdoc"
  | "imessage"
  | "real_life"
  | "files"
  | "apple_health"
  | "physical_measurement"
  | "people"
  | "notes";

export type SystemsMapSourceMode = "event" | "scheduled" | "manual" | "local";
export type SystemsMapSourceKind = "signal" | "record";

export interface SystemsMapSource {
  id: SystemsMapSourceId;
  label: string;
  mode: SystemsMapSourceMode;
  kind: SystemsMapSourceKind;
}

export interface SystemsMapDomain {
  label: string;
  detail: string;
  sources: SystemsMapSource[];
}

export type SystemsMapNodeId =
  | "life"
  | "snap_store"
  | "admin"
  | "ani"
  | "agents"
  | "work"
  | "record"
  | "calendar"
  | "credentials"
  | "infrastructure";

export interface SystemsMapNode {
  id: SystemsMapNodeId;
  label: string;
  title: string;
  detail: string;
  items: string[];
}

export type SystemsMapFoundationId =
  | "calendar"
  | "github"
  | "mac_mini"
  | "one_password"
  | "tailnet"
  | "external_ssd";

export interface SystemsMapFoundation {
  id: SystemsMapFoundationId;
  title: string;
  role: string;
  detail: string;
  state: "active" | "planned";
}

export type SystemsMapDeviceId = "iphone" | "macbook" | "mac_mini";

export interface SystemsMapDevice {
  id: SystemsMapDeviceId;
  title: string;
  detail: string;
}

export type SystemsAuthorityModeId = "own" | "with_me" | "mixed";

export interface SystemsAuthorityMode {
  id: SystemsAuthorityModeId;
  label: string;
  detail: string;
}

export type SystemsMapRelationshipId =
  | "signals_to_records"
  | "records_to_ani"
  | "calendar_to_ani"
  | "ani_to_agents"
  | "agents_to_ani"
  | "agents_to_credentials"
  | "agents_to_infrastructure"
  | "agents_to_record"
  | "record_to_records";

export type SystemsMapRelationshipKind =
  | "signal"
  | "scheduled"
  | "authorized"
  | "needs_human"
  | "verified_update"
  | "transport"
  | "credential";

export interface SystemsMapRelationship {
  id: SystemsMapRelationshipId;
  source: SystemsMapNodeId;
  destination: SystemsMapNodeId;
  authority: SystemsAuthorityModeId;
  kind: SystemsMapRelationshipKind;
  detail: string;
}

export interface SystemsLifecycleNode {
  id: string;
  label: string;
  detail: string;
  kind:
    | "stage"
    | "human"
    | "context"
    | "records"
    | "credential"
    | "runtime"
    | "archive"
    | "feedback";
  mark?: string;
}

export interface SystemsLifecycleEdge {
  id: string;
  source: string;
  destination: string;
  label: string;
  detail: string;
  kind:
    | "flow"
    | "context"
    | "human"
    | "retry"
    | "persist"
    | "transport"
    | "credential"
    | "feedback"
    | "archive";
  route: "direct" | "left" | "right" | "outer" | "support" | "self";
}

export interface SystemsLifecycle {
  status: "intended system";
  domains: string[];
  workers: { id: string; label: string; mark: "claude" | "openai" }[];
  copy: {
    caption: string;
    context_hint: string;
    human_hint: string;
    more_sources: string;
    transport: string;
    feedback_hint: string;
    walkthrough_label: string;
    back: string;
    next: string;
    reset: string;
  };
  principle: string;
  execution_label: string;
  completion_rule: string;
  pause_rule: string;
  stages: SystemsLifecycleNode[];
  support: SystemsLifecycleNode[];
  sources: {
    id: string;
    label: string;
    group: "records" | "credentials" | "more";
    mark: string;
  }[];
  devices: { id: string; label: string; detail: string; mark: string }[];
  edges: SystemsLifecycleEdge[];
  walkthrough: {
    title: string;
    detail: string;
    nodes: string[];
    edges: string[];
  }[];
}

export interface SystemsPageContent {
  workflow: {
    intro: string;
    sources: string[];
    steps: Array<{
      id: string;
      label: string;
      detail: string;
      marks: string[];
    }>;
    feedback: string;
  };
  /** Retained experiment data, independent of the public workflow. */
  lifecycle: SystemsLifecycle;
  title: string;
  description: string;
  hero_title: string;
  hero_summary: string;
  map_label: string;
  map_principle: string;
  map_domains: SystemsMapDomain[];
  map_nodes: SystemsMapNode[];
  map_foundation_label: string;
  map_foundations: SystemsMapFoundation[];
  map_device_label: string;
  map_devices: SystemsMapDevice[];
  map_authority_label: string;
  map_authority_modes: SystemsAuthorityMode[];
  map_relationships: SystemsMapRelationship[];
  principles_label: string;
  principles: SystemsPrinciple[];
  writing_label: string;
  featured_writing: SystemsLinkCard;
  tools_label: string;
  public_tools: SystemsLinkCard[];
}

export interface CmsEditorSnapshot {
  homepage: HomepageContent;
  homepageMeta: CmsEditorMeta;
  projects: CmsProjectContent[];
  writing: CmsWritingContent[];
  newsletter: NewsletterContent;
  newsletterMeta: CmsEditorMeta;
}

// ---------------------------------------------------------------------------
// Footer content schema
// ---------------------------------------------------------------------------

export interface FooterContent {
  tagline: string;
  copyright: string;
  links: { label: string; href: string }[];
}

// ---------------------------------------------------------------------------
// Projects table row
// ---------------------------------------------------------------------------

export interface ProjectRow {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  year: string;
  category: ProjectCategory;
  role: string;
  duration: string;
  tags: string[];
  status: ProjectStatus;
  featured: boolean;
  icon: string | null;
  image_url?: string | null;
  thumbnail_url?: string | null;
  link_live: string | null;
  link_repo: string | null;
  link_page: string | null;
  sort_order: number;
  visible: boolean;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Social links table row
// ---------------------------------------------------------------------------

export interface SocialLinkRow {
  id: string;
  name: string;
  url: string;
  icon: string;
  description: string | null;
  sort_order: number;
  visible: boolean;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Site settings (key-value store)
// ---------------------------------------------------------------------------

export type SiteSettingsMap = Record<string, string>;

// ---------------------------------------------------------------------------
// Mapper: ProjectRow -> Project (existing interface)
// ---------------------------------------------------------------------------

export function projectRowToProject(row: ProjectRow): Project {
  const links: Project["links"] = {};
  if (row.link_live) links.live = row.link_live;
  if (row.link_repo) links.repo = row.link_repo;
  if (row.link_page) links.page = row.link_page;

  return {
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle,
    description: row.description,
    year: row.year,
    category: row.category,
    role: row.role,
    duration: row.duration,
    tags: row.tags,
    status: row.status,
    featured: row.featured || undefined,
    icon: (row.icon as Project["icon"]) || undefined,
    links: Object.keys(links).length > 0 ? links : undefined,
  };
}
