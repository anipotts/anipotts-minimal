/**
 * Normalize tags from D1 (can be string, string[], or null) into a clean array.
 */
export function parseTags(tags: string | string[] | null): string[] {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags.map((t) => t.trim()).filter(Boolean);
  return tags
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}
