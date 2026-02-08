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
