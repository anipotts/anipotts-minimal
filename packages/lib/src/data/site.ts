/**
 * Canonical site metadata and bio constants.
 * Used by: all app layout.tsx metadata, PersonSchema, OG tags.
 */

export const site = {
  name: "Ani Potts",
  fullName: "Anirudh Pottammal",
  title: "Software Engineer, Structured AI (YC F25)",
  location: "NYC",
  bio: "Software engineer at Structured AI (YC F25) building autonomous agents for construction design automation.",
  shortBio: "software engineer at Structured AI (YC F25)",
  domain: "anipotts.com",
  url: "https://anipotts.com",
  email: "contact@anipotts.com",
  handle: "@anipottsbuilds",
  github: "anipotts",
  headshot: "/images/ani-potts-headshot.png",
  ogImage: "/og-image.png",
} as const;

/** All section definitions for the site */
export const sections = [
  {
    name: "www",
    url: "https://anipotts.com",
    desc: "portfolio & home",
    path: "/home/ani",
    permissions: "drwxr-xr-x",
    hidden: false,
  },
  {
    name: "work",
    url: "https://anipotts.com/work",
    desc: "projects & experiments",
    path: "/home/ani/work",
    permissions: "drwxr-xr-x",
    hidden: false,
  },
  {
    name: "thoughts",
    url: "https://anipotts.com/thoughts",
    desc: "blog & writing",
    path: "/home/ani/thoughts",
    permissions: "drwxr-xr-x",
    hidden: false,
  },
  {
    name: "claude",
    url: "https://anipotts.com/claude",
    desc: "claude code tips",
    path: "/home/ani/claude",
    permissions: "dr-xr-xr-x",
    hidden: false,
  },
] as const;

/** Sections visible in public navigation */
export const publicSections = sections.filter((s) => !s.hidden);
