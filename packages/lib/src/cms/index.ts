import type {
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
