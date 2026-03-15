import type {
  PageContent,
  Project,
  ProjectCategory,
  SocialLink,
  SiteSettingsMap,
  ThoughtSummary,
} from "@anipotts/types";
import { projectRowToProject } from "@anipotts/types";
import { supabase } from "../supabase";
import { logger } from "../logger";
import { FALLBACK_PROJECTS } from "../data/projects";
import { FALLBACK_SOCIAL_LINKS } from "../data/social";

// ---------------------------------------------------------------------------
// Fetch-with-fallback helper (DRYs up the repeated try/catch/fallback pattern)
// ---------------------------------------------------------------------------

type SupabaseResult<T> = { data: T | null; error: unknown };

async function fetchWithFallback<T>(
  queryFn: (client: NonNullable<typeof supabase>) => Promise<SupabaseResult<T>>,
  fallback: T,
  context: string,
): Promise<T> {
  if (!supabase) {
    logger.warn("cms", `No Supabase client, using fallback for ${context}`);
    return fallback;
  }
  try {
    const { data, error } = await queryFn(supabase);
    if (error || data == null) {
      logger.warn("cms", `Query failed for ${context}, using fallback`, {
        error,
      });
      return fallback;
    }
    return data;
  } catch (err) {
    logger.error("cms", `Exception in ${context}, using fallback`, {
      error: String(err),
    });
    return fallback;
  }
}

// ---------------------------------------------------------------------------
// Page content
// ---------------------------------------------------------------------------

export async function fetchPageContent<T = unknown>(
  pageKey: string,
): Promise<PageContent<T> | null> {
  return fetchWithFallback<PageContent<T> | null>(
    async (client) => {
      const result = await client
        .from("page_content")
        .select("*")
        .eq("page_key", pageKey)
        .eq("published", true)
        .order("version", { ascending: false })
        .limit(1)
        .single();
      return {
        data: result.data as PageContent<T> | null,
        error: result.error,
      };
    },
    null,
    `fetchPageContent("${pageKey}")`,
  );
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
  if (!supabase) return FALLBACK_PROJECTS;

  try {
    let query = supabase
      .from("projects")
      .select("*")
      .order("sort_order", { ascending: true });

    const visibleFilter = options?.visible ?? true;
    if (visibleFilter) {
      query = query.eq("visible", true);
    }

    if (options?.featured !== undefined) {
      query = query.eq("featured", options.featured);
    }

    if (options?.category) {
      query = query.eq("category", options.category);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    if (!data || data.length === 0) return FALLBACK_PROJECTS;

    return data.map(projectRowToProject);
  } catch (err) {
    logger.warn("cms", "fetchProjects() unavailable, using fallback");
    return FALLBACK_PROJECTS;
  }
}

// ---------------------------------------------------------------------------
// Thoughts
// ---------------------------------------------------------------------------

export type { ThoughtSummary } from "@anipotts/types";

export async function fetchThoughts(options?: {
  published?: boolean;
  limit?: number;
}): Promise<ThoughtSummary[]> {
  if (!supabase) return [];

  try {
    let query = supabase
      .from("thoughts")
      .select("slug, title, summary, created_at, views, id, series_type, tags")
      .order("created_at", { ascending: false });

    if (options?.published !== undefined) {
      query = query.eq("published", options.published);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as ThoughtSummary[];
  } catch (err) {
    logger.warn("cms", "fetchThoughts() unavailable, using fallback");
    return [];
  }
}

export async function searchThoughts(query: string): Promise<ThoughtSummary[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase.rpc("search_content", {
      query,
      lim: 20,
    });
    if (error) throw error;
    if (!data) return [];

    const thoughtResults = data.filter((r) => r.type === "thought");
    if (thoughtResults.length === 0) return [];

    const slugs = thoughtResults.map((r) => r.slug);
    const { data: thoughts } = await supabase
      .from("thoughts")
      .select("slug, title, summary, created_at, views, id, series_type, tags")
      .eq("published", true)
      .in("slug", slugs);

    if (!thoughts) return [];

    const rankMap = new Map(thoughtResults.map((r) => [r.slug, r.rank]));
    return (thoughts as ThoughtSummary[]).sort(
      (a, b) => (rankMap.get(b.slug) ?? 0) - (rankMap.get(a.slug) ?? 0),
    );
  } catch (e) {
    logger.warn("cms", "searchThoughts() failed", { error: String(e) });
    return [];
  }
}

// ---------------------------------------------------------------------------
// Social links
// ---------------------------------------------------------------------------

export async function fetchSocialLinks(): Promise<SocialLink[]> {
  if (!supabase) return FALLBACK_SOCIAL_LINKS;

  try {
    const { data, error } = await supabase
      .from("social_links")
      .select("*")
      .eq("visible", true)
      .order("sort_order", { ascending: true });

    if (error) throw error;
    if (!data || data.length === 0) return FALLBACK_SOCIAL_LINKS;

    return data.map((row) => ({
      name: row.name,
      url: row.url,
      icon: row.icon,
      description: row.description ?? undefined,
    }));
  } catch (err) {
    logger.warn("cms", "fetchSocialLinks() unavailable, using fallback");
    return FALLBACK_SOCIAL_LINKS;
  }
}

// ---------------------------------------------------------------------------
// Site settings
// ---------------------------------------------------------------------------

export async function fetchSiteSetting(key: string): Promise<string | null> {
  return fetchWithFallback<string | null>(
    async (client) => {
      const { data, error } = await client
        .from("site_settings")
        .select("value")
        .eq("key", key)
        .maybeSingle();
      return { data: data?.value ?? null, error };
    },
    null,
    `fetchSiteSetting("${key}")`,
  );
}

export async function fetchAllSiteSettings(): Promise<SiteSettingsMap> {
  return fetchWithFallback<SiteSettingsMap>(
    async (client) => {
      const { data, error } = await client
        .from("site_settings")
        .select("key, value");
      if (error || !data) return { data: null, error };
      const map: SiteSettingsMap = {};
      for (const row of data) {
        map[row.key] = row.value;
      }
      return { data: map, error: null };
    },
    {},
    "fetchAllSiteSettings",
  );
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
