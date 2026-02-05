/**
 * Admin panel scope determines which tabs and content are available.
 * Each subdomain gets a filtered view of the admin interface.
 */
export type AdminScope =
  | "all"       // www - full access to everything
  | "thoughts"  // thoughts subdomain - content management
  | "lab"       // lab subdomain - experiments
  | "docs"      // docs subdomain - documentation
  | "updates"   // updates subdomain - changelog
  | "dev"       // dev subdomain - analytics only
  | "links"     // links subdomain - analytics only
  | "metrics"   // metrics subdomain - metrics view
  | "status";   // status subdomain - status checks

/**
 * Tab identifiers in the admin panel.
 */
export type AdminTabId =
  | "pipeline"
  | "content"
  | "atoms"
  | "schedule"
  | "config"
  | "analytics"
  | "metrics"
  | "status";

/**
 * Configuration for which tabs are available per scope.
 */
export const SCOPE_TAB_CONFIG: Record<AdminScope, AdminTabId[]> = {
  all: ["pipeline", "content", "atoms", "schedule", "config", "analytics"],
  thoughts: ["pipeline", "content", "atoms", "schedule", "analytics"],
  lab: ["pipeline", "content", "analytics"],
  docs: ["pipeline", "content", "analytics"],
  updates: ["pipeline", "content", "analytics"],
  dev: ["analytics"],
  links: ["analytics"],
  metrics: ["metrics", "analytics"],
  status: ["status", "analytics"],
};

/**
 * Animation constants for the admin panel (spring physics).
 */
export const ADMIN_ANIMATION_CONFIG = {
  stiffness: 400,
  damping: 35,
  mass: 0.8,
} as const;
