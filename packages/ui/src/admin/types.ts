/**
 * Admin panel scope determines which tabs and content are available.
 * Middleware only sends "all" (www), "thoughts", or "dev".
 */
export type AdminScope =
  | "all"       // www - full access to everything
  | "thoughts"  // thoughts - content management
  | "dev";      // dev - metrics, status, analytics

/**
 * Tab identifiers in the admin panel.
 */
export type AdminTabId =
  | "pipeline"
  | "content"
  | "atoms"
  | "schedule"
  | "config"
  | "site"
  | "analytics"
  | "metrics"
  | "status";

/**
 * Configuration for which tabs are available per scope.
 */
export const SCOPE_TAB_CONFIG: Record<AdminScope, AdminTabId[]> = {
  all: ["pipeline", "content", "atoms", "schedule", "config", "site", "analytics"],
  thoughts: ["pipeline", "content", "atoms", "schedule", "analytics"],
  dev: ["metrics", "status", "analytics"],
};

/**
 * Animation constants for the admin panel (spring physics).
 */
export const ADMIN_ANIMATION_CONFIG = {
  stiffness: 400,
  damping: 35,
  mass: 0.8,
} as const;
