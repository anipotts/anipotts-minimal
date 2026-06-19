import type {
  HomepageContent,
  HomepageSection,
  CmsEditorLink,
  CmsEditorMeta,
  CmsEditorSnapshot,
  CmsProjectContent,
  CmsWritingContent,
  NewsletterContent,
  PageContent,
  Project,
  ProjectCategory,
  SocialLink,
  SiteSettingsMap,
  WritingSummary,
} from "@anipotts/types";
import { projectRowToProject } from "@anipotts/types";
import { eq, desc, asc, and } from "drizzle-orm";
import { logger } from "../logger";
import { FALLBACK_PROJECTS } from "../data/projects";
import { FALLBACK_SOCIAL_LINKS } from "../data/social";
import { getDrizzle, getDB, parseJsonArray, parseJson } from "../db";
import * as s from "../db/schema";

// ---------------------------------------------------------------------------
// Homepage content
// ---------------------------------------------------------------------------

const HOME_SECTION_ORDER: HomepageContent["section_order"] = [
  "intro",
  "about",
  "past_work",
  "latest_thoughts",
];

const HOMEPAGE_FIELD_LIMITS = {
  label: 80,
  heading: 160,
  subheading: 500,
  paragraph: 1200,
  linkLabel: 80,
  linkHref: 300,
  limitMin: 1,
  limitMax: 12,
} as const;

export const DEFAULT_HOMEPAGE_CONTENT: HomepageContent = {
  sections: {
    intro: {
      visible: true,
      label: "index",
      heading: "hi, i'm ani",
      subheading:
        "previously worked on real-time agent i/o at structured ai (YC F25) and our bad habit, an atlantic records venture. every now and then i post about what i'm doing with claude code and codex",
    },
    about: {
      visible: true,
      label: "about",
      heading: "",
      paragraphs: [
        "I design multi-agent systems that orchestrate combinatorial verification tasks. Autonomous QA/QC pipelines for AEC, SEO auditing at scale, document extraction across regulatory domains. Previously full stack at a YC F25 startup (under NDA).",
        "Everything I build ships with Claude Code. I publish the workflows, tooling, and real usage data as I go. Recently featured in Business Insider on how developers are restructuring their days around AI tools.",
      ],
    },
    past_work: {
      visible: true,
      label: "making",
      heading: "",
      limit: 4,
      links: [{ label: "view all", href: "/making" }],
      view_all: "/making",
    },
    latest_thoughts: {
      visible: true,
      label: "writing",
      heading: "",
      limit: 3,
      links: [{ label: "view all", href: "/writing" }],
      view_all: "/writing",
    },
  },
  section_order: HOME_SECTION_ORDER,
};

function coerceString(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}

function coerceBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  return fallback;
}

function coercePositiveInteger(value: unknown, fallback: number): number {
  if (typeof value !== "number" || !Number.isInteger(value)) return fallback;
  return Math.min(
    HOMEPAGE_FIELD_LIMITS.limitMax,
    Math.max(HOMEPAGE_FIELD_LIMITS.limitMin, value),
  );
}

function normalizeSection(
  section: unknown,
  fallback: HomepageSection,
): HomepageSection {
  const source =
    section && typeof section === "object"
      ? (section as Record<string, unknown>)
      : {};

  const normalized: HomepageSection = {
    visible: coerceBoolean(source.visible, fallback.visible),
    label: coerceString(source.label, fallback.label).trim(),
    heading: coerceString(source.heading, fallback.heading).trim(),
  };

  if (source.subheading !== undefined || fallback.subheading !== undefined) {
    normalized.subheading =
      source.subheading === undefined
        ? fallback.subheading
        : coerceString(source.subheading, fallback.subheading ?? "").trim();
  }

  if (Array.isArray(source.paragraphs)) {
    normalized.paragraphs = source.paragraphs
      .filter((paragraph): paragraph is string => typeof paragraph === "string")
      .map((paragraph) => paragraph.trim());
  } else if (fallback.paragraphs !== undefined) {
    normalized.paragraphs = fallback.paragraphs;
  }

  if (Array.isArray(source.links)) {
    normalized.links = source.links
      .filter(
        (
          link,
        ): link is {
          label: string;
          href: string;
        } =>
          Boolean(link) &&
          typeof link === "object" &&
          typeof (link as Record<string, unknown>).label === "string" &&
          typeof (link as Record<string, unknown>).href === "string",
      )
      .map((link) => ({
        label: link.label.trim(),
        href: link.href.trim(),
      }));
  } else if (fallback.links !== undefined) {
    normalized.links = fallback.links;
  }

  if (source.limit !== undefined || fallback.limit !== undefined) {
    normalized.limit = coercePositiveInteger(source.limit, fallback.limit ?? 1);
  }

  if (source.view_all !== undefined || fallback.view_all !== undefined) {
    normalized.view_all =
      source.view_all === undefined
        ? fallback.view_all
        : coerceString(source.view_all, fallback.view_all ?? "");
  }

  return normalized;
}

function isSafeHomepageLink(href: string): boolean {
  if (!href || /[\u0000-\u001f\u007f\s]/.test(href)) return false;
  if (href.startsWith("/")) return !href.startsWith("//");
  if (!href.startsWith("https://")) return false;

  try {
    const parsed = new URL(href);
    return parsed.protocol === "https:" && Boolean(parsed.hostname);
  } catch {
    return false;
  }
}

function validateTextField(
  value: string,
  label: string,
  maxLength: number,
  required: boolean,
): string | null {
  if (required && !value.trim()) return `${label} is required`;
  if (value.length > maxLength) return `${label} is too long`;
  return null;
}

function validateSectionLabel(section: HomepageSection, label: string) {
  return validateTextField(
    section.label,
    label,
    HOMEPAGE_FIELD_LIMITS.label,
    section.visible,
  );
}

function validateSectionLink(section: HomepageSection, label: string) {
  const link = section.links?.[0];
  if (!section.visible) return null;
  if (!link) return `${label} link is required`;

  return (
    validateTextField(
      link.label,
      `${label} link label`,
      HOMEPAGE_FIELD_LIMITS.linkLabel,
      true,
    ) ??
    validateTextField(
      link.href,
      `${label} link`,
      HOMEPAGE_FIELD_LIMITS.linkHref,
      true,
    ) ??
    (!isSafeHomepageLink(link.href)
      ? `${label} link must start with / or https://`
      : null)
  );
}

export function validateHomepageContent(content: HomepageContent): {
  ok: boolean;
  error?: string;
} {
  const { intro, about, past_work, latest_thoughts } = content.sections;

  const introError =
    validateSectionLabel(intro, "Homepage label") ??
    validateTextField(
      intro.heading,
      "Homepage heading",
      HOMEPAGE_FIELD_LIMITS.heading,
      intro.visible,
    ) ??
    validateTextField(
      intro.subheading ?? "",
      "Homepage summary",
      HOMEPAGE_FIELD_LIMITS.subheading,
      false,
    );
  if (introError) return { ok: false, error: introError };

  const aboutError = validateSectionLabel(about, "About label");
  if (aboutError) return { ok: false, error: aboutError };

  const paragraphs = about.paragraphs ?? [];
  if (about.visible && paragraphs.filter(Boolean).length === 0) {
    return { ok: false, error: "About needs at least one paragraph" };
  }
  const longParagraph = paragraphs.find(
    (paragraph) => paragraph.length > HOMEPAGE_FIELD_LIMITS.paragraph,
  );
  if (longParagraph) {
    return { ok: false, error: "About paragraph is too long" };
  }

  const workError =
    validateSectionLabel(past_work, "Work label") ??
    validateSectionLink(past_work, "Work");
  if (workError) return { ok: false, error: workError };

  const writingError =
    validateSectionLabel(latest_thoughts, "Writing label") ??
    validateSectionLink(latest_thoughts, "Writing");
  if (writingError) return { ok: false, error: writingError };

  return { ok: true };
}

export function normalizeHomepageContent(content: unknown): HomepageContent {
  const source =
    content && typeof content === "object"
      ? (content as Partial<HomepageContent>)
      : {};

  return {
    sections: {
      intro: normalizeSection(
        source.sections?.intro,
        DEFAULT_HOMEPAGE_CONTENT.sections.intro,
      ),
      about: normalizeSection(
        source.sections?.about,
        DEFAULT_HOMEPAGE_CONTENT.sections.about,
      ),
      past_work: normalizeSection(
        source.sections?.past_work,
        DEFAULT_HOMEPAGE_CONTENT.sections.past_work,
      ),
      latest_thoughts: normalizeSection(
        source.sections?.latest_thoughts,
        DEFAULT_HOMEPAGE_CONTENT.sections.latest_thoughts,
      ),
    },
    section_order: HOME_SECTION_ORDER,
  };
}

export async function fetchHomepageContent(): Promise<HomepageContent> {
  const page = await fetchPageContent<HomepageContent>("home");
  return normalizeHomepageContent(page?.content);
}

// ---------------------------------------------------------------------------
// Owner editor content
// ---------------------------------------------------------------------------

const CMS_LINK_LIMIT = 300;
const CMS_TEXT_LIMITS = {
  slug: 120,
  title: 160,
  status: 40,
  year: 40,
  range: 80,
  tag: 40,
  summary: 600,
  body: 12000,
  linkLabel: 80,
  linkUrl: CMS_LINK_LIMIT,
  newsletterHeadline: 160,
  newsletterDeck: 600,
  newsletterFooter: 1200,
  sender: 120,
} as const;

export const DEFAULT_NEWSLETTER_CONTENT: NewsletterContent = {
  headline: "notes from the build loop",
  deck: "notes on agent workflows and product builds, including the parts that broke while shipping.",
  cta_label: "subscribe",
  success_message: "subscribed. check your inbox.",
  error_message: "could not subscribe. try again in a minute.",
  footer_text: "you can unsubscribe at any time.",
  buttondown_url: "https://news.anipotts.com",
  sender_name: "Ani Potts",
  sender_email: "news@anipotts.com",
  reply_to: "contact@anipotts.com",
};

export const DEFAULT_CMS_PROJECTS: CmsProjectContent[] = [
  {
    slug: "quantercise",
    title: "quantercise",
    status: "live",
    year: "2024-",
    range: "Ongoing",
    tags: ["next.js", "typescript", "postgres", "drizzle", "stripe", "python"],
    summary:
      "quant prep with postgres, drizzle, stripe, and sandboxed python grading.",
    body: "Built a quant interview prep app with 400+ problems, a Python editor, KaTeX math rendering, instant grading, and user progress. Next.js, TypeScript, Postgres, Drizzle, Stripe, and sandboxed Python grading.",
    links: [{ label: "live site", url: "https://quantercise.com" }],
    featured: true,
    order: 100,
    visible: true,
  },
  {
    slug: "pgi-research-platform",
    title: "pgi research portal",
    status: "live",
    year: "2025",
    range: "2025-",
    tags: ["next.js", "typescript", "supabase", "tailwindcss", "research"],
    summary: "next.js and supabase portal for an nyu quant fund.",
    body: "Built a Next.js and TypeScript research portal backed by Supabase for Paragon Global Investments, NYU's quant fund. Organized internal research so members could read and share fund material from mobile.",
    links: [{ label: "live site", url: "https://paragoninvestments.org" }],
    featured: false,
    order: 95,
    visible: true,
  },
  {
    slug: "claude-code-tips",
    title: "claude code tips",
    status: "live",
    year: "2025-",
    range: "Ongoing",
    tags: ["python", "claude code", "hooks", "agents", "mcp", "plugins"],
    summary: "public notes from running agent workflows in real repos.",
    body: "Reference repo built from hundreds of Claude Code sessions. Includes hooks, custom agents, MCP servers, plugin notes, and automation patterns that make agent work easier to debug.",
    links: [
      { label: "source", url: "https://github.com/anipotts/claude-code-tips" },
    ],
    featured: false,
    order: 92,
    visible: true,
  },
  {
    slug: "imessage-mcp",
    title: "imessage mcp",
    status: "live",
    year: "2025-",
    range: "Ongoing",
    tags: ["typescript", "mcp", "sqlite", "macos", "privacy"],
    summary: "local-first mcp over imessage search and stats.",
    body: "Built a macOS MCP server that lets local agents query iMessage history without writing to chat.db. Supports conversation search, contact stats, streaks, and local-only analytics. Published on npm as a small local-first tool.",
    links: [
      { label: "source", url: "https://github.com/anipotts/imessage-mcp" },
      { label: "live site", url: "https://npmjs.com/package/imessage-mcp" },
    ],
    featured: true,
    order: 91,
    visible: true,
  },
  {
    slug: "quantercise-extension",
    title: "mental math extension",
    status: "live",
    year: "2026",
    range: "Winter 2026",
    tags: ["chrome extension", "javascript", "manifest v3"],
    summary: "browser drills for fast mental math reps.",
    body: "Built a zero-dependency Chrome extension for keyboard-driven mental math practice. Includes sound feedback, progress tracking, Manifest V3 packaging, and no external services.",
    links: [
      {
        label: "source",
        url: "https://github.com/anipotts/quantercise-mental-math-extension",
      },
    ],
    featured: false,
    order: 90,
    visible: true,
  },
  {
    slug: "chainedchat",
    title: "chainedchat",
    status: "archived",
    year: "2025",
    range: "Summer 2025",
    tags: ["next.js", "typescript", "convex", "langgraph", "stripe"],
    summary: "multi-model chat with shared context and routing.",
    body: "Built a full-stack app for running a conversation across multiple LLMs without losing context. Added shared-context caching, model routing, prompt-chain UI, and Stripe billing.",
    links: [
      { label: "source", url: "https://github.com/anipotts/chained-chat" },
    ],
    featured: false,
    order: 89,
    visible: true,
  },
  {
    slug: "saeshify",
    title: "saeshify",
    status: "live",
    year: "2025-",
    range: "Ongoing",
    tags: ["typescript", "webgl", "audio", "visualization"],
    summary: "real-time rhyme scheme visualization.",
    body: "Built a WebGL and Web Audio pipeline for visualizing rhyme patterns as lyrics play. Focused on fast rendering and timing accuracy.",
    links: [
      { label: "source", url: "https://github.com/anipotts/saeshify" },
      { label: "live site", url: "https://saeshify.vercel.app" },
    ],
    featured: false,
    order: 85,
    visible: true,
  },
  {
    slug: "nyu-purity-test",
    title: "nyu purity test",
    status: "live",
    year: "2024",
    range: "Fall 2024",
    tags: ["typescript", "react", "next.js", "tailwindcss", "analytics"],
    summary: "campus quiz with 3,000+ student completions.",
    body: "Built and launched a TypeScript campus quiz in one night. It reached 1,000+ completions in under 17 hours and 200k+ visits through NYU group chats and social sharing.",
    links: [{ label: "live site", url: "https://nyupuritytest.com" }],
    featured: false,
    order: 84,
    visible: true,
  },
  {
    slug: "habittracker-obh",
    title: "artist scouting dashboard",
    status: "live",
    year: "2024",
    range: "Summer 2024",
    tags: ["python", "streamlit", "sql", "apis", "data pipelines"],
    summary: "growth tracking for an atlantic records venture.",
    body: "Built a scouting dashboard that pulled Chartmetric, YouTube, TikTok, and Instagram signals into one workflow. Added geo-based discovery for finding emerging artists in campaign markets.",
    links: [],
    featured: false,
    order: 41,
    visible: true,
  },
  {
    slug: "options-pricing-sensitivity",
    title: "options pricing + sensitivity analysis",
    status: "live",
    year: "2023",
    range: "Spring 2023",
    tags: ["python", "numpy", "pandas", "quantitative finance"],
    summary: "black-scholes and binomial pricing with volatility sweeps.",
    body: "Wrote a Python tool for pricing European options with Black-Scholes and binomial models, then swept volatility to show how model behavior changes.",
    links: [
      {
        label: "source",
        url: "https://github.com/anirudhp15/Options-Pricing-and-Sensitivity-Analysis-Tool",
      },
    ],
    featured: false,
    order: 40,
    visible: true,
  },
];

export const DEFAULT_CMS_WRITING: CmsWritingContent[] = [
  {
    slug: "saturdays-are-for-claude-code",
    title: "saturdays are for claude code",
    date: "2026-04-13",
    tags: ["claude-code", "press", "workflow", "building"],
    preview:
      "business insider interviewed me about ai usage limits. the useful part was less the quote and more the workflow it forced.",
    body: "A reporter from Business Insider reached out a couple weeks ago. He was writing about how usage limits on AI tools are changing the way people work. Somebody pointed him to me because I've been pretty vocal about how I use Claude Code. The article went live today.\n\nHe nailed the broad strokes. I do plan my work around session limits. I do save the hardest tasks for when I'm far from the cap. And yes, Saturdays are for Claude Code. That quote is real. My friends think I'm joking when I say that. I'm not.",
    sourceLinks: [
      {
        label: "source",
        url: "https://www.businessinsider.com/ai-usage-limits-causing-some-to-restructure-their-workday-2026-4",
      },
    ],
    visible: true,
    order: 50,
  },
  {
    slug: "i-built-a-monitor-for-my-claude-code-sessions",
    title: "i built a monitor for my claude code sessions",
    date: "2026-04-07",
    tags: ["claude-code", "claudemon", "observability", "building"],
    preview:
      "claude code has no dashboard for parallel sessions, so i'm building claudemon.",
    body: "At any given time I've got like 3-5 Claude Code sessions running across different projects. One on a side project, one doing a refactor I kicked off before dinner, one on something else I already forgot about. And I have no idea what any of them are doing.\n\nClaude Code doesn't have a dashboard. There's no \"what are all your agents doing\" view. You get one terminal per session. If you're not staring at it, you're blind.\n\nSo I started building something. I'm calling it Claudemon.",
    sourceLinks: [],
    visible: true,
    order: 49,
  },
  {
    slug: "stop-ending-your-day-with-fix-the-bug",
    title: 'stop ending your day with "fix the bug"',
    date: "2026-04-07",
    tags: ["claude-code", "productivity", "ai-tools"],
    preview:
      "vague todos waste context. specific prompts let claude code start from the right file.",
    body: 'I used to end my day with todos like "fix auth" and "clean up API" and then wake up the next morning having no idea what I actually meant.\n\nFix auth how? Which auth? The login flow? The token refresh? The middleware? I\'d spend the first 20 minutes of my next session just rebuilding the context I had the night before.\n\nThis is 10x worse with Claude Code. When you hand a vague todo to an AI coding agent, it doesn\'t just lose context. It actively goes searching for context.',
    sourceLinks: [],
    visible: true,
    order: 48,
  },
  {
    slug: "jpegmafia-is-our-kanye-west",
    title: "jpegmafia is our kanye west",
    date: "2026-02-12",
    tags: ["music", "product", "execution"],
    preview:
      "a short note on taste, consensus, feedback, and shipping with strong defaults.",
    body: "Teams often over-index on being understood early\n\nThe highest leverage work often looks wrong in public before it looks obvious in hindsight\n\nJPEGMAFIA reminds me of that builder pattern\n\n- hard constraints\n- aggressive iteration\n- distinct taste\n- zero permission waiting\n\nConsensus can improve distribution, but it rarely creates a category-defining product",
    sourceLinks: [],
    visible: true,
    order: 47,
  },
  {
    slug: "search-will-be-dead-by-2030",
    title: "search will be dead by 2030",
    date: "2026-01-31",
    tags: ["ai", "search", "product"],
    preview:
      "search does not disappear. the main interface collapses into agents, memory, retrieval, and synthesis.",
    body: "Classic search assumes users can translate intent into keywords\n\nThe next interface assumes the system already understands intent from context and history\n\nWhat changes first:\n\n- query boxes become fallback UX\n- ranking systems become orchestration systems\n- links become evidence, not destination\n\nSearch is not dead as infrastructure\n\nSearch is dead as a primary interaction model",
    sourceLinks: [],
    visible: true,
    order: 46,
  },
];

function coerceNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.trunc(value)
    : fallback;
}

function normalizeSlug(value: unknown, fallback = "untitled"): string {
  const raw = coerceString(value, fallback)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return (raw || fallback).slice(0, CMS_TEXT_LIMITS.slug);
}

export function cmsProjectPageKey(slug: string): string {
  return `project:${normalizeSlug(slug, "project")}`;
}

export function cmsWritingPageKey(slug: string): string {
  return `writing:${normalizeSlug(slug, "writing")}`;
}

function normalizeTags(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .filter((tag): tag is string => typeof tag === "string")
      .map((tag) => tag.trim().toLowerCase())
      .filter(Boolean)
      .slice(0, 12);
  }
  if (typeof value === "string") {
    const parsed = parseJsonArray<string>(value);
    if (parsed.length > 0) return normalizeTags(parsed);
    return value
      .split(",")
      .map((tag) => tag.trim().toLowerCase())
      .filter(Boolean)
      .slice(0, 12);
  }
  return [];
}

function normalizeLinks(value: unknown): CmsEditorLink[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((link): link is Record<string, unknown> =>
      Boolean(link && typeof link === "object"),
    )
    .map((link) => ({
      label: coerceString(link.label, "").trim(),
      url: coerceString(link.url ?? link.href, "").trim(),
    }))
    .filter((link) => link.label || link.url)
    .slice(0, 4);
}

function isSafeCmsUrl(url: string): boolean {
  if (!url || /[\u0000-\u001f\u007f\s]/.test(url)) return false;
  if (url.startsWith("/")) return !url.startsWith("//");
  if (!url.startsWith("https://") && !url.startsWith("mailto:")) return false;
  try {
    const parsed = new URL(url);
    return ["https:", "mailto:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}

function validateCmsString(
  value: string,
  label: string,
  maxLength: number,
  required = true,
): string | null {
  if (required && !value.trim()) return `${label} is required`;
  if (value.length > maxLength) return `${label} is too long`;
  return null;
}

function validateCmsLinks(
  links: CmsEditorLink[],
  owner: string,
): string | null {
  for (const link of links) {
    const error =
      validateCmsString(
        link.label,
        `${owner} link label`,
        CMS_TEXT_LIMITS.linkLabel,
      ) ??
      validateCmsString(link.url, `${owner} link`, CMS_TEXT_LIMITS.linkUrl) ??
      (!isSafeCmsUrl(link.url)
        ? `${owner} link must start with /, https://, or mailto:`
        : null);
    if (error) return error;
  }
  return null;
}

function normalizeProjectStatus(value: unknown): CmsProjectContent["status"] {
  const status = coerceString(value, "wip").trim().toLowerCase();
  if (status === "live") return "live";
  if (status === "archived") return "archived";
  return "wip";
}

export function normalizeCmsProject(
  project: unknown,
  fallback?: Partial<CmsProjectContent>,
): CmsProjectContent {
  const source =
    project && typeof project === "object"
      ? (project as Record<string, unknown>)
      : {};
  const links = normalizeLinks(source.links);
  if (typeof source.link_live === "string" && source.link_live.trim()) {
    links.push({ label: "live site", url: source.link_live.trim() });
  }
  if (typeof source.link_repo === "string" && source.link_repo.trim()) {
    links.push({ label: "source", url: source.link_repo.trim() });
  }

  return {
    id: coerceString(source.id, fallback?.id ?? "") || undefined,
    slug: normalizeSlug(source.slug, fallback?.slug ?? "project"),
    title: coerceString(source.title, fallback?.title ?? "").trim(),
    status: normalizeProjectStatus(source.status ?? fallback?.status),
    year: coerceString(source.year, fallback?.year ?? "").trim(),
    range: coerceString(
      source.range ?? source.duration,
      fallback?.range ?? "",
    ).trim(),
    tags: normalizeTags(source.tags ?? fallback?.tags),
    summary: coerceString(
      source.summary ?? source.subtitle,
      fallback?.summary ?? "",
    ).trim(),
    body: coerceString(
      source.body ?? source.description,
      fallback?.body ?? "",
    ).trim(),
    links: links.slice(0, 4),
    featured: coerceBoolean(source.featured, fallback?.featured ?? false),
    order: coerceNumber(
      source.order ?? source.sort_order,
      fallback?.order ?? 0,
    ),
    visible: coerceBoolean(source.visible, fallback?.visible ?? true),
    updated_at:
      coerceString(source.updated_at, fallback?.updated_at ?? "") || null,
  };
}

export function validateCmsProject(project: CmsProjectContent): {
  ok: boolean;
  error?: string;
} {
  const error =
    validateCmsString(project.slug, "Project slug", CMS_TEXT_LIMITS.slug) ??
    validateCmsString(project.title, "Project title", CMS_TEXT_LIMITS.title) ??
    validateCmsString(project.year, "Project year", CMS_TEXT_LIMITS.year) ??
    validateCmsString(project.range, "Project range", CMS_TEXT_LIMITS.range) ??
    validateCmsString(
      project.summary,
      "Project summary",
      CMS_TEXT_LIMITS.summary,
    ) ??
    validateCmsString(project.body, "Project body", CMS_TEXT_LIMITS.body) ??
    project.tags
      .map((tag) =>
        validateCmsString(tag, "Project tag", CMS_TEXT_LIMITS.tag, true),
      )
      .find(Boolean) ??
    validateCmsLinks(project.links, "Project");
  return error ? { ok: false, error } : { ok: true };
}

export function normalizeCmsWriting(
  writing: unknown,
  fallback?: Partial<CmsWritingContent>,
): CmsWritingContent {
  const source =
    writing && typeof writing === "object"
      ? (writing as Record<string, unknown>)
      : {};
  const published = coerceBoolean(source.published, fallback?.visible ?? false);
  const status = coerceString(source.status, published ? "published" : "draft");

  return {
    id: coerceString(source.id, fallback?.id ?? "") || undefined,
    slug: normalizeSlug(source.slug, fallback?.slug ?? "writing"),
    title: coerceString(source.title, fallback?.title ?? "").trim(),
    date: coerceString(
      source.date ?? source.published_at ?? source.created_at,
      fallback?.date ?? "",
    ).trim(),
    tags: normalizeTags(source.tags ?? fallback?.tags),
    preview: coerceString(
      source.preview ?? source.summary,
      fallback?.preview ?? "",
    ).trim(),
    body: coerceString(
      source.body ?? source.content,
      fallback?.body ?? "",
    ).trim(),
    sourceLinks: normalizeLinks(
      source.sourceLinks ??
        (source.artifact_url
          ? [
              {
                label: coerceString(source.artifact_type, "source"),
                url: source.artifact_url,
              },
            ]
          : fallback?.sourceLinks),
    ),
    visible:
      source.visible === undefined
        ? status === "published"
        : coerceBoolean(source.visible, false),
    order: coerceNumber(source.order, fallback?.order ?? 0),
    updated_at:
      coerceString(source.updated_at, fallback?.updated_at ?? "") || null,
  };
}

export function validateCmsWriting(writing: CmsWritingContent): {
  ok: boolean;
  error?: string;
} {
  const error =
    validateCmsString(writing.slug, "Writing slug", CMS_TEXT_LIMITS.slug) ??
    validateCmsString(writing.title, "Writing title", CMS_TEXT_LIMITS.title) ??
    validateCmsString(writing.date, "Writing date", CMS_TEXT_LIMITS.year) ??
    validateCmsString(
      writing.preview,
      "Writing preview",
      CMS_TEXT_LIMITS.summary,
    ) ??
    validateCmsString(writing.body, "Writing body", CMS_TEXT_LIMITS.body) ??
    writing.tags
      .map((tag) =>
        validateCmsString(tag, "Writing tag", CMS_TEXT_LIMITS.tag, true),
      )
      .find(Boolean) ??
    validateCmsLinks(writing.sourceLinks, "Writing");
  return error ? { ok: false, error } : { ok: true };
}

export function normalizeNewsletterContent(
  content: unknown,
): NewsletterContent {
  const source =
    content && typeof content === "object"
      ? (content as Record<string, unknown>)
      : {};
  return {
    headline: coerceString(
      source.headline,
      DEFAULT_NEWSLETTER_CONTENT.headline,
    ).trim(),
    deck: coerceString(source.deck, DEFAULT_NEWSLETTER_CONTENT.deck).trim(),
    cta_label: coerceString(
      source.cta_label,
      DEFAULT_NEWSLETTER_CONTENT.cta_label,
    ).trim(),
    success_message: coerceString(
      source.success_message,
      DEFAULT_NEWSLETTER_CONTENT.success_message,
    ).trim(),
    error_message: coerceString(
      source.error_message,
      DEFAULT_NEWSLETTER_CONTENT.error_message,
    ).trim(),
    footer_text: coerceString(
      source.footer_text,
      DEFAULT_NEWSLETTER_CONTENT.footer_text,
    ).trim(),
    buttondown_url: coerceString(
      source.buttondown_url,
      DEFAULT_NEWSLETTER_CONTENT.buttondown_url,
    ).trim(),
    sender_name: coerceString(
      source.sender_name,
      DEFAULT_NEWSLETTER_CONTENT.sender_name,
    ).trim(),
    sender_email: coerceString(
      source.sender_email,
      DEFAULT_NEWSLETTER_CONTENT.sender_email,
    ).trim(),
    reply_to: coerceString(
      source.reply_to,
      DEFAULT_NEWSLETTER_CONTENT.reply_to,
    ).trim(),
  };
}

export function validateNewsletterContent(content: NewsletterContent): {
  ok: boolean;
  error?: string;
} {
  const error =
    validateCmsString(
      content.headline,
      "Newsletter headline",
      CMS_TEXT_LIMITS.newsletterHeadline,
    ) ??
    validateCmsString(
      content.deck,
      "Newsletter deck",
      CMS_TEXT_LIMITS.newsletterDeck,
    ) ??
    validateCmsString(
      content.cta_label,
      "Newsletter button",
      CMS_TEXT_LIMITS.linkLabel,
    ) ??
    validateCmsString(
      content.success_message,
      "Newsletter success message",
      CMS_TEXT_LIMITS.newsletterDeck,
    ) ??
    validateCmsString(
      content.error_message,
      "Newsletter error message",
      CMS_TEXT_LIMITS.newsletterDeck,
    ) ??
    validateCmsString(
      content.footer_text,
      "Newsletter footer",
      CMS_TEXT_LIMITS.newsletterFooter,
      false,
    ) ??
    validateCmsString(
      content.buttondown_url,
      "Newsletter URL",
      CMS_TEXT_LIMITS.linkUrl,
      false,
    ) ??
    validateCmsString(
      content.sender_name,
      "Sender name",
      CMS_TEXT_LIMITS.sender,
    ) ??
    validateCmsString(
      content.sender_email,
      "Sender email",
      CMS_TEXT_LIMITS.sender,
    ) ??
    validateCmsString(content.reply_to, "Reply-to", CMS_TEXT_LIMITS.sender);
  if (error) return { ok: false, error };
  if (content.buttondown_url && !isSafeCmsUrl(content.buttondown_url)) {
    return { ok: false, error: "Newsletter URL is invalid" };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(content.sender_email)) {
    return { ok: false, error: "Sender email is invalid" };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(content.reply_to)) {
    return { ok: false, error: "Reply-to is invalid" };
  }
  return { ok: true };
}

function pageMeta(page: PageContent<unknown> | null): CmsEditorMeta {
  return {
    source: page ? "cms" : "fallback",
    updated_at: page?.updated_at ?? null,
    version: page?.version ?? null,
  };
}

async function fetchProjectEditorContent(
  fallback: CmsProjectContent,
): Promise<CmsProjectContent> {
  const page = await fetchPageContent<CmsProjectContent>(
    cmsProjectPageKey(fallback.slug),
  );
  if (!page) return fallback;
  return {
    ...normalizeCmsProject(page.content, fallback),
    updated_at: page.updated_at,
  };
}

async function fetchWritingEditorContent(
  fallback: CmsWritingContent,
): Promise<CmsWritingContent> {
  const page = await fetchPageContent<CmsWritingContent>(
    cmsWritingPageKey(fallback.slug),
  );
  if (!page) return fallback;
  return {
    ...normalizeCmsWriting(page.content, fallback),
    updated_at: page.updated_at,
  };
}

export async function fetchCmsEditorSnapshot(): Promise<CmsEditorSnapshot> {
  const [homePage, newsletterPage, projects, writing] = await Promise.all([
    fetchPageContent<HomepageContent>("home"),
    fetchPageContent<NewsletterContent>("newsletter"),
    Promise.all(DEFAULT_CMS_PROJECTS.map(fetchProjectEditorContent)),
    Promise.all(DEFAULT_CMS_WRITING.map(fetchWritingEditorContent)),
  ]);

  return {
    homepage: normalizeHomepageContent(homePage?.content),
    homepageMeta: pageMeta(homePage as PageContent<unknown> | null),
    projects: projects.sort((a, b) => b.order - a.order),
    writing: writing.sort((a, b) => b.order - a.order),
    newsletter: normalizeNewsletterContent(newsletterPage?.content),
    newsletterMeta: pageMeta(newsletterPage as PageContent<unknown> | null),
  };
}

// ---------------------------------------------------------------------------
// Page content
// ---------------------------------------------------------------------------

export async function fetchPageContent<T = unknown>(
  pageKey: string,
): Promise<PageContent<T> | null> {
  const db = getDrizzle();
  if (db) {
    try {
      const rows = await db
        .select()
        .from(s.pageContent)
        .where(
          and(
            eq(s.pageContent.page_key, pageKey),
            eq(s.pageContent.published, true),
          ),
        )
        .orderBy(desc(s.pageContent.version))
        .limit(1);
      const row = rows[0];
      if (!row) return null;
      return {
        id: row.id,
        page_key: row.page_key,
        content: parseJson<T>(row.content) as T,
        version: row.version ?? 1,
        published: row.published ?? false,
        updated_at: row.updated_at ?? "",
        updated_by: row.updated_by ?? null,
        created_at: row.created_at ?? "",
      };
    } catch (err) {
      logger.error("cms", `D1 fetchPageContent("${pageKey}") failed`, {
        error: String(err),
      });
      return null;
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------

export async function fetchProjects(options?: {
  featured?: boolean;
  category?: ProjectCategory;
  visible?: boolean;
  limit?: number;
}): Promise<Project[]> {
  const db = getDrizzle();
  if (db) {
    try {
      const conditions = [];
      const visibleFilter = options?.visible ?? true;
      if (visibleFilter) {
        conditions.push(eq(s.projects.visible, true));
      }
      if (options?.featured !== undefined) {
        conditions.push(eq(s.projects.featured, options.featured));
      }
      if (options?.category) {
        conditions.push(eq(s.projects.category, options.category));
      }

      const whereClause =
        conditions.length > 0 ? and(...conditions) : undefined;

      const results = await db
        .select()
        .from(s.projects)
        .where(whereClause)
        .orderBy(asc(s.projects.sort_order))
        .limit(options?.limit ?? 1000);

      if (results.length === 0) return FALLBACK_PROJECTS;
      return results.map((row) =>
        projectRowToProject({
          ...row,
          subtitle: row.subtitle ?? "",
          description: row.description ?? "",
          year: row.year ?? "",
          category: (row.category ?? "project") as Project["category"],
          role: row.role ?? "",
          duration: row.duration ?? "",
          tags: parseJsonArray(row.tags),
          status: (row.status ?? "live") as
            | "live"
            | "in-progress"
            | "coming-soon",
          featured: row.featured ?? false,
          visible: row.visible ?? true,
          sort_order: row.sort_order ?? 0,
          created_at: row.created_at ?? "",
          updated_at: row.updated_at ?? "",
        }),
      );
    } catch (err) {
      logger.warn("cms", "D1 fetchProjects() failed, using fallback", {
        error: String(err),
      });
      return FALLBACK_PROJECTS;
    }
  }

  return FALLBACK_PROJECTS;
}

// ---------------------------------------------------------------------------
// Writing (D1 table: thoughts)
// ---------------------------------------------------------------------------

export type { ThoughtSummary, WritingSummary } from "@anipotts/types";

export async function fetchWriting(options?: {
  published?: boolean;
  limit?: number;
}): Promise<WritingSummary[]> {
  const db = getDrizzle();
  if (db) {
    try {
      const conditions = [];
      if (options?.published !== undefined) {
        conditions.push(eq(s.thoughts.published, options.published));
      }

      const whereClause =
        conditions.length > 0 ? and(...conditions) : undefined;

      const results = await db
        .select({
          slug: s.thoughts.slug,
          title: s.thoughts.title,
          summary: s.thoughts.summary,
          created_at: s.thoughts.created_at,
          views: s.thoughts.views,
          id: s.thoughts.id,
          series_type: s.thoughts.series_type,
          tags: s.thoughts.tags,
        })
        .from(s.thoughts)
        .where(whereClause)
        .orderBy(desc(s.thoughts.created_at))
        .limit(options?.limit ?? 1000);
      return results.map((row) => ({
        slug: row.slug,
        title: row.title,
        summary: row.summary ?? "",
        created_at: row.created_at ?? "",
        views: row.views ?? undefined,
        id: row.id ?? undefined,
        series_type: row.series_type as WritingSummary["series_type"],
        tags: parseJsonArray(row.tags),
      }));
    } catch (err) {
      logger.warn("cms", "D1 fetchWriting() failed, using fallback", {
        error: String(err),
      });
      return [];
    }
  }

  return [];
}

export const fetchThoughts = fetchWriting;

export async function searchWriting(query: string): Promise<WritingSummary[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const d1 = getDB();
  if (d1) {
    try {
      // FTS5 phrase search keeps user input from being interpreted as MATCH syntax.
      const phrase = `"${trimmed.replaceAll('"', '""')}"`;

      // FTS5 search: must use raw SQL (Drizzle doesn't support FTS5 MATCH)
      const { results } = await d1
        .prepare(
          `SELECT t.slug, t.title, t.summary, t.created_at, t.published_at, t.views, t.id, t.series_type, t.tags,
                  rank
           FROM thoughts_fts fts
           JOIN thoughts t ON t.rowid = fts.rowid
           WHERE thoughts_fts MATCH ?
             AND (t.status = 'published' OR t.published = 1)
           ORDER BY rank
           LIMIT 20`,
        )
        .bind(phrase)
        .all<Record<string, unknown>>();
      return (results ?? []).map((row) => ({
        slug: row.slug as string,
        title: row.title as string,
        summary: (row.summary as string) ?? "",
        created_at: (row.created_at as string) ?? "",
        published_at: row.published_at as string | undefined,
        views: row.views as number | undefined,
        id: row.id as string | undefined,
        series_type: row.series_type as WritingSummary["series_type"],
        tags: parseJsonArray(row.tags),
      }));
    } catch (err) {
      logger.warn("cms", "D1 searchWriting() failed", { error: String(err) });
      return [];
    }
  }

  return [];
}

export const searchThoughts = searchWriting;

// ---------------------------------------------------------------------------
// Social links
// ---------------------------------------------------------------------------

export async function fetchSocialLinks(): Promise<SocialLink[]> {
  const db = getDrizzle();
  if (db) {
    try {
      const results = await db
        .select()
        .from(s.socialLinks)
        .where(eq(s.socialLinks.visible, true))
        .orderBy(asc(s.socialLinks.sort_order));
      if (results.length === 0) return FALLBACK_SOCIAL_LINKS;
      return results.map((row) => ({
        name: row.name,
        url: row.url,
        icon: row.icon,
        description: row.description ?? undefined,
      }));
    } catch (err) {
      logger.warn("cms", "D1 fetchSocialLinks() failed, using fallback", {
        error: String(err),
      });
      return FALLBACK_SOCIAL_LINKS;
    }
  }

  return FALLBACK_SOCIAL_LINKS;
}

// ---------------------------------------------------------------------------
// Site settings
// ---------------------------------------------------------------------------

export async function fetchSiteSetting(key: string): Promise<string | null> {
  const db = getDrizzle();
  if (db) {
    try {
      const rows = await db
        .select({ value: s.siteSettings.value })
        .from(s.siteSettings)
        .where(eq(s.siteSettings.key, key));
      return rows[0]?.value ?? null;
    } catch (err) {
      logger.warn("cms", `D1 fetchSiteSetting("${key}") failed`, {
        error: String(err),
      });
      return null;
    }
  }

  return null;
}

export async function fetchAllSiteSettings(): Promise<SiteSettingsMap> {
  const db = getDrizzle();
  if (db) {
    try {
      const results = await db
        .select({ key: s.siteSettings.key, value: s.siteSettings.value })
        .from(s.siteSettings);
      const map: SiteSettingsMap = {};
      for (const row of results) {
        map[row.key] = row.value;
      }
      return map;
    } catch (err) {
      logger.warn("cms", "D1 fetchAllSiteSettings() failed", {
        error: String(err),
      });
      return {};
    }
  }

  return {};
}

// ---------------------------------------------------------------------------
// Merged site config (CMS overrides static defaults)
// ---------------------------------------------------------------------------

export async function fetchSiteConfig(): Promise<{
  name: string;
  fullName: string;
  title: string;
  location: string;
  bio: string;
  shortBio: string;
  domain: string;
  url: string;
  email: string;
  handle: string;
  github: string;
  headshot: string;
  ogImage: string;
}> {
  const { site } = await import("../data/site");
  const settings = await fetchAllSiteSettings();
  return {
    ...site,
    name: settings.site_name || site.name,
    title: settings.site_title || site.title,
    location: settings.site_location || site.location,
    bio: settings.site_bio || site.bio,
    shortBio: settings.site_short_bio || site.shortBio,
    email: settings.site_email || site.email,
  };
}
