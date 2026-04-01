export const siteConfig = {
  name: "Ani Potts",
  fullName: "Anirudh Pottammal",
  title: "Software Engineer",
  location: "NYC",
  bio: "Software engineer building agent orchestration platforms. Shares workflow tips and open source tools for Claude Code.",
  shortBio: "software engineer, nyc",
  url: "https://anipotts.com",
  domain: "anipotts.com",
  email: "contact@anipotts.com",
  handle: "@anipottsbuilds",
  github: "anipotts",
  ogImage: "/og-image.png",
  headshot: "/images/ani-potts-headshot.png",
  version: "3.0.1",
} as const;

export interface NavItem {
  name: string;
  path: string;
  section: "www" | "work" | "thoughts" | "claude" | "connect";
  cta?: boolean;
}

export const navItems: NavItem[] = [
  { name: "index", path: "/", section: "www" },
  { name: "work", path: "/work", section: "work" },
  { name: "thoughts", path: "/thoughts", section: "thoughts" },
  { name: "claude", path: "/claude", section: "claude" },
  { name: "connect", path: "/connect", section: "connect", cta: true },
];

export const navSections = navItems.map((item) => item.section);
