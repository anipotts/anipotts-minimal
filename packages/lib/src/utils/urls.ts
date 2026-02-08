/**
 * Environment-aware URL utilities for subdomain navigation.
 * In development, uses localhost with different ports.
 * In production, uses proper subdomain URLs.
 */

/** Port mapping for local development */
const DEV_PORTS: Record<string, number> = {
  www: 3000,
  thoughts: 3001,
  dev: 3002,
  links: 3003,
  updates: 3004,
  metrics: 3005,
  status: 3006,
  lab: 3007,
  docs: 3008,
};

/** Production URLs */
const PROD_URLS: Record<string, string> = {
  www: "https://anipotts.com",
  thoughts: "https://thoughts.anipotts.com",
  dev: "https://dev.anipotts.com",
  links: "https://links.anipotts.com",
  updates: "https://updates.anipotts.com",
  metrics: "https://metrics.anipotts.com",
  status: "https://status.anipotts.com",
  lab: "https://lab.anipotts.com",
  docs: "https://docs.anipotts.com",
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
 * Get the base URL for a subdomain.
 * Returns localhost URL in development, production URL otherwise.
 */
export function getSubdomainUrl(subdomain: string): string {
  if (isDevelopment()) {
    const port = DEV_PORTS[subdomain] ?? 3000;
    return `http://localhost:${port}`;
  }
  return PROD_URLS[subdomain] ?? `https://${subdomain}.anipotts.com`;
}

/**
 * Get the home (www) URL.
 */
export function getHomeUrl(): string {
  return getSubdomainUrl("www");
}

/**
 * Get all subdomain URLs with their metadata.
 */
export function getAllSubdomainUrls(): Array<{ name: string; url: string }> {
  const subdomains = Object.keys(DEV_PORTS);
  return subdomains.map((name) => ({
    name,
    url: getSubdomainUrl(name),
  }));
}
