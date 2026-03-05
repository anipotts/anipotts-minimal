/**
 * Shared Supabase query helpers for atoms (platform-specific posts).
 * Pure async functions that accept a SupabaseClient — no framework deps.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Atom } from "@anipotts/types";
import type { QueryOptions } from "./thoughts";
import { logger } from "../logger";

/** Fetch all atoms, ordered by newest first. */
export async function fetchAllAtoms(
  supabase: SupabaseClient,
  options?: QueryOptions
) {
  let query = supabase
    .from("atoms")
    .select("*")
    .order("created_at", { ascending: false });

  if (options?.subdomain) {
    query = query.eq("subdomain", options.subdomain);
  }

  const { data, error } = await query;

  if (error) {
    logger.error("admin", "Error fetching atoms", { error: String(error) });
    return [];
  }
  return data;
}

/** Fetch atoms for a specific content piece. */
export async function fetchAtomsByContent(
  supabase: SupabaseClient,
  contentId: string,
  options?: QueryOptions
) {
  let query = supabase
    .from("atoms")
    .select("*")
    .eq("content_id", contentId)
    .order("created_at", { ascending: false });

  if (options?.subdomain) {
    query = query.eq("subdomain", options.subdomain);
  }

  const { data, error } = await query;

  if (error) {
    logger.error("admin", "Error fetching atoms", { error: String(error) });
    return [];
  }
  return data;
}

/** Create or update an atom record. Returns the saved record. */
export async function upsertAtomRecord(
  supabase: SupabaseClient,
  atom: Partial<Atom>
) {
  const { data, error } = await supabase
    .from("atoms")
    .upsert([atom], { onConflict: "id" })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/** Delete an atom by ID. */
export async function deleteAtomRecord(supabase: SupabaseClient, id: string) {
  const { error } = await supabase.from("atoms").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
