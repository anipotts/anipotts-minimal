/**
 * URL utilities for section navigation.
 * All public pages are now same-origin at anipotts.com/*.
 */

/** Section name to path mapping */
const SECTION_PATHS: Record<string, string> = {
  www: "/",
  thoughts: "/thoughts",
  dev: "/dev",
  links: "/links",
  updates: "/updates",
  metrics: "/metrics",
  status: "/status",
  lab: "/lab",
  docs: "/docs",
};

/**
 * Check if we're in development mode.
 * Works both server-side (process.env) and client-side (window.location).
 */
export function isDevelopment(): boolean {
  // Server-side check
  if (typeof window === "undefined") {
    return process.env.NODE_ENV === "development";
  }
  // Client-side check - localhost or 127.0.0.1
  return (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  );
}

/**
 * Get the path for a section. All sections are same-origin paths now.
 * @param section - The section name (e.g., "thoughts", "dev")
 * @returns The path (e.g., "/thoughts")
 */
export function getSectionUrl(section: string): string {
  return SECTION_PATHS[section] ?? `/${section}`;
}

/** @deprecated Use getSectionUrl instead */
export const getSubdomainUrl = getSectionUrl;

/**
 * Get the home URL path.
 */
export function getHomeUrl(): string {
  return "/";
}

/**
 * Get all section URLs with their metadata.
 */
export function getAllSectionUrls(): Array<{ name: string; url: string }> {
  return Object.entries(SECTION_PATHS).map(([name, url]) => ({
    name,
    url,
  }));
}

/** @deprecated Use getAllSectionUrls instead */
export const getAllSubdomainUrls = getAllSectionUrls;
