/**
 * Status columns configuration for pipeline view.
 * Note: Full action types are defined in the app's actions.ts files
 * since they depend on @anipotts/types which is app-specific.
 */
export type ContentStatusGroup = "idea" | "draft" | "ready" | "atomized" | "published";

export const STATUS_COLUMNS: { status: ContentStatusGroup; label: string; color: string }[] = [
  { status: "idea", label: "Ideas", color: "text-blue-400" },
  { status: "draft", label: "Drafts", color: "text-yellow-400" },
  { status: "ready", label: "Ready", color: "text-orange-400" },
  { status: "atomized", label: "Atomized", color: "text-purple-400" },
  { status: "published", label: "Published", color: "text-green-400" },
];
