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
  ThoughtSummary,
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
        "previously built ai agents at structured ai and our bad habit, an atlantic records venture. every now and then i post about what i'm doing with claude code and codex",
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
      label: "shipping",
      heading: "",
      limit: 4,
      links: [{ label: "view all", href: "/shipping" }],
      view_all: "/shipping",
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

  const thoughtsError =
    validateSectionLabel(latest_thoughts, "Thoughts label") ??
    validateSectionLink(latest_thoughts, "Thoughts");
  if (thoughtsError) return { ok: false, error: thoughtsError };

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

export async function fetchCmsEditorSnapshot(): Promise<CmsEditorSnapshot> {
  const [homePage, newsletterPage] = await Promise.all([
    fetchPageContent<HomepageContent>("home"),
    fetchPageContent<NewsletterContent>("newsletter"),
  ]);

  const projects: CmsProjectContent[] = [];
  const writing: CmsWritingContent[] = [];
  const d1 = getDB();
  if (d1) {
    try {
      const { results } = await d1
        .prepare(
          `SELECT id, slug, title, status, year, duration, tags, subtitle, description,
                  link_live, link_repo, link_page, featured, sort_order, visible, updated_at
           FROM projects
           ORDER BY sort_order DESC, updated_at DESC, title ASC`,
        )
        .all<Record<string, unknown>>();
      projects.push(
        ...(results ?? []).map((row) =>
          normalizeCmsProject({
            ...row,
            tags: parseJsonArray(row.tags),
            range: row.duration,
            summary: row.subtitle,
            body: row.description,
            order: row.sort_order,
            links: [
              row.link_live
                ? { label: "live site", url: String(row.link_live) }
                : null,
              row.link_repo
                ? { label: "source", url: String(row.link_repo) }
                : null,
              row.link_page
                ? { label: "page", url: String(row.link_page) }
                : null,
            ].filter(Boolean),
          }),
        ),
      );
    } catch (err) {
      logger.warn("cms", "D1 fetch editor projects failed", {
        error: String(err),
      });
    }

    try {
      const { results } = await d1
        .prepare(
          `SELECT id, slug, title, summary, content, tags, created_at, updated_at,
                  published_at, published, status, artifact_url, artifact_type
           FROM thoughts
           ORDER BY COALESCE(published_at, updated_at, created_at) DESC`,
        )
        .all<Record<string, unknown>>();
      writing.push(
        ...(results ?? []).map((row, index) =>
          normalizeCmsWriting({
            ...row,
            tags: parseJsonArray(row.tags),
            date: row.published_at ?? row.created_at,
            preview: row.summary,
            body: row.content,
            visible: Boolean(row.published) || row.status === "published",
            order: index,
            sourceLinks: row.artifact_url
              ? [
                  {
                    label: coerceString(row.artifact_type, "source"),
                    url: String(row.artifact_url),
                  },
                ]
              : [],
          }),
        ),
      );
    } catch (err) {
      logger.warn("cms", "D1 fetch editor writing failed", {
        error: String(err),
      });
    }
  }

  return {
    homepage: normalizeHomepageContent(homePage?.content),
    homepageMeta: pageMeta(homePage as PageContent<unknown> | null),
    projects,
    writing,
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
// Thoughts
// ---------------------------------------------------------------------------

export type { ThoughtSummary } from "@anipotts/types";

export async function fetchThoughts(options?: {
  published?: boolean;
  limit?: number;
}): Promise<ThoughtSummary[]> {
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
        series_type: row.series_type as ThoughtSummary["series_type"],
        tags: parseJsonArray(row.tags),
      }));
    } catch (err) {
      logger.warn("cms", "D1 fetchThoughts() failed, using fallback", {
        error: String(err),
      });
      return [];
    }
  }

  return [];
}

export async function searchThoughts(query: string): Promise<ThoughtSummary[]> {
  const d1 = getDB();
  if (d1) {
    try {
      // FTS5 search: must use raw SQL (Drizzle doesn't support FTS5 MATCH)
      const { results } = await d1
        .prepare(
          `SELECT t.slug, t.title, t.summary, t.created_at, t.views, t.id, t.series_type, t.tags,
                  rank
           FROM thoughts_fts fts
           JOIN thoughts t ON t.rowid = fts.rowid
           WHERE thoughts_fts MATCH ?
             AND t.published = 1
           ORDER BY rank
           LIMIT 20`,
        )
        .bind(query)
        .all<Record<string, unknown>>();
      return (results ?? []).map((row) => ({
        slug: row.slug as string,
        title: row.title as string,
        summary: (row.summary as string) ?? "",
        created_at: (row.created_at as string) ?? "",
        views: row.views as number | undefined,
        id: row.id as string | undefined,
        series_type: row.series_type as ThoughtSummary["series_type"],
        tags: parseJsonArray(row.tags),
      }));
    } catch (err) {
      logger.warn("cms", "D1 searchThoughts() failed", { error: String(err) });
      return [];
    }
  }

  return [];
}

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
