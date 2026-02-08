"use server";

import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import type { Thought } from "@anipotts/types";
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

export async function checkAuth() {
  const cookieStore = await cookies();
  return cookieStore.get(ADMIN_COOKIE)?.value === "true";
}

export async function login(password: string) {
  // Pass env var explicitly to ensure Next.js loads it properly in monorepo
  const result = verifyAdminPassword(password, process.env.ADMIN_PASSWORD);
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

export async function getAdminThoughts() {
  if (!supabase) return [];
  const isAuth = await checkAuth();
  if (!isAuth) return [];
  return fetchAllThoughts(supabase);
}

export async function upsertThought(thought: Partial<Thought>) {
  if (!supabase) throw new Error("Supabase not configured");
  const isAuth = await checkAuth();
  if (!isAuth) throw new Error("Unauthorized");
  return upsertThoughtRecord(supabase, thought);
}

export async function deleteThought(id: string) {
  if (!supabase) throw new Error("Supabase not configured");
  const isAuth = await checkAuth();
  if (!isAuth) throw new Error("Unauthorized");
  return deleteThoughtRecord(supabase, id);
}

export async function incrementThoughtViews(slug: string) {
  if (!supabase) return;
  return incrementThoughtViewCount(supabase, slug);
}

export async function getAdminStats() {
  if (!supabase) return null;
  const isAuth = await checkAuth();
  if (!isAuth) return null;
  return fetchThoughtStats(supabase);
}
