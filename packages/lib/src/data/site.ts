/**
 * Canonical site metadata and bio constants.
 * Used by: all app layout.tsx metadata, PersonSchema, OG tags.
 */

export const site = {
  name: "Ani Potts",
  fullName: "Anirudh Pottammal",
  title: "Software Engineer",
  location: "NYC",
  bio: "Software engineer based in NYC who builds minimal interfaces to orchestrate complex systems.",
  shortBio: "builds minimal interfaces to orchestrate complex systems",
  domain: "anipotts.com",
  url: "https://anipotts.com",
  email: "contact@anipotts.com",
  handle: "@anipottsbuilds",
  github: "anipotts",
  headshot: "/images/ani-potts-headshot.png",
  ogImage: "/og-image.png",
} as const;

/** All section definitions for the ecosystem */
export const subdomains = [
  { name: "www", url: "https://anipotts.com", adminUrl: "https://anipotts.com", desc: "portfolio & home", path: "/home/ani", permissions: "drwxr-xr-x", hidden: false },
  { name: "thoughts", url: "https://anipotts.com/thoughts", adminUrl: "https://thoughts.anipotts.com", desc: "blog & writing", path: "/home/ani/thoughts", permissions: "drwxr-xr-x", hidden: false },
  { name: "dev", url: "https://anipotts.com/dev", adminUrl: "https://dev.anipotts.com", desc: "tech stack & tools", path: "/home/ani/dev", permissions: "drwxr-xr-x", hidden: false },
  { name: "links", url: "https://anipotts.com/links", adminUrl: "https://links.anipotts.com", desc: "all my links", path: "/home/ani/links", permissions: "drwxr-xr-x", hidden: false },
  { name: "updates", url: "https://anipotts.com/updates", adminUrl: "https://updates.anipotts.com", desc: "changelog", path: "/home/ani/updates", permissions: "drwxr-xr-x", hidden: false },
  { name: "metrics", url: "https://anipotts.com/metrics", adminUrl: "https://metrics.anipotts.com", desc: "engineering stats", path: "/home/ani/metrics", permissions: "drwxr-xr-x", hidden: true },
  { name: "status", url: "https://anipotts.com/status", adminUrl: "https://status.anipotts.com", desc: "system uptime", path: "/home/ani/status", permissions: "drwxr-xr-x", hidden: false },
  { name: "lab", url: "https://anipotts.com/lab", adminUrl: "https://lab.anipotts.com", desc: "experiments", path: "/home/ani/lab", permissions: "drwxr-xr-x", hidden: false },
  { name: "docs", url: "https://anipotts.com/docs", adminUrl: "https://docs.anipotts.com", desc: "documentation", path: "/home/ani/docs", permissions: "dr-xr-xr-x", hidden: false },
] as const;

/** Subdomains visible in public navigation */
export const publicSubdomains = subdomains.filter((s) => !s.hidden);
