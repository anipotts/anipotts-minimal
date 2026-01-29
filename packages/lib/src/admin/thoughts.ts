/**
 * Shared Supabase query helpers for the thoughts/blog system.
 * Pure async functions that accept a SupabaseClient — no framework deps.
 * Each app's server actions call these after checking auth.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

/** Fetch all thoughts (admin view, includes drafts), ordered by newest first. */
export async function fetchAllThoughts(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("thoughts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching admin thoughts:", error);
    return [];
  }
  return data;
}

/** Create or update a thought record. Returns the saved record. */
export async function upsertThoughtRecord(
  supabase: SupabaseClient,
  thought: Record<string, unknown>,
) {
  const { data, error } = await supabase
    .from("thoughts")
    .upsert(thought)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/** Delete a thought by ID. */
export async function deleteThoughtRecord(
  supabase: SupabaseClient,
  id: string,
) {
  const { error } = await supabase.from("thoughts").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/** Increment view count for a thought by slug (atomic RPC with fallback). */
export async function incrementThoughtViewCount(
  supabase: SupabaseClient,
  slug: string,
) {
  // Try RPC first (atomic increment)
  const { error } = await supabase.rpc("increment_thought_views", {
    thought_slug: slug,
  });

  if (error) {
    // Fallback: Read-Modify-Write (not atomic, but works without custom SQL functions)
    const { data: thought } = await supabase
      .from("thoughts")
      .select("views")
      .eq("slug", slug)
      .single();

    if (thought) {
      await supabase
        .from("thoughts")
        .update({ views: (thought.views || 0) + 1 })
        .eq("slug", slug);
    }
  }
}

/** Fetch aggregated stats for the admin analytics monitor. */
export async function fetchThoughtStats(supabase: SupabaseClient) {
  const { data: thoughts, error } = await supabase
    .from("thoughts")
    .select("id, title, slug, views, published, created_at")
    .order("views", { ascending: false });

  if (error) {
    console.error("Error fetching stats:", error);
    return null;
  }

  const totalViews = thoughts.reduce(
    (acc: number, t: { views?: number }) => acc + (t.views || 0),
    0,
  );
  const totalThoughts = thoughts.length;
  const publishedCount = thoughts.filter(
    (t: { published?: boolean }) => t.published,
  ).length;
  const draftCount = totalThoughts - publishedCount;
  const topThoughts = thoughts.slice(0, 5);

  return {
    totalViews,
    totalThoughts,
    publishedCount,
    draftCount,
    topThoughts,
  };
}
