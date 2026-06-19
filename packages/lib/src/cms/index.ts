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
} from "@anipotts/types";
import { projectRowToProject } from "@anipotts/types";
import { eq, asc, and } from "drizzle-orm";
import { logger } from "../logger";
import { projects as FALLBACK_PROJECTS } from "../data/projects";
import { getDrizzle, parseJsonArray } from "../db";
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
import { fetchPageContent } from "./page";

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
export { fetchPageContent } from "./page";
export {
  fetchAllSiteSettings,
  fetchSiteConfig,
  fetchSiteSetting,
  fetchSocialLinks,
} from "./settings";
export { fetchWriting, searchWriting } from "./writing";

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

export type { ThoughtSummary, WritingSummary } from "@anipotts/types";
