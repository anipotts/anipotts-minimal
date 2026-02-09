import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Upload a project image to Supabase Storage.
 *
 * Expects a "project-images" bucket to exist in your Supabase project
 * with public access enabled.
 *
 * @param supabase - An authenticated Supabase client
 * @param file     - The File object to upload
 * @param projectSlug - Slug used as a folder prefix
 * @returns The public URL of the uploaded image, or null on failure
 */
export async function uploadProjectImage(
  supabase: SupabaseClient,
  file: File,
  projectSlug: string,
): Promise<string | null> {
  const ext = file.name.split(".").pop();
  const path = `projects/${projectSlug}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from("project-images")
    .upload(path, file, { upsert: true });

  if (error) {
    console.error("[storage] uploadProjectImage failed:", error.message);
    return null;
  }

  const { data } = supabase.storage
    .from("project-images")
    .getPublicUrl(path);

  return data.publicUrl;
}

/**
 * Delete a project image from Supabase Storage.
 *
 * @param supabase - An authenticated Supabase client
 * @param imageUrl - The full public URL (we extract the path from it)
 * @returns true if deletion succeeded, false otherwise
 */
export async function deleteProjectImage(
  supabase: SupabaseClient,
  imageUrl: string,
): Promise<boolean> {
  // Extract path from the public URL
  // URL format: https://<project>.supabase.co/storage/v1/object/public/project-images/<path>
  const marker = "/storage/v1/object/public/project-images/";
  const idx = imageUrl.indexOf(marker);
  if (idx === -1) return false;

  const path = imageUrl.slice(idx + marker.length);

  const { error } = await supabase.storage
    .from("project-images")
    .remove([path]);

  if (error) {
    console.error("[storage] deleteProjectImage failed:", error.message);
    return false;
  }

  return true;
}
