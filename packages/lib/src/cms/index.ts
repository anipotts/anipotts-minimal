import type {
  PageContent,
  Project,
  ProjectCategory,
  SocialLink,
  SiteSettingsMap,
  ThoughtSummary,
} from "@anipotts/types";
import { projectRowToProject } from "@anipotts/types";
import { logger } from "../logger";
import { FALLBACK_PROJECTS } from "../data/projects";
import { FALLBACK_SOCIAL_LINKS } from "../data/social";
import { getDB, parseJsonArray, toBool, parseJson } from "../db";

// ---------------------------------------------------------------------------
// D1 row deserializers
// ---------------------------------------------------------------------------

function deserializeThoughtSummary(
  row: Record<string, unknown>,
): ThoughtSummary {
  return {
    slug: row.slug as string,
    title: row.title as string,
    summary: row.summary as string,
    created_at: row.created_at as string,
    views: row.views as number | undefined,
    id: row.id as string | undefined,
    series_type: row.series_type as ThoughtSummary["series_type"],
    tags: parseJsonArray(row.tags),
  };
}

function deserializeProject(row: Record<string, unknown>): Project {
  return projectRowToProject({
    id: row.id as string,
    slug: row.slug as string,
    title: row.title as string,
    subtitle: row.subtitle as string,
    description: row.description as string,
    year: row.year as string,
    category: row.category as Project["category"],
    role: row.role as string,
    duration: row.duration as string,
    tags: parseJsonArray(row.tags),
    status: row.status as string as "live" | "in-progress" | "coming-soon",
    featured: toBool(row.featured),
    icon: row.icon as string | null,
    image_url: row.image_url as string | null,
    thumbnail_url: row.thumbnail_url as string | null,
    link_live: row.link_live as string | null,
    link_repo: row.link_repo as string | null,
    link_page: row.link_page as string | null,
    sort_order: row.sort_order as number,
    visible: toBool(row.visible),
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  });
}

// ---------------------------------------------------------------------------
// Page content
// ---------------------------------------------------------------------------

export async function fetchPageContent<T = unknown>(
  pageKey: string,
): Promise<PageContent<T> | null> {
  const db = getDB();
  if (db) {
    try {
      const row = await db
        .prepare(
          "SELECT * FROM page_content WHERE page_key = ? AND published = 1 ORDER BY version DESC LIMIT 1",
        )
        .bind(pageKey)
        .first<Record<string, unknown>>();
      if (!row) return null;
      return {
        id: row.id as string,
        page_key: row.page_key as string,
        content: parseJson<T>(row.content) as T,
        version: row.version as number,
        published: toBool(row.published),
        updated_at: row.updated_at as string,
        updated_by: row.updated_by as string | null,
        created_at: row.created_at as string,
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
  const db = getDB();
  if (db) {
    try {
      let sql = "SELECT * FROM projects";
      const conditions: string[] = [];
      const params: unknown[] = [];

      const visibleFilter = options?.visible ?? true;
      if (visibleFilter) {
        conditions.push("visible = 1");
      }
      if (options?.featured !== undefined) {
        conditions.push("featured = ?");
        params.push(options.featured ? 1 : 0);
      }
      if (options?.category) {
        conditions.push("category = ?");
        params.push(options.category);
      }
      if (conditions.length > 0) {
        sql += " WHERE " + conditions.join(" AND ");
      }
      sql += " ORDER BY sort_order ASC";
      if (options?.limit) {
        sql += " LIMIT ?";
        params.push(options.limit);
      }

      const stmt = db.prepare(sql);
      const { results } = await (
        params.length > 0 ? stmt.bind(...params) : stmt
      ).all<Record<string, unknown>>();
      if (!results || results.length === 0) return FALLBACK_PROJECTS;
      return results.map(deserializeProject);
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
  const db = getDB();
  if (db) {
    try {
      let sql =
        "SELECT slug, title, summary, created_at, views, id, series_type, tags FROM thoughts";
      const conditions: string[] = [];
      const params: unknown[] = [];

      if (options?.published !== undefined) {
        conditions.push("published = ?");
        params.push(options.published ? 1 : 0);
      }
      if (conditions.length > 0) {
        sql += " WHERE " + conditions.join(" AND ");
      }
      sql += " ORDER BY created_at DESC";
      if (options?.limit) {
        sql += " LIMIT ?";
        params.push(options.limit);
      }

      const stmt = db.prepare(sql);
      const { results } = await (
        params.length > 0 ? stmt.bind(...params) : stmt
      ).all<Record<string, unknown>>();
      return (results ?? []).map(deserializeThoughtSummary);
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
  const db = getDB();
  if (db) {
    try {
      // FTS5 search across thoughts and projects, return thought matches
      const { results } = await db
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
      return (results ?? []).map(deserializeThoughtSummary);
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
  const db = getDB();
  if (db) {
    try {
      const { results } = await db
        .prepare(
          "SELECT * FROM social_links WHERE visible = 1 ORDER BY sort_order ASC",
        )
        .all<Record<string, unknown>>();
      if (!results || results.length === 0) return FALLBACK_SOCIAL_LINKS;
      return results.map((row) => ({
        name: row.name as string,
        url: row.url as string,
        icon: row.icon as string,
        description: (row.description as string) ?? undefined,
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
  const db = getDB();
  if (db) {
    try {
      const row = await db
        .prepare("SELECT value FROM site_settings WHERE key = ?")
        .bind(key)
        .first<{ value: string }>();
      return row?.value ?? null;
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
  const db = getDB();
  if (db) {
    try {
      const { results } = await db
        .prepare("SELECT key, value FROM site_settings")
        .all<{ key: string; value: string }>();
      const map: SiteSettingsMap = {};
      for (const row of results ?? []) {
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
