"use server";

import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import type { Atom, Thought, ContentType, SeriesType, ContentStatus, VoiceMode, Platform, TypefullyDraft, TypefullyQueueSummary } from "@anipotts/types";
import {
  ADMIN_COOKIE,
  ADMIN_COOKIE_OPTIONS,
  verifyAdminPassword,
  fetchAllThoughts,
  upsertThoughtRecord,
  deleteThoughtRecord,
  incrementThoughtViewCount,
  fetchThoughtStats,
} from "@anipotts/lib/admin";

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

export async function login(password: string) {
  const result = verifyAdminPassword(password);
  if (result.success) {
    const cookieStore = await cookies();
    cookieStore.set(ADMIN_COOKIE, "true", ADMIN_COOKIE_OPTIONS);
  }
  return result;
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
