export const siteConfig = {
  name: "Ani Potts",
  fullName: "Anirudh Pottammal",
  title: "Software Engineer",
  location: "NYC",
  bio: "ani potts. what i'm building, writing, and running. mostly with claude code.",
  shortBio: "ani potts, nyc",
  url: "https://anipotts.com",
  domain: "anipotts.com",
  email: "contact@anipotts.com",
  handle: "@anipottsbuilds",
  github: "anipotts",
  ogImage: "/og-image.png",
  headshot: "/images/ani-potts-headshot.png",
  version: "4.0.0",
} as const;

export const navItems = [
  { name: "writing", path: "/writing" },
  { name: "shipping", path: "/shipping" },
  { name: "running", path: "/running" },
  { name: "orchestrating", path: "/orchestrating" },
  { name: "connect", path: "/connect" },
] as const;

export interface SocialLink {
  name: string;
  url: string;
  icon: string;
  description: string;
}

/** canonical social/contact links. icon = phosphor glyph name. */
export const socialLinks: SocialLink[] = [
  {
    name: "email",
    url: "mailto:contact@anipotts.com",
    icon: "ph:envelope-simple",
    description: "contact@anipotts.com",
  },
  {
    name: "github",
    url: "https://github.com/anipotts",
    icon: "ph:github-logo",
    description: "@anipotts",
  },
  {
    name: "github sponsors",
    url: "https://github.com/sponsors/anipotts",
    icon: "ph:heart",
    description: "sponsors/anipotts",
  },
  {
    name: "linkedin",
    url: "https://www.linkedin.com/in/anipotts",
    icon: "ph:linkedin-logo",
    description: "anipotts",
  },
  {
    name: "x",
    url: "https://x.com/anipottsbuilds",
    icon: "ph:x-logo",
    description: "@anipottsbuilds",
  },
  {
    name: "instagram",
    url: "https://instagram.com/anipottsbuilds",
    icon: "ph:instagram-logo",
    description: "@anipottsbuilds",
  },
  {
    name: "tiktok",
    url: "https://tiktok.com/@anipottsbuilds",
    icon: "ph:tiktok-logo",
    description: "@anipottsbuilds",
  },
  {
    name: "mastodon",
    url: "https://mastodon.social/@anipotts",
    icon: "ph:butterfly",
    description: "@anipotts@mastodon.social",
  },
  {
    name: "newsletter",
    url: "https://news.anipotts.com",
    icon: "ph:envelope-open",
    description: "Ani Potts Builds",
  },
  {
    name: "buy me a coffee",
    url: "https://buymeacoffee.com/anipotts",
    icon: "ph:coffee",
    description: "buymeacoffee.com/anipotts",
  },
];

export const homeContent = {
  heading: "hi, i'm ani",
  summary: "what i'm building, writing, and running. mostly with claude code.",
  press: {
    href: "https://www.businessinsider.com/ai-usage-limits-causing-some-to-restructure-their-workday-2026-4",
    label: "business insider, 2026",
  },
} as const;
