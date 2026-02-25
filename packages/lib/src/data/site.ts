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
  { name: "work", url: "https://anipotts.com/work", adminUrl: "https://anipotts.com/work", desc: "projects & experiments", path: "/home/ani/work", permissions: "drwxr-xr-x", hidden: false },
  { name: "thoughts", url: "https://anipotts.com/thoughts", adminUrl: "https://thoughts.anipotts.com", desc: "blog & writing", path: "/home/ani/thoughts", permissions: "drwxr-xr-x", hidden: false },
  { name: "connect", url: "https://anipotts.com/connect", adminUrl: "https://anipotts.com/connect", desc: "links & contact", path: "/home/ani/connect", permissions: "drwxr-xr-x", hidden: false },
  { name: "dev", url: "https://anipotts.com/dev", adminUrl: "https://dev.anipotts.com", desc: "engineering dashboard", path: "/home/ani/dev", permissions: "drwxr-xr-x", hidden: false },
  { name: "claude", url: "https://anipotts.com/claude", adminUrl: "https://anipotts.com/claude", desc: "claude code tips", path: "/home/ani/claude", permissions: "dr-xr-xr-x", hidden: false },
] as const;

/** Subdomains visible in public navigation */
export const publicSubdomains = subdomains.filter((s) => !s.hidden);
