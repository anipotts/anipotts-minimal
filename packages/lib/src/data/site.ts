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
  { name: "thoughts", url: "https://thoughts.anipotts.com", desc: "blog & writing" },
  { name: "dev", url: "https://dev.anipotts.com", desc: "tech stack & tools" },
  { name: "links", url: "https://links.anipotts.com", desc: "all my links" },
  { name: "updates", url: "https://updates.anipotts.com", desc: "changelog" },
  { name: "metrics", url: "https://metrics.anipotts.com", desc: "engineering stats" },
  { name: "status", url: "https://status.anipotts.com", desc: "system uptime" },
  { name: "lab", url: "https://lab.anipotts.com", desc: "experiments" },
  { name: "docs", url: "https://docs.anipotts.com", desc: "documentation" },
] as const;
