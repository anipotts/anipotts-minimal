import type {
  PageContent,
  ProjectRow,
  SocialLinkRow,
  SiteSettingsMap,
} from "@anipotts/types";
import { projectRowToProject } from "@anipotts/types";
import { supabase } from "../supabase";
import { FALLBACK_PROJECTS } from "../data/projects";
import { FALLBACK_SOCIAL_LINKS } from "../data/social";

// ---------------------------------------------------------------------------
// Page content
// ---------------------------------------------------------------------------

export async function fetchPageContent<T = unknown>(
  pageKey: string
): Promise<PageContent<T> | null> {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from("page_content")
      .select("*")
      .eq("page_key", pageKey)
      .eq("published", true)
      .order("version", { ascending: false })
      .limit(1)
      .single();

    if (error) throw error;
    return data as PageContent<T>;
  } catch (err) {
    console.warn(`[cms] fetchPageContent("${pageKey}") unavailable, using fallback`);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------

export async function fetchProjects(options?: {
  featured?: boolean;
  category?: string;
  visible?: boolean;
  limit?: number;
}) {
  if (!supabase) return FALLBACK_PROJECTS;

  try {
    let query = supabase
      .from("projects")
      .select("*")
      .order("sort_order", { ascending: true });

    // Default to visible=true for public-facing queries
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

    return (data as ProjectRow[]).map(projectRowToProject);
  } catch (err) {
    console.warn("[cms] fetchProjects() unavailable, using fallback");
    return FALLBACK_PROJECTS;
  }
}

// ---------------------------------------------------------------------------
// Thoughts
// ---------------------------------------------------------------------------

export interface ThoughtSummary {
  slug: string;
  title: string;
  summary: string;
  created_at: string;
  views?: number;
}

export async function fetchThoughts(options?: {
  published?: boolean;
  limit?: number;
}): Promise<ThoughtSummary[]> {
  if (!supabase) return [];

  try {
    let query = supabase
      .from("thoughts")
      .select("slug, title, summary, created_at, views")
      .order("created_at", { ascending: false });

    if (options?.published !== undefined) {
      query = query.eq("published", options.published);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data as ThoughtSummary[]) ?? [];
  } catch (err) {
    console.warn("[cms] fetchThoughts() unavailable, using fallback");
    return [];
  }
}

// ---------------------------------------------------------------------------
// Social links
// ---------------------------------------------------------------------------

export async function fetchSocialLinks() {
  if (!supabase) return FALLBACK_SOCIAL_LINKS;

  try {
    const { data, error } = await supabase
      .from("social_links")
      .select("*")
      .eq("visible", true)
      .order("sort_order", { ascending: true });

    if (error) throw error;
    if (!data || data.length === 0) return FALLBACK_SOCIAL_LINKS;

    return (data as SocialLinkRow[]).map((row) => ({
      name: row.name,
      url: row.url,
      icon: row.icon,
      description: row.description ?? undefined,
    }));
  } catch (err) {
    console.warn("[cms] fetchSocialLinks() unavailable, using fallback");
    return FALLBACK_SOCIAL_LINKS;
  }
}

// ---------------------------------------------------------------------------
// Site settings
// ---------------------------------------------------------------------------

export async function fetchSiteSetting(
  key: string
): Promise<string | null> {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", key)
      .maybeSingle();

    if (error) throw error;
    return (data as { value: string } | null)?.value ?? null;
  } catch (err) {
    console.warn(`[cms] fetchSiteSetting("${key}") unavailable, using fallback`);
    return null;
  }
}

export async function fetchAllSiteSettings(): Promise<SiteSettingsMap> {
  if (!supabase) return {};

  try {
    const { data, error } = await supabase
      .from("site_settings")
      .select("key, value");

    if (error) throw error;
    if (!data) return {};

    const map: SiteSettingsMap = {};
    for (const row of data as { key: string; value: string }[]) {
      map[row.key] = row.value;
    }
    return map;
  } catch (err) {
    console.warn("[cms] fetchAllSiteSettings() unavailable, using fallback");
    return {};
  }
}

// ---------------------------------------------------------------------------
// Merged site config (CMS overrides static defaults)
// ---------------------------------------------------------------------------

export async function fetchSiteConfig() {
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
