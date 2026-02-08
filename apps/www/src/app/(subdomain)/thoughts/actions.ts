"use server";

import { createClient } from "@supabase/supabase-js";
import { incrementThoughtViewCount } from "@anipotts/lib/admin";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase =
  supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

/**
 * Server action to increment thought view count.
 */
export async function incrementThoughtViews(slug: string) {
  if (!supabase) return;
  return incrementThoughtViewCount(supabase, slug);
}
