"use server";

import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import type { Atom, Thought, ContentType, SeriesType, ContentStatus, VoiceMode, Platform, TypefullyDraft, TypefullyQueueSummary, PageContent, ProjectRow, SocialLinkRow } from "@anipotts/types";
import {
  ADMIN_COOKIE,
  ADMIN_COOKIE_OPTIONS,
  verifyAdminPassword,
  verifyAdminTotp,
  fetchAllThoughts,
  upsertThoughtRecord,
  deleteThoughtRecord,
  incrementThoughtViewCount,
  fetchThoughtStats,
} from "@anipotts/lib/admin";
import { adminLoginSchema } from "@anipotts/lib/validation";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase =
  supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// ============================================================================
// AUTH ACTIONS
// ============================================================================

export async function checkAuth() {
  const cookieStore = await cookies();
  return cookieStore.get(ADMIN_COOKIE)?.value === "true";
}

export async function login(input: { password: string; totp: string }) {
  const parsed = adminLoginSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid input" };
  }

  const { password, totp } = parsed.data;
  const passwordResult = verifyAdminPassword(password, process.env.ADMIN_PASSWORD);
  if (!passwordResult.success) {
    return passwordResult;
  }

  const totpSecret = process.env.ADMIN_TOTP_SECRET;
  if (process.env.NODE_ENV === "production" || totpSecret) {
    const totpResult = verifyAdminTotp(totp, totpSecret);
    if (!totpResult.success) {
      return totpResult;
    }
  }

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, "true", ADMIN_COOKIE_OPTIONS);
  return { success: true };
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE);
}

// ============================================================================
// CONTENT ACTIONS (Extended from thoughts)
// ============================================================================

export async function getAdminContent() {
  if (!supabase) return [];
  const isAuth = await checkAuth();
  if (!isAuth) return [];
  return fetchAllThoughts(supabase);
}

export async function upsertContent(content: Partial<Thought>) {
  if (!supabase) throw new Error("Supabase not configured");
  const isAuth = await checkAuth();
  if (!isAuth) throw new Error("Unauthorized");
  return upsertThoughtRecord(supabase, content);
}

export async function deleteContent(id: string) {
  if (!supabase) throw new Error("Supabase not configured");
  const isAuth = await checkAuth();
  if (!isAuth) throw new Error("Unauthorized");
  return deleteThoughtRecord(supabase, id);
}

export async function incrementContentViews(slug: string) {
  if (!supabase) return;
  return incrementThoughtViewCount(supabase, slug);
}

export async function getAdminStats() {
  if (!supabase) return null;
  const isAuth = await checkAuth();
  if (!isAuth) return null;
  return fetchThoughtStats(supabase);
}

// ============================================================================
// ATOM ACTIONS (Generated atoms from content)
// ============================================================================

export async function getContentAtoms(contentId: string) {
  if (!supabase) return [];
  const isAuth = await checkAuth();
  if (!isAuth) return [];

  try {
    const { data, error } = await supabase
      .from("atoms")
      .select("*")
      .eq("content_id", contentId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error("Error fetching atoms:", err);
    return [];
  }
}

export async function getAllAtoms() {
  if (!supabase) return [];
  const isAuth = await checkAuth();
  if (!isAuth) return [];

  try {
    const { data, error } = await supabase
      .from("atoms")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error("Error fetching atoms:", err);
    return [];
  }
}

export async function upsertAtom(atom: Partial<Atom>) {
  if (!supabase) throw new Error("Supabase not configured");
  const isAuth = await checkAuth();
  if (!isAuth) throw new Error("Unauthorized");

  try {
    const { data, error } = await supabase
      .from("atoms")
      .upsert([atom], { onConflict: "id" })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error("Error upserting atom:", err);
    throw err;
  }
}

export async function deleteAtom(id: string) {
  if (!supabase) throw new Error("Supabase not configured");
  const isAuth = await checkAuth();
  if (!isAuth) throw new Error("Unauthorized");

  try {
    const { error } = await supabase
      .from("atoms")
      .delete()
      .eq("id", id);

    if (error) throw error;
  } catch (err) {
    console.error("Error deleting atom:", err);
    throw err;
  }
}

// ============================================================================
// CONTENT TYPE ACTIONS
// ============================================================================

export async function updateContentMetadata(
  id: string,
  metadata: {
    content_type?: ContentType;
    series_type?: SeriesType;
    status?: ContentStatus;
    voice_mode?: VoiceMode;
    artifact_url?: string;
    platforms_targeted?: Platform[];
    platforms_posted?: Platform[];
  }
) {
  if (!supabase) throw new Error("Supabase not configured");
  const isAuth = await checkAuth();
  if (!isAuth) throw new Error("Unauthorized");

  try {
    const { data, error } = await supabase
      .from("thoughts")
      .update(metadata)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error("Error updating content metadata:", err);
    throw err;
  }
}

// ============================================================================
// TYPEFULLY ACTIONS
// ============================================================================

const TYPEFULLY_SOCIAL_SET_ID = 280784;

function getTypefullyApiKey(): string | null {
  return process.env.TYPEFULLY_API_KEY || null;
}

export async function checkTypefullyConnection(): Promise<{
  connected: boolean;
  error?: string;
}> {
  const isAuth = await checkAuth();
  if (!isAuth) return { connected: false, error: "Unauthorized" };

  const apiKey = getTypefullyApiKey();
  if (!apiKey) return { connected: false, error: "TYPEFULLY_API_KEY not set" };

  try {
    const { fetchTypefullyDrafts } = await import("@anipotts/lib/typefully");
    await fetchTypefullyDrafts(apiKey, TYPEFULLY_SOCIAL_SET_ID, { limit: 1 });
    return { connected: true };
  } catch (err) {
    return {
      connected: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

export async function getTypefullyQueue(): Promise<TypefullyQueueSummary | null> {
  const isAuth = await checkAuth();
  if (!isAuth) return null;

  const apiKey = getTypefullyApiKey();
  if (!apiKey) return null;

  try {
    const { fetchTypefullyQueueSummary } = await import(
      "@anipotts/lib/typefully"
    );
    return await fetchTypefullyQueueSummary(apiKey, TYPEFULLY_SOCIAL_SET_ID);
  } catch (err) {
    console.error("Error fetching Typefully queue:", err);
    return null;
  }
}

export async function getTypefullyDrafts(
  options?: { status?: string; sort?: string; limit?: number }
): Promise<TypefullyDraft[]> {
  const isAuth = await checkAuth();
  if (!isAuth) return [];

  const apiKey = getTypefullyApiKey();
  if (!apiKey) return [];

  try {
    const { fetchTypefullyDrafts } = await import("@anipotts/lib/typefully");
    return await fetchTypefullyDrafts(
      apiKey,
      TYPEFULLY_SOCIAL_SET_ID,
      options
    );
  } catch (err) {
    console.error("Error fetching Typefully drafts:", err);
    return [];
  }
}

export async function scheduleTypefullyDraftAction(
  draftId: number,
  time: string
): Promise<{ success: boolean; error?: string }> {
  const isAuth = await checkAuth();
  if (!isAuth) return { success: false, error: "Unauthorized" };

  const apiKey = getTypefullyApiKey();
  if (!apiKey) return { success: false, error: "TYPEFULLY_API_KEY not set" };

  try {
    const { scheduleTypefullyDraft } = await import("@anipotts/lib/typefully");
    await scheduleTypefullyDraft(
      apiKey,
      TYPEFULLY_SOCIAL_SET_ID,
      draftId,
      time
    );
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

export async function publishTypefullyDraftAction(
  draftId: number
): Promise<{ success: boolean; error?: string }> {
  const isAuth = await checkAuth();
  if (!isAuth) return { success: false, error: "Unauthorized" };

  const apiKey = getTypefullyApiKey();
  if (!apiKey) return { success: false, error: "TYPEFULLY_API_KEY not set" };

  try {
    const { publishTypefullyDraft } = await import("@anipotts/lib/typefully");
    await publishTypefullyDraft(apiKey, TYPEFULLY_SOCIAL_SET_ID, draftId);
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

export async function pushAtomToTypefully(
  atomId: string,
  options?: { platforms?: string[]; schedule?: string }
): Promise<{ success: boolean; draftId?: number; error?: string }> {
  const isAuth = await checkAuth();
  if (!isAuth) return { success: false, error: "Unauthorized" };
  if (!supabase) return { success: false, error: "Supabase not configured" };

  const apiKey = getTypefullyApiKey();
  if (!apiKey) return { success: false, error: "TYPEFULLY_API_KEY not set" };

  try {
    // Fetch atom
    const { data: atom, error: atomError } = await supabase
      .from("atoms")
      .select("*")
      .eq("id", atomId)
      .single();

    if (atomError || !atom) {
      return { success: false, error: "Atom not found" };
    }

    // Map platform names for Typefully API (twitter -> x)
    const platformMap: Record<string, string> = { twitter: "x" };
    const defaultPlatforms = [platformMap[atom.platform] || atom.platform];
    const platforms = options?.platforms ?? defaultPlatforms;

    const { createTypefullyDraft } = await import("@anipotts/lib/typefully");
    const draft = await createTypefullyDraft(
      apiKey,
      TYPEFULLY_SOCIAL_SET_ID,
      atom.atom_content,
      { platforms, schedule: options?.schedule }
    );

    // Update atom with typefully_draft_id
    await supabase
      .from("atoms")
      .update({
        typefully_draft_id: String(draft.id),
        status: options?.schedule ? "scheduled" : "draft",
      })
      .eq("id", atomId);

    return { success: true, draftId: draft.id };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

// ============================================================================
// CMS: PAGE CONTENT ACTIONS
// ============================================================================

export async function getPageContent(pageKey: string) {
  if (!supabase) return { success: false as const, error: "Supabase not configured" };
  const isAuth = await checkAuth();
  if (!isAuth) return { success: false as const, error: "Unauthorized" };

  try {
    const { data, error } = await supabase
      .from("page_content")
      .select("*")
      .eq("page_key", pageKey)
      .order("version", { ascending: false })
      .limit(1)
      .single();

    if (error) throw error;
    return { success: true as const, data: data as PageContent };
  } catch (err) {
    console.error("Error fetching page content:", err);
    return {
      success: false as const,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

export async function updatePageContent(
  pageKey: string,
  content: object,
  expectedVersion?: number
) {
  if (!supabase) return { success: false as const, error: "Supabase not configured" };
  const isAuth = await checkAuth();
  if (!isAuth) return { success: false as const, error: "Unauthorized" };

  try {
    // Fetch current row for optimistic concurrency + version history
    const { data: currentRow } = await supabase
      .from("page_content")
      .select("version, content, version_history, updated_at")
      .eq("page_key", pageKey)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();

    const typedRow = currentRow as {
      version: number;
      content: unknown;
      version_history: unknown[] | null;
      updated_at: string;
    } | null;

    const currentVersion = typedRow?.version ?? 0;

    if (expectedVersion !== undefined && currentVersion !== expectedVersion) {
      return {
        success: false as const,
        error: `Version conflict: expected ${expectedVersion}, found ${currentVersion}`,
      };
    }

    // Build version history: push current content as a snapshot before overwriting
    const existingHistory = Array.isArray(typedRow?.version_history)
      ? typedRow.version_history
      : [];

    const newHistory = typedRow
      ? [
          ...existingHistory,
          {
            version: currentVersion,
            content: typedRow.content,
            updated_at: typedRow.updated_at,
          },
        ]
      : existingHistory;

    const { data, error } = await supabase
      .from("page_content")
      .upsert(
        {
          page_key: pageKey,
          content,
          version: currentVersion + 1,
          version_history: newHistory,
          published: true,
          updated_at: new Date().toISOString(),
          updated_by: "admin",
        },
        { onConflict: "page_key" }
      )
      .select()
      .single();

    if (error) throw error;
    return { success: true as const, data: data as PageContent };
  } catch (err) {
    console.error("Error updating page content:", err);
    return {
      success: false as const,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

export async function togglePageSection(
  pageKey: string,
  sectionKey: string,
  visible: boolean
) {
  if (!supabase) return { success: false as const, error: "Supabase not configured" };
  const isAuth = await checkAuth();
  if (!isAuth) return { success: false as const, error: "Unauthorized" };

  try {
    // Fetch current content
    const { data: current, error: fetchErr } = await supabase
      .from("page_content")
      .select("*")
      .eq("page_key", pageKey)
      .order("version", { ascending: false })
      .limit(1)
      .single();

    if (fetchErr) throw fetchErr;
    const row = current as PageContent;
    const content = row.content as Record<string, unknown>;
    const sections = content.sections as Record<string, Record<string, unknown>>;

    if (!sections[sectionKey]) {
      return { success: false as const, error: `Section "${sectionKey}" not found` };
    }

    sections[sectionKey].visible = visible;

    const { data, error } = await supabase
      .from("page_content")
      .update({
        content: { ...content, sections },
        version: row.version + 1,
        updated_at: new Date().toISOString(),
        updated_by: "admin",
      })
      .eq("page_key", pageKey)
      .select()
      .single();

    if (error) throw error;
    return { success: true as const, data: data as PageContent };
  } catch (err) {
    console.error("Error toggling page section:", err);
    return {
      success: false as const,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

// ============================================================================
// CMS: PROJECT ACTIONS
// ============================================================================

export async function getProjects(options?: {
  category?: string;
  featured?: boolean;
  visible?: boolean;
}) {
  if (!supabase) return { success: false as const, error: "Supabase not configured" };
  const isAuth = await checkAuth();
  if (!isAuth) return { success: false as const, error: "Unauthorized" };

  try {
    let query = supabase
      .from("projects")
      .select("*")
      .order("sort_order", { ascending: true });

    if (options?.category) query = query.eq("category", options.category);
    if (options?.featured !== undefined) query = query.eq("featured", options.featured);
    if (options?.visible !== undefined) query = query.eq("visible", options.visible);

    const { data, error } = await query;
    if (error) throw error;
    return { success: true as const, data: (data || []) as ProjectRow[] };
  } catch (err) {
    console.error("Error fetching projects:", err);
    return {
      success: false as const,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

export async function upsertProject(project: Partial<ProjectRow>) {
  if (!supabase) return { success: false as const, error: "Supabase not configured" };
  const isAuth = await checkAuth();
  if (!isAuth) return { success: false as const, error: "Unauthorized" };

  try {
    const { data, error } = await supabase
      .from("projects")
      .upsert(
        [{ ...project, updated_at: new Date().toISOString() }],
        { onConflict: "slug" }
      )
      .select()
      .single();

    if (error) throw error;
    return { success: true as const, data: data as ProjectRow };
  } catch (err) {
    console.error("Error upserting project:", err);
    return {
      success: false as const,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

export async function deleteProject(id: string) {
  if (!supabase) return { success: false as const, error: "Supabase not configured" };
  const isAuth = await checkAuth();
  if (!isAuth) return { success: false as const, error: "Unauthorized" };

  try {
    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (error) throw error;
    return { success: true as const };
  } catch (err) {
    console.error("Error deleting project:", err);
    return {
      success: false as const,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

export async function toggleProjectFeatured(id: string, featured: boolean) {
  if (!supabase) return { success: false as const, error: "Supabase not configured" };
  const isAuth = await checkAuth();
  if (!isAuth) return { success: false as const, error: "Unauthorized" };

  try {
    const { data, error } = await supabase
      .from("projects")
      .update({ featured, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return { success: true as const, data: data as ProjectRow };
  } catch (err) {
    console.error("Error toggling project featured:", err);
    return {
      success: false as const,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

export async function reorderProjects(orderedIds: string[]) {
  if (!supabase) return { success: false as const, error: "Supabase not configured" };
  const isAuth = await checkAuth();
  if (!isAuth) return { success: false as const, error: "Unauthorized" };

  try {
    const updates = orderedIds.map((id, index) =>
      supabase!
        .from("projects")
        .update({ sort_order: index, updated_at: new Date().toISOString() })
        .eq("id", id)
    );

    const results = await Promise.all(updates);
    const failed = results.find((r) => r.error);
    if (failed?.error) throw failed.error;

    return { success: true as const };
  } catch (err) {
    console.error("Error reordering projects:", err);
    return {
      success: false as const,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

// ============================================================================
// CMS: SOCIAL LINK ACTIONS
// ============================================================================

export async function getSocialLinks() {
  if (!supabase) return { success: false as const, error: "Supabase not configured" };
  const isAuth = await checkAuth();
  if (!isAuth) return { success: false as const, error: "Unauthorized" };

  try {
    const { data, error } = await supabase
      .from("social_links")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) throw error;
    return { success: true as const, data: (data || []) as SocialLinkRow[] };
  } catch (err) {
    console.error("Error fetching social links:", err);
    return {
      success: false as const,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

export async function upsertSocialLink(link: Partial<SocialLinkRow>) {
  if (!supabase) return { success: false as const, error: "Supabase not configured" };
  const isAuth = await checkAuth();
  if (!isAuth) return { success: false as const, error: "Unauthorized" };

  try {
    const { data, error } = await supabase
      .from("social_links")
      .upsert(
        [{ ...link, updated_at: new Date().toISOString() }],
        { onConflict: "id" }
      )
      .select()
      .single();

    if (error) throw error;
    return { success: true as const, data: data as SocialLinkRow };
  } catch (err) {
    console.error("Error upserting social link:", err);
    return {
      success: false as const,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

export async function deleteSocialLink(id: string) {
  if (!supabase) return { success: false as const, error: "Supabase not configured" };
  const isAuth = await checkAuth();
  if (!isAuth) return { success: false as const, error: "Unauthorized" };

  try {
    const { error } = await supabase.from("social_links").delete().eq("id", id);
    if (error) throw error;
    return { success: true as const };
  } catch (err) {
    console.error("Error deleting social link:", err);
    return {
      success: false as const,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

// ============================================================================
// CMS: SITE SETTINGS ACTIONS
// ============================================================================

export async function getSiteSetting(key: string) {
  if (!supabase) return { success: false as const, error: "Supabase not configured" };
  const isAuth = await checkAuth();
  if (!isAuth) return { success: false as const, error: "Unauthorized" };

  try {
    const { data, error } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", key)
      .maybeSingle();

    if (error) throw error;
    return {
      success: true as const,
      data: (data as { value: string } | null)?.value ?? null,
    };
  } catch (err) {
    console.error("Error fetching site setting:", err);
    return {
      success: false as const,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

export async function updateSiteSetting(key: string, value: string) {
  if (!supabase) return { success: false as const, error: "Supabase not configured" };
  const isAuth = await checkAuth();
  if (!isAuth) return { success: false as const, error: "Unauthorized" };

  try {
    const { data, error } = await supabase
      .from("site_settings")
      .upsert(
        { key, value, updated_at: new Date().toISOString() },
        { onConflict: "key" }
      )
      .select()
      .single();

    if (error) throw error;
    return { success: true as const, data };
  } catch (err) {
    console.error("Error updating site setting:", err);
    return {
      success: false as const,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

// ============================================================================
// FULL-TEXT SEARCH (Phase 6a)
// ============================================================================

export async function searchContent(
  query: string
): Promise<
  { type: string; id: string; slug: string; title: string; summary: string; rank: number }[]
> {
  if (!supabase) return [];
  const isAuth = await checkAuth();
  if (!isAuth) return [];

  try {
    const { data, error } = await supabase.rpc("search_content", {
      query,
      lim: 20,
    });
    if (error) throw error;
    return (data as { type: string; id: string; slug: string; title: string; summary: string; rank: number }[]) ?? [];
  } catch (err) {
    console.error("Error searching content:", err);
    return [];
  }
}

// ============================================================================
// CONTENT SCHEDULING (Phase 6b)
// ============================================================================

export async function scheduleContent(
  thoughtId: string,
  scheduledAt: string | null
) {
  if (!supabase) return { success: false as const, error: "Supabase not configured" };
  const isAuth = await checkAuth();
  if (!isAuth) return { success: false as const, error: "Unauthorized" };

  try {
    const { error } = await supabase
      .from("thoughts")
      .update({ scheduled_at: scheduledAt })
      .eq("id", thoughtId);
    if (error) throw error;
    return { success: true as const };
  } catch (err) {
    console.error("Error scheduling content:", err);
    return {
      success: false as const,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

export async function getScheduledContent(): Promise<Thought[]> {
  if (!supabase) return [];
  const isAuth = await checkAuth();
  if (!isAuth) return [];

  try {
    const { data, error } = await supabase
      .from("thoughts")
      .select("*")
      .not("scheduled_at", "is", null)
      .eq("published", false)
      .order("scheduled_at", { ascending: true });

    if (error) throw error;
    return (data || []) as Thought[];
  } catch (err) {
    console.error("Error fetching scheduled content:", err);
    return [];
  }
}

// ============================================================================
// CONTENT VERSIONING (Phase 6c)
// ============================================================================

export async function getPageContentVersions(
  pageKey: string
): Promise<{ version: number; content: unknown; updated_at: string }[]> {
  if (!supabase) return [];
  const isAuth = await checkAuth();
  if (!isAuth) return [];

  try {
    const { data } = await supabase
      .from("page_content")
      .select("version_history")
      .eq("page_key", pageKey)
      .maybeSingle();

    return (data as { version_history: { version: number; content: unknown; updated_at: string }[] } | null)?.version_history ?? [];
  } catch (err) {
    console.error("Error fetching page content versions:", err);
    return [];
  }
}

export async function restorePageContentVersion(
  pageKey: string,
  versionContent: unknown
) {
  if (!supabase) return { success: false as const, error: "Supabase not configured" };
  const isAuth = await checkAuth();
  if (!isAuth) return { success: false as const, error: "Unauthorized" };

  try {
    return await updatePageContent(pageKey, versionContent as object);
  } catch (err) {
    console.error("Error restoring page content version:", err);
    return {
      success: false as const,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

// ============================================================================
// CONTACT SUBMISSIONS (Phase 7b)
// ============================================================================

export async function getContactSubmissions() {
  if (!supabase) return [];
  const isAuth = await checkAuth();
  if (!isAuth) return [];

  const { data, error } = await supabase
    .from("contact_submissions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Error fetching contact submissions:", error);
    return [];
  }
  return data ?? [];
}

export async function updateSubmissionStatus(id: string, status: string) {
  if (!supabase) return { success: false as const, error: "Supabase not configured" };
  const isAuth = await checkAuth();
  if (!isAuth) return { success: false as const, error: "Unauthorized" };

  const { error } = await supabase
    .from("contact_submissions")
    .update({ status })
    .eq("id", id);

  if (error) return { success: false as const, error: error.message };
  return { success: true as const };
}
