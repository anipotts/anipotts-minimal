import type {
  HomepageContent,
  HomepageSection,
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
import { projects as FALLBACK_PROJECTS } from "../data/projects";
import { socialLinks as FALLBACK_SOCIAL_LINKS } from "../data/social";
import { getDrizzle, getDB, parseJsonArray, parseJson } from "../db";
import * as s from "../db/schema";
import {
  DEFAULT_CMS_PROJECTS,
  DEFAULT_CMS_WRITING,
  DEFAULT_HOMEPAGE_CONTENT,
  HOMEPAGE_FIELD_LIMITS,
  HOME_SECTION_ORDER,
} from "./defaults";
import {
  cmsProjectPageKey,
  cmsWritingPageKey,
  normalizeCmsProject,
  normalizeCmsWriting,
  normalizeNewsletterContent,
} from "./editor";

export {
  DEFAULT_CMS_PROJECTS,
  DEFAULT_CMS_WRITING,
  DEFAULT_HOMEPAGE_CONTENT,
  DEFAULT_NEWSLETTER_CONTENT,
} from "./defaults";
export {
  cmsProjectPageKey,
  cmsWritingPageKey,
  normalizeCmsProject,
  normalizeCmsWriting,
  normalizeNewsletterContent,
  validateCmsProject,
  validateCmsWriting,
  validateNewsletterContent,
} from "./editor";

// ---------------------------------------------------------------------------
// Homepage content
// ---------------------------------------------------------------------------

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
