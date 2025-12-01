"use server";

import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const adminPassword = process.env.ADMIN_PASSWORD;

const supabase = createClient(supabaseUrl, supabaseKey);

export async function checkAuth() {
  const cookieStore = await cookies();
  return cookieStore.get("admin_session")?.value === "true";
}

export async function login(password: string) {
  if (password === adminPassword) {
    const cookieStore = await cookies();
    cookieStore.set("admin_session", "true", { httpOnly: true, secure: true, sameSite: "strict" });
    return { success: true };
  }
  return { success: false, error: "Invalid password" };
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete("admin_session");
}

export async function upsertThought(thought: any) {
  const isAuth = await checkAuth();
  if (!isAuth) throw new Error("Unauthorized");

  // Ensure slug is unique if new? Upsert handles it if PK is ID.
  // If we want to update by slug, we need to make sure ID is present or slug is unique constraint.
  
  const { data, error } = await supabase
    .from("thoughts")
    .upsert(thought)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteThought(id: string) {
  const isAuth = await checkAuth();
  if (!isAuth) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("thoughts")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);
}
