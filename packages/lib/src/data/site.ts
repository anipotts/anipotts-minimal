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

/** All subdomain definitions for the ecosystem */
export const subdomains = [
  { name: "www", url: "https://anipotts.com", desc: "portfolio & home", path: "/home/ani/anipotts.com", permissions: "drwxr-xr-x" },
  { name: "thoughts", url: "https://thoughts.anipotts.com", desc: "blog & writing", path: "/home/ani/thoughts.anipotts.com", permissions: "drwxr-xr-x" },
  { name: "dev", url: "https://dev.anipotts.com", desc: "tech stack & tools", path: "/home/ani/dev.anipotts.com", permissions: "drwxr-xr-x" },
  { name: "links", url: "https://links.anipotts.com", desc: "all my links", path: "/home/ani/links.anipotts.com", permissions: "drwxr-xr-x" },
  { name: "updates", url: "https://updates.anipotts.com", desc: "changelog", path: "/home/ani/updates.anipotts.com", permissions: "drwxr-xr-x" },
  { name: "metrics", url: "https://metrics.anipotts.com", desc: "engineering stats", path: "/home/ani/metrics.anipotts.com", permissions: "drwxr-xr-x" },
  { name: "status", url: "https://status.anipotts.com", desc: "system uptime", path: "/home/ani/status.anipotts.com", permissions: "drwxr-xr-x" },
  { name: "lab", url: "https://lab.anipotts.com", desc: "experiments", path: "/home/ani/lab.anipotts.com", permissions: "drwxr-xr-x" },
  { name: "docs", url: "https://docs.anipotts.com", desc: "documentation", path: "/home/ani/docs.anipotts.com", permissions: "dr-xr-xr-x" },
] as const;
