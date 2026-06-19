import type {
  HomepageContent,
  CmsEditorMeta,
  CmsEditorSnapshot,
  CmsProjectContent,
  CmsWritingContent,
  NewsletterContent,
  PageContent,
  Project,
  ProjectCategory,
  WritingSummary,
} from "@anipotts/types";
import { projectRowToProject } from "@anipotts/types";
import { eq, desc, asc, and } from "drizzle-orm";
import { logger } from "../logger";
import { projects as FALLBACK_PROJECTS } from "../data/projects";
import { getDrizzle, getDB, parseJsonArray, parseJson } from "../db";
import * as s from "../db/schema";
import { DEFAULT_CMS_PROJECTS, DEFAULT_CMS_WRITING } from "./defaults";
import {
  cmsProjectPageKey,
  cmsWritingPageKey,
  normalizeCmsProject,
  normalizeCmsWriting,
  normalizeNewsletterContent,
} from "./editor";
import { normalizeHomepageContent } from "./homepage";

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
export { normalizeHomepageContent, validateHomepageContent } from "./homepage";
export {
  fetchAllSiteSettings,
  fetchSiteConfig,
  fetchSiteSetting,
  fetchSocialLinks,
} from "./settings";

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
